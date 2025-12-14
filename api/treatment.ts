// FILE: api/treatment.ts
// FINAL CORRECTED VERSION: Implements the "Dual Generation" plan.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// --- Handler for Saving Narratives & Generating Long-Form Videos ---
async function handleSaveAndGenerate(req: VercelRequest, res: VercelResponse) {
    res.status(202).json({ message: 'Video generation started.' }); // Respond immediately
    const { userEmail, narratives, treatmentNumber } = req.body.payload;

    const { data: user } = await supabaseAdmin.from('users').select('access_level, ai_description').eq('email', userEmail).single();
    if (user?.access_level !== 'premium_lifetime' || !user.ai_description) return;
    
    for (let i = 0; i < narratives.length; i++) {
        const narrative = narratives[i];
        const videoPrompt = `A 45-second cinematic scene... The camera perspective is Third-Person, showing a character who is a lifelike rendering of a ${user.ai_description}...`;
        
        // --- SIMULATED VIDEO GENERATION ---
        const tempDir = os.tmpdir();
        const videoFileName = `narrative_${treatmentNumber}_${i}.mp4`;
        const videoFilePath = path.join(tempDir, videoFileName);
        await execAsync(`ffmpeg -f lavfi -i color=c=black:s=1280x720:d=45 -vf "drawtext=text='${narrative.title} (3rd Person)':... " ${videoFilePath}`);
        
        const videoFileBuffer = await fs.readFile(videoFilePath);
        const { data: videoUploadData } = await supabaseAdmin.storage.from('narrative_assets').upload(`videos/${userEmail}/${videoFileName}`, videoFileBuffer, { upsert: true });
        if (!videoUploadData) continue;
        const videoUrl = supabaseAdmin.storage.from('narrative_assets').getPublicUrl(videoUploadData.path).data.publicUrl;

        const thumbFileName = `thumb_${treatmentNumber}_${i}.jpg`;
        const thumbFilePath = path.join(tempDir, thumbFileName);
        await execAsync(`ffmpeg -i ${videoFilePath} -ss 00:00:01 -vframes 1 ${thumbFilePath}`);
        
        const thumbFileBuffer = await fs.readFile(thumbFilePath);
        const { data: thumbUploadData } = await supabaseAdmin.storage.from('narrative_assets').upload(`thumbnails/${userEmail}/${thumbFileName}`, thumbFileBuffer, { upsert: true });
        if (!thumbUploadData) continue;
        const thumbnailUrl = supabaseAdmin.storage.from('narrative_assets').getPublicUrl(thumbUploadData.path).data.publicUrl;

        await supabaseAdmin.from('narratives').upsert({
            session_id: `${userEmail}_t${treatmentNumber}`,
            narrative_index: i + 1,
            title: narrative.title,
            description: narrative.description,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
        }, { onConflict: 'session_id, narrative_index' });
        
        await fs.unlink(videoFilePath);
        await fs.unlink(thumbFilePath);
    }
}

// --- Handler for Generating First-Person Reversed Clips ---
async function handleGenerateReversedClips(req: VercelRequest, res: VercelResponse) {
    const { userEmail, treatmentNumber, indices, memory1, memory2, sessionTargetEvent } = req.body.payload;
    const { data: user } = await supabaseAdmin.from('users').select('ai_description').eq('email', userEmail).single();
    if (!user?.ai_description) return res.status(403).json({ error: "User is not premium or missing AI description." });
    
    const { data: narrativesData } = await supabaseAdmin.from('narratives').select('narrative_index, title, description').eq('session_id', `${userEmail}_t${treatmentNumber}`);
    if (!narrativesData) return res.status(404).json({ error: "Original narratives not found." });

    const reversedClips = [];
    for (const index of indices) {
        const originalNarrative = narrativesData.find(n => n.narrative_index === index + 1);
        if (!originalNarrative) continue;

        const reversedScriptText = `${memory2}\nThen, ${originalNarrative.description}\nThen, ${sessionTargetEvent}\nThen, ${memory1}`;
        const videoPrompt = `Generate a 5-second, clear and structured video from a First-Person point of view (seeing through your own eyes). The scene is a high-speed rewind of the following experience: ${reversedScriptText}`;
        
        // --- SIMULATED VIDEO GENERATION ---
        const tempDir = os.tmpdir();
        const videoFileName = `reversed_${treatmentNumber}_${index}.mp4`;
        const videoFilePath = path.join(tempDir, videoFileName);
        await execAsync(`ffmpeg -f lavfi -i color=c=blue:s=1280x720:d=5 -vf "drawtext=text='${originalNarrative.title} (1st Person Rewind)':... " ${videoFilePath}`);
        
        const videoFileBuffer = await fs.readFile(videoFilePath);
        const { data: uploadData } = await supabaseAdmin.storage.from('narrative_assets').upload(`reversed_clips/${userEmail}/${videoFileName}`, videoFileBuffer, { upsert: true });
        if (!uploadData) continue;
        const videoUrl = supabaseAdmin.storage.from('narrative_assets').getPublicUrl(uploadData.path).data.publicUrl;

        reversedClips.push({ originalIndex: index, videoUrl: videoUrl });
        await fs.unlink(videoFilePath);
    }

    return res.status(200).json({ clips: reversedClips });
}

// --- Handler for Completing a Treatment ---
async function handleCompleteTreatment(req: VercelRequest, res: VercelResponse) {
    const { userEmail, treatmentNumber, finalSuds, initialSuds } = req.body.payload;
    const updates: any = { current_suds: finalSuds, last_treatment_completed_at: new Date().toISOString() };
    if (treatmentNumber === 1) updates.initial_suds = initialSuds;
    await supabaseAdmin.from('users').update(updates).eq('email', userEmail);
    return res.status(200).json({ message: 'Treatment progress saved.' });
}

// --- Main API Router ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { action } = req.body;
    try {
        switch (action) {
            case 'saveAndGenerate':
                return await handleSaveAndGenerate(req, res);
            case 'generateReversedClips':
                return await handleGenerateReversedClips(req, res);
            case 'completeTreatment':
                return await handleCompleteTreatment(req, res);
            default:
                return res.status(400).json({ error: 'Invalid action.' });
        }
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
