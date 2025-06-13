// FILE: api/generate-narration-audio.ts (Corrected SUPABASE_SERVICE_KEY usage)

console.log("--------------------------------------------------------------------");
console.log("[API generate-narration-audio] MODULE LOADED. Checking process.env...");
console.log("  NODE_ENV:", process.env.NODE_ENV);
console.log("  VERCEL_ENV (from vercel dev/deploy):", process.env.VERCEL_ENV);
console.log("  SUPABASE_URL (expected for server):", process.env.SUPABASE_URL ? `SET: ${process.env.SUPABASE_URL.substring(0,20)}...` : "NOT SET or empty");
// Corrected the key name here for logging to match Vercel Dashboard name
console.log("  SUPABASE_SERVICE_KEY (expected for server):", process.env.SUPABASE_SERVICE_KEY ? "SET (exists, first 10 chars): " + process.env.SUPABASE_SERVICE_KEY.substring(0,10) + "..." : "NOT SET or empty");
console.log("  GOOGLE_PROJECT_ID (expected for server):", process.env.GOOGLE_PROJECT_ID ? `SET: ${process.env.GOOGLE_PROJECT_ID}` : "NOT SET or empty");
console.log("  GOOGLE_CREDENTIALS_JSON (exists check):", process.env.GOOGLE_CREDENTIALS_JSON ? `Exists (length: ${process.env.GOOGLE_CREDENTIALS_JSON.length}, first 20: ${process.env.GOOGLE_CREDENTIALS_JSON.substring(0,20)}...)` : "NOT SET or empty");
console.log("  RESEND_API_KEY (exists check):", process.env.RESEND_API_KEY ? "SET (exists, first 10 chars): " + process.env.RESEND_API_KEY.substring(0,10) + "..." : "NOT SET or empty");
console.log("  VITE_SUPABASE_URL (frontend var, for comparison):", process.env.VITE_SUPABASE_URL ? "SET" : "NOT SET or empty");
console.log("--------------------------------------------------------------------");

import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Initialize Google TTS Client ---
let ttsClient: TextToSpeechClient | null = null;
let ttsInitError: string | null = null;
try {
    console.log("[API generate-narration-audio] Attempting Google TTS Client Init...");
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    const projectId = process.env.GOOGLE_PROJECT_ID;

    if (!credentialsJson) throw new Error('Missing GOOGLE_CREDENTIALS_JSON env variable.');
    if (!projectId) throw new Error('Missing GOOGLE_PROJECT_ID env variable.');
    
    let credentials;
    try { credentials = JSON.parse(credentialsJson); } 
    catch (parseError: any) {
        console.error("[API generate-narration-audio] TTS Init Error: Failed to parse GOOGLE_CREDENTIALS_JSON.", parseError.message);
        throw new Error('Invalid GOOGLE_CREDENTIALS_JSON format.');
    }
    ttsClient = new TextToSpeechClient({ credentials, projectId });
    console.log("[API generate-narration-audio] Google TTS Client Initialized OK.");
} catch (error: any) {
    ttsInitError = `TTS Client Init Error: ${error.message}`; 
    if (!ttsInitError.includes('Missing') && !ttsInitError.includes('Invalid')) {
       console.error("[API generate-narration-audio] Broader TTS Client Init Error:", ttsInitError, error);
    }
}
// --- End TTS Client Init ---

// --- Initialize Supabase Admin Client (for Storage) ---
let supabaseAdmin: SupabaseClient | null = null;
let supabaseInitError: string | null = null;
try {
    console.log("[API generate-narration-audio] Attempting Supabase Admin Client Init...");
    const supabaseUrl_server = process.env.SUPABASE_URL;
    // <<< --- CRITICAL CHANGE HERE --- >>>
    const supabaseServiceKey_server = process.env.SUPABASE_SERVICE_KEY; // Was SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl_server) throw new Error('Missing Supabase URL (server-side) env variable.');
    if (!supabaseServiceKey_server) throw new Error('Missing Supabase Service Key (server-side) env variable.'); // Message updated

    supabaseAdmin = createClient(supabaseUrl_server, supabaseServiceKey_server, { auth: { persistSession: false } });
    console.log("[API generate-narration-audio] Supabase Admin Client Initialized OK.");
} catch(e: any) {
    supabaseInitError = `Supabase Admin Init Error: ${e.message}`; 
    if (!supabaseInitError.includes('Missing')) {
        console.error("[API generate-narration-audio] Broader Supabase Admin Init Error:", supabaseInitError, e);
    }
}
// --- End Supabase Client Init ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log(`[API generate-narration-audio] Handler invoked. User: ${req.body?.userId}, T#: ${req.body?.treatmentNumber}, N#: ${req.body?.narrativeIndex}`);
    
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    if (ttsInitError || !ttsClient) {
        console.error("[API gna] Handler Error: TTS client NA:", ttsInitError);
        return res.status(500).json({ error: ttsInitError || 'TTS client setup failed.' });
    }
    if (supabaseInitError || !supabaseAdmin) {
        console.error("[API gna] Handler Error: Supabase admin client NA:", supabaseInitError);
        return res.status(500).json({ error: supabaseInitError || 'Supabase admin client setup failed.' });
    }

    const { text, userId, treatmentNumber, narrativeIndex, voiceName, speakingRate, pitch } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) return res.status(400).json({ error: 'Invalid text.' });
    if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'Invalid userId.' });
    if (typeof treatmentNumber !== 'number') return res.status(400).json({ error: 'Invalid treatmentNumber.' });
    if (typeof narrativeIndex !== 'number') return res.status(400).json({ error: 'Invalid narrativeIndex.' });
    
    try {
         console.log(`[API gna] Auth check for: ${userId}`);
         const { data: userData, error: userError } = await supabaseAdmin.from('users').select('status, has_paid').eq('email', userId).single();
         if (userError) throw new Error(`DB auth check error: ${userError.message}`);
         if (!userData) return res.status(403).json({ error: 'User not found for AI narration.' });
         if (!(userData.status === 'paid' || userData.has_paid === true)) {
             return res.status(403).json({ error: 'Paid access required for AI narration.' });
         }
         console.log(`[API gna] User ${userId} paid. TTS proceed.`);
    } catch (error: any) { console.error(`[API gna] User status error ${userId}:`, error); return res.status(500).json({ error: `User status verify fail: ${error.message}` }); }
    
    const selectedVoice = typeof voiceName === 'string' && voiceName.trim() !== '' ? voiceName : 'en-US-Neural2-J';
    const ttsRequest = { /* ... (same as your last version) ... */ };
    // For brevity, using your last complete TTS request object structure
    const ttsRequestObj = { 
        input: { text: text }, 
        voice: { languageCode: selectedVoice.substring(0, 5), name: selectedVoice }, 
        audioConfig: { 
            audioEncoding: 'MP3' as const, 
            speakingRate: typeof speakingRate === 'number' && speakingRate >= 0.25 && speakingRate <= 4.0 ? speakingRate : 1.0, 
            pitch: typeof pitch === 'number' && pitch >= -20.0 && pitch <= 20.0 ? pitch : 0 
        }, 
    };


    try {
        console.log(`[API gna] Google TTS req: T${treatmentNumber}-N${narrativeIndex + 1} u:${userId}`);
        const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequestObj);
        if (!ttsResponse.audioContent) throw new Error('Google TTS empty audio.');
        const audioBuffer = Buffer.from(ttsResponse.audioContent as (string | Uint8Array)); // Simpler cast
        
        const BUCKET_NAME = 'narrations';
        const filePath = `${userId}/treatment_${treatmentNumber}/narration_script_${narrativeIndex + 1}.mp3`;
        console.log(`[API gna] Uploading ${filePath} to '${BUCKET_NAME}'.`);
        const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(filePath, audioBuffer, { upsert: true, contentType: 'audio/mpeg' });
        if (uploadError) throw new Error(`Supabase upload error: ${uploadError.message}`);
        
        const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        if (!urlData?.publicUrl) throw new Error('Could not get public URL.');
        console.log(`[API gna] Audio ready: ${urlData.publicUrl}`);
        res.status(200).json({ audioUrl: urlData.publicUrl });
    } catch (error: any) {
        console.error('[API gna] TTS/Upload process error:', error);
        res.status(500).json({ error: `Narration fail: ${error.message}` });
    }
}