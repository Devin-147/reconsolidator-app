// FILE: api/generate-reversed-clips.ts
// NEW: The "Reversal Factory" brain. Processes videos to create short, reversed clips.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// --- Initialize Supabase ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Main API Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userEmail, treatmentNumber, indices } = req.body as { userEmail: string; treatmentNumber: number; indices: number[] };

    if (!userEmail || !treatmentNumber || !indices || indices.length !== 8) {
      return res.status(400).json({ error: 'Invalid request: requires userEmail, treatmentNumber, and 8 indices.' });
    }

    console.log(`[REVERSAL FACTORY] Started for user: ${userEmail}, Treatment: ${treatmentNumber}`);
    const sessionId = `${userEmail}_t${treatmentNumber}`;

    // --- Step 1: Fetch the original, long-form video URLs ---
    const { data: narratives, error: fetchError } = await supabase
      .from('narratives')
      .select('narrative_index, video_url')
      .eq('session_id', sessionId)
      .in('narrative_index', indices.map(i => i + 1)); // Convert 0-based index to 1-based index

    if (fetchError || !narratives || narratives.length !== 8) {
      throw new Error(`Could not fetch all 8 required narrative videos. Found ${narratives?.length || 0}.`);
    }

    const reversedClips = [];
    const tempDir = os.tmpdir();

    // --- Step 2: Loop through the 8 videos and process them ---
    for (const narrative of narratives) {
      const originalIndex = narrative.narrative_index - 1;
      console.log(`[REVERSAL FACTORY] >> Processing narrative index: ${originalIndex}`);
      
      const originalVideoUrl = narrative.video_url;
      if (!originalVideoUrl) continue;

      // Define file paths for temporary storage on the server
      const inputFileName = `original_${originalIndex}.mp4`;
      const inputFilePath = path.join(tempDir, inputFileName);
      const outputFileName = `reversed_${originalIndex}.mp4`;
      const outputFilePath = path.join(tempDir, outputFileName);
      
      // --- Step 2a: Download the original video ---
      // We need to download it to the server so ffmpeg can work on it.
      const response = await fetch(originalVideoUrl);
      const videoBuffer = await response.arrayBuffer();
      await fs.writeFile(inputFilePath, Buffer.from(videoBuffer));

      // --- Step 2b: Use ffmpeg to extract the last 7 seconds and reverse it ---
      // vf "trim=start=38,setpts=PTS-STARTPTS,reverse,setpts=PTS-STARTPTS"
      // This command seeks to the 38s mark, takes the rest of the clip, reverses it, and saves it.
      await execAsync(`ffmpeg -i ${inputFilePath} -vf "trim=start=38,setpts=PTS-STARTPTS,reverse,setpts=PTS-STARTPTS" -an ${outputFilePath}`);
      
      // --- Step 2c: Upload the new, reversed clip to Supabase Storage ---
      const reversedFileBuffer = await fs.readFile(outputFilePath);
      const uploadPath = `reversed_clips/${userEmail}/reversed_${treatmentNumber}_${originalIndex}.mp4`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('narrative_assets')
        .upload(uploadPath, reversedFileBuffer, { upsert: true, contentType: 'video/mp4' });

      if (uploadError) throw uploadError;
      
      const publicUrl = supabase.storage.from('narrative_assets').getPublicUrl(uploadData.path).data.publicUrl;
      
      reversedClips.push({ originalIndex: originalIndex, videoUrl: publicUrl });
      console.log(`[REVERSAL FACTORY] >> Successfully created and uploaded reversed clip for index ${originalIndex}`);

      // Clean up temporary files
      await fs.unlink(inputFilePath);
      await fs.unlink(outputFilePath);
    }
    
    console.log(`[REVERSAL FACTORY] Completed for user: ${userEmail}`);
    
    // --- Final Success Response ---
    res.status(200).json({ 
      message: 'Reversed clips generated successfully!',
      clips: reversedClips,
    });

  } catch (error: any) {
    console.error('[REVERSAL FACTORY ERROR]:', error);
    res.status(500).json({ error: error.message || 'Server error while generating reversed clips.' });
  }
}
