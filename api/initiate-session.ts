// FILE: api/initiate-session.ts
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

    const emailField = fields.email?.[0];
    if (!emailField) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const email = emailField.trim().toLowerCase();

    const selfieFile = files.selfie?.[0];
    let aiDescription: string | null = null;

    if (selfieFile) {
      try {
        // --- vvv THIS IS THE CORRECTED LINE vvv ---
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        // --- ^^^ END OF CORRECTION ^^^ ---
        const prompt = "Analyze the person in this image. Provide a concise, objective description of their key visual features (e.g., hair style/color, gender expression, key facial features, glasses if present) suitable for an AI character generation prompt. Describe them in the third person. Example: 'A person with short, dark hair, a round face, and wearing black-rimmed glasses.'";
        
        const imagePart = fileToGenerativePart(selfieFile.filepath, selfieFile.mimetype || 'image/jpeg');
        const result = await model.generateContent([prompt, imagePart]);
        aiDescription = result.response.text().trim();
        
      } catch (aiError) {
        console.error("Error during Google AI analysis:", aiError);
      }
    }

    let { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, ai_description')
      .eq('email', email)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }
    
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      if (aiDescription && aiDescription !== existingUser.ai_description) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ ai_description: aiDescription })
          .eq('id', userId);
        if (updateError) throw updateError;
      }
    } else {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ email: email, ai_description: aiDescription })
        .select('id')
        .single();
      
      if (createError) throw createError;
      if (!newUser) throw new Error("Failed to create user.");
      userId = newUser.id;
    }

    res.status(200).json({ 
      message: 'Session initiated successfully!',
      userId: userId,
    });

  } catch (error) {
    console.error('Error in initiate-session:', error);
    res.status(500).json({ error: 'Server error while processing your request.' });
  }
}
