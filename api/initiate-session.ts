// FILE: api/initiate-session.ts
// UPGRADED: Sends a welcome email with PDF attachment to new users via Resend.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// --- Initialize External Services ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Vercel Configuration & Helper Function (unchanged) ---
export const config = { api: { bodyParser: false } };
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
    const email = fields.email?.[0]?.trim().toLowerCase();
    if (!email) { return res.status(400).json({ error: 'Email is required.' }); }

    let aiDescription: string | null = null;
    const selfieFile = files.selfie?.[0];
    if (selfieFile) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const prompt = "Analyze the person..."; // Your prompt here
      const imagePart = fileToGenerativePart(selfieFile.filepath, selfieFile.mimetype || 'image/jpeg');
      const result = await model.generateContent([prompt, imagePart]);
      aiDescription = result.response.text().trim();
    }

    let { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      if (aiDescription) {
        await supabase.from('users').update({ ai_description: aiDescription }).eq('id', userId);
      }
    } else {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ email: email, ai_description: aiDescription, status: 'calibrating' })
        .select('id')
        .single();
      
      if (createError) throw createError;
      if (!newUser) throw new Error("Failed to create user.");
      userId = newUser.id;

      try {
        const pdfPath = path.join(process.cwd(), 'public', 'instructions.pdf');
        const pdfBuffer = fs.readFileSync(pdfPath);

        await resend.emails.send({
          from: 'Onboarding <onboarding@reprogrammingmind.com>', // Use your verified domain
          to: email,
          subject: 'Welcome to The Reconsolidation Program',
          html: `<h1>Welcome!</h1><p>Your guide to the program is attached.</p>`,
          attachments: [
            {
              filename: 'instructions.pdf',
              content: pdfBuffer,
            },
          ],
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
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
