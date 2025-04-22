// api/generate-narration-audio.ts
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Writable } from 'stream'; // Keep for potential future use, not needed for Buffer upload

// --- Initialize Google TTS Client ---
let ttsClient: TextToSpeechClient | null = null;
let ttsInitError: string | null = null;
try {
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
    const projectId = process.env.GOOGLE_PROJECT_ID;
    if (!credentialsJson) throw new Error('Missing GOOGLE_CREDENTIALS_JSON env variable.');
    if (!projectId) throw new Error('Missing GOOGLE_PROJECT_ID env variable.');
    const credentials = JSON.parse(credentialsJson);
    ttsClient = new TextToSpeechClient({ credentials, projectId });
    console.log("Google TTS Client Initialized OK.");
} catch (error: any) {
    ttsInitError = `TTS Client Init Error: ${error.message}`; console.error(ttsInitError, error);
}
// --- End TTS Client Init ---

// --- Initialize Supabase Admin Client (for Storage) ---
let supabaseAdmin: SupabaseClient | null = null;
let supabaseInitError: string | null = null;
try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase URL/Service Key env variables.');
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    console.log("Supabase Admin Client Initialized OK.");
} catch(e: any) {
    supabaseInitError = `Supabase Admin Init Error: ${e.message}`; console.error(supabaseInitError, e);
}
// --- End Supabase Client Init ---


export default async function handler(req: VercelRequest, res: VercelResponse) {
    // --- Initial Checks ---
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    if (ttsInitError || !ttsClient) return res.status(500).json({ error: ttsInitError || 'TTS client not available.' });
    if (supabaseInitError || !supabaseAdmin) return res.status(500).json({ error: supabaseInitError || 'Supabase admin client not available.' });
    // --- End Initial Checks ---

    // --- Request Body Validation ---
    const { text, userId, treatmentNumber, narrativeIndex, voiceName, speakingRate, pitch } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) return res.status(400).json({ error: 'Missing or invalid "text".' });
    if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'Missing or invalid "userId".' });
    if (typeof treatmentNumber !== 'number') return res.status(400).json({ error: 'Missing or invalid "treatmentNumber".' });
    if (typeof narrativeIndex !== 'number') return res.status(400).json({ error: 'Missing or invalid "narrativeIndex".' });
    // --- End Validation ---

    // --- Backend Auth Check (Optional but Recommended) ---
    try {
         console.log(`Verifying paid status for user: ${userId}`);
         const { data: userData, error: userError } = await supabaseAdmin.from('users').select('status, has_paid').eq('email', userId).single(); // Adjust column/lookup as needed
         if (userError) throw userError;
         if (!userData || !(userData.status === 'paid' || userData.has_paid === true)) {
             console.warn(`User ${userId} attempted TTS without paid status.`); return res.status(403).json({ error: 'Paid access required for AI narration.' });
         }
         console.log(`User ${userId} verified as paid. Proceeding.`);
    } catch (error: any) { console.error(`Error checking user status for ${userId}:`, error); return res.status(500).json({ error: `Failed to verify user status: ${error.message}` }); }
    // --- End Auth Check ---

    // --- Prepare TTS Request ---
    const selectedVoice = typeof voiceName === 'string' ? voiceName : 'en-US-Neural2-J';
    const selectedRate = typeof speakingRate === 'number' && speakingRate >= 0.25 && speakingRate <= 4.0 ? speakingRate : 1.0;
    const selectedPitch = typeof pitch === 'number' && pitch >= -20.0 && pitch <= 20.0 ? pitch : 0;
    const ttsRequest = { input: { text: text }, voice: { languageCode: selectedVoice.substring(0, 5), name: selectedVoice }, audioConfig: { audioEncoding: 'MP3' as const, speakingRate: selectedRate, pitch: selectedPitch }, };

    // --- Generate TTS and Upload ---
    try {
        console.log(`Requesting TTS for T${treatmentNumber}-N${narrativeIndex + 1} user ${userId}`);
        const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);

        if (!ttsResponse.audioContent) throw new Error('Google TTS returned empty audio.');

        // --- FIX: Handle string (Base64) or Uint8Array ---
        let audioBuffer: Buffer;
        if (typeof ttsResponse.audioContent === 'string') {
            audioBuffer = Buffer.from(ttsResponse.audioContent, 'base64');
            console.log("TTS audio content was base64 string.");
        } else {
            // Assume Uint8Array or Buffer
            audioBuffer = Buffer.from(ttsResponse.audioContent);
            console.log("TTS audio content was Uint8Array/Buffer.");
        }
        // --- END FIX ---

        const BUCKET_NAME = 'narrations'; // <<<=== YOUR BUCKET NAME
        const filePath = `${userId}/treatment_${treatmentNumber}/narration_${narrativeIndex + 1}.mp3`;

        console.log(`Uploading ${filePath} to bucket ${BUCKET_NAME}... Size: ${audioBuffer.length} bytes`);
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(filePath, audioBuffer, { upsert: true, contentType: 'audio/mpeg' });
        if (uploadError) throw new Error(`Supabase Storage upload error: ${uploadError.message}`);

        console.log(`Getting public URL for ${filePath}...`);
        const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        if (!urlData || !urlData.publicUrl) throw new Error('Could not get public URL.');
        const publicAudioUrl = urlData.publicUrl;
        console.log(`Audio ready at: ${publicAudioUrl}`);

        res.status(200).json({ audioUrl: publicAudioUrl });

    } catch (error: any) {
        console.error('Error in TTS/Upload process:', error);
        res.status(500).json({ error: `Failed to generate/save narration: ${error.message}` });
    }
}