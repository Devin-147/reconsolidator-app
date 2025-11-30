// FILE: api/upload-and-analyze-selfie.ts
// CORRECTED: Uses the new 'gemini-1.5-flash-latest' model name.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// --- Initialize External Services ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// --- Vercel Configuration ---
export const config = {
  api: {
    bodyParser: false,
  },
};

// --- Helper Function ---
function fileToGenerativePart(path: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

// --- Main API Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);

    const userEmail = fields.userEmail?.[0];
    const selfieFile = files.selfie?.[0];

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    if (!selfieFile) {
      return res.status(400).json({ error: 'Selfie file is required.' });
    }
    
    // --- AI Image Analysis ---
    // --- vvv THIS IS THE CORRECTED LINE vvv ---
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    // --- ^^^ END OF CORRECTION ^^^ ---
    const prompt = "Analyze the person in this image. Provide a concise, objective description of their key visual features (e.g., hair style/color, gender expression, key facial features, glasses if present) suitable for an AI character generation prompt. Describe them in the third person in a photorealistic, cinematic style. Example: 'A cinematic portrait of a person with short, dark hair, a round face, and wearing black-rimmed glasses.'";
    
    const imagePart = fileToGenerativePart(selfieFile.filepath, selfieFile.mimetype || 'image/jpeg');
    const result = await model.generateContent([prompt, imagePart]);
    const aiDescription = result.response.text().trim();
    
    // --- Supabase Database Update ---
    const { error: updateError } = await supabase
      .from('users')
      .update({ ai_description: aiDescription })
      .eq('email', userEmail);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      throw new Error("Failed to save AI description to your user profile.");
    }
    
    res.status(200).json({ 
      message: 'Selfie analyzed and description saved successfully!',
      aiDescription: aiDescription,
    });

  } catch (error: any) {
    console.error('Error in upload-and-analyze-selfie:', error);
    res.status(500).json({ error: error.message || 'Server error while processing your selfie.' });
  }
}
