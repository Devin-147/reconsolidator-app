// FILE: api/save-and-generate-narratives.ts
// UPGRADED: The complete "Video Factory" brain.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Promisify the exec function to use it with async/await
const execAsync = promisify(exec);

// --- Initialize External Services ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// --- Main API Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // --- Respond to the user immediately ---
  // This is CRITICAL. We tell the user's browser "We got your request!" 
  // and then continue processing in the background.
  res.status(202).json({ message: 'Narrative processing has started in the background.' });

  try {
    const { userEmail, narratives, treatmentNumber } = req.body as { userEmail: string; narratives: any[]; treatmentNumber: number };

    if (!userEmail || !narratives || narratives.length !== 11) {
      console.error('[API ERROR] Invalid request body:', req.body);
      return; // Stop processing, but user's browser is already disconnected
    }

    console.log(`[VIDEO FACTORY] Started for user: ${userEmail}, Treatment: ${treatmentNumber}`);

    // --- Step 1: Check for Premium Access & Get Visual ID ---
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('access_level, ai_description')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      console.error(`[VIDEO FACTORY] User not found or error fetching: ${userEmail}`, userError);
      return;
    }

    if (user.access_level !== 'premium_lifetime' || !user.ai_description) {
      console.log(`[VIDEO FACTORY] User ${userEmail} is not premium or has no AI description. Skipping video generation.`);
      // In a real app, we would still save the text narratives here.
      return;
    }

    const aiDescription = user.ai_description;
    console.log(`[VIDEO FACTORY] Premium user confirmed. AI Description: "${aiDescription}"`);

    // --- Step 2: Loop Through Narratives & Generate Videos ---
    for (let i = 0; i < narratives.length; i++) {
      const narrative = narratives[i];
      const narrativeIndex = i + 1;
      
      console.log(`[VIDEO FACTORY] >> Generating video ${narrativeIndex}/11 for "${narrative.title}"...`);

      // --- Step 2a: Generate Video ---
      // NOTE: This is a placeholder for the actual Google AI Video API call.
      // As of now, Google's video models (like Veo) are not yet available via a public API.
      // We will simulate the video generation by creating a dummy video file.
      // WHEN THE API IS RELEASED, WE WILL SWAP THIS BLOCK WITH THE REAL API CALL.
      
      const videoPrompt = `A photorealistic, cinematic 45-second scene with dramatic, soft lighting. A character who is a lifelike rendering of a ${aiDescription}. Detailed skin texture, realistic hair, subtle facial expressions. The scene depicts them experiencing: ${narrative.description}. Shot on an Arri Alexa camera, 8k, sharp focus.`;
      
      // --- SIMULATED VIDEO GENERATION ---
      const tempDir = os.tmpdir();
      const videoFileName = `narrative_${treatmentNumber}_${narrativeIndex}.mp4`;
      const videoFilePath = path.join(tempDir, videoFileName);
      // This command creates a silent, 5-second black video with text. It's our placeholder.
      await execAsync(`ffmpeg -f lavfi -i color=c=black:s=1280x720:d=5 -vf "drawtext=text='${narrative.title}':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" ${videoFilePath}`);
      console.log(`[VIDEO FACTORY] >> (Simulated) Video file created at: ${videoFilePath}`);
      // --- END SIMULATION ---
      
      // In a real scenario, we'd get a videoURL from the Google API. Here we will upload our dummy file.
      const videoFileBuffer = await fs.readFile(videoFilePath);
      const { data: videoUploadData, error: videoUploadError } = await supabase.storage
        .from('narrative_assets') // Assumes you have a Supabase Storage bucket named 'narrative_assets'
        .upload(`videos/${userEmail}/${videoFileName}`, videoFileBuffer, { upsert: true, contentType: 'video/mp4' });
      
      if (videoUploadError) throw videoUploadError;
      const videoUrl = supabase.storage.from('narrative_assets').getPublicUrl(videoUploadData.path).data.publicUrl;
      console.log(`[VIDEO FACTORY] >> Video uploaded to Supabase Storage: ${videoUrl}`);

      // --- Step 2b: Generate Thumbnail ---
      const thumbFileName = `thumb_${treatmentNumber}_${narrativeIndex}.jpg`;
      const thumbFilePath = path.join(tempDir, thumbFileName);
      await execAsync(`ffmpeg -i ${videoFilePath} -ss 00:00:01 -vframes 1 ${thumbFilePath}`);
      
      const thumbFileBuffer = await fs.readFile(thumbFilePath);
      const { data: thumbUploadData, error: thumbUploadError } = await supabase.storage
        .from('narrative_assets')
        .upload(`thumbnails/${userEmail}/${thumbFileName}`, thumbFileBuffer, { upsert: true, contentType: 'image/jpeg' });

      if (thumbUploadError) throw thumbUploadError;
      const thumbnailUrl = supabase.storage.from('narrative_assets').getPublicUrl(thumbUploadData.path).data.publicUrl;
      console.log(`[VIDEO FACTORY] >> Thumbnail uploaded to Supabase Storage: ${thumbnailUrl}`);


      // --- Step 2c: Save URLs to Database ---
      const { error: dbError } = await supabase
        .from('narratives')
        .upsert({
          session_id: `${userEmail}_t${treatmentNumber}`,
          narrative_index: narrativeIndex,
          title: narrative.title,
          description: narrative.description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
        }, { onConflict: 'session_id, narrative_index' }); // This prevents duplicates if run again

      if (dbError) throw dbError;
      console.log(`[VIDEO FACTORY] >> Saved URLs for narrative ${narrativeIndex} to database.`);
      
      // Clean up temporary files
      await fs.unlink(videoFilePath);
      await fs.unlink(thumbFilePath);
    }

    console.log(`[VIDEO FACTORY] Successfully generated all 11 videos for user: ${userEmail}`);

  } catch (error) {
    console.error('[VIDEO FACTORY ERROR] A background error occurred:', error);
    // We can't send a response to the user, but this log is crucial for debugging.
  }
}
