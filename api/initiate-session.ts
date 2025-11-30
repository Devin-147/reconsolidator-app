// FILE: api/initiate-session.ts
// FINAL CORRECTED VERSION

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: false } };
function fileToGenerativePart(path: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  const form = formidable({});
  try {
    const [fields, files] = await form.parse(req);
    const email = fields.email?.[0]?.trim().toLowerCase();
    if (!email) { return res.status(400).json({ error: 'Email is required.' }); }
    
    let aiDescription: string | null = null;
    const selfieFile = files.selfie?.[0];
    if (selfieFile) {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = "Analyze the person...";
        const imagePart = fileToGenerativePart(selfieFile.filepath, selfieFile.mimetype || 'image/jpeg');
        const result = await model.generateContent([prompt, imagePart]);
        aiDescription = result.response.text().trim();
    }
    
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    const authUser = users.find(u => u.email === email);

    if (authUser) {
      await supabaseAdmin.auth.signInWithOtp({ email });
      if (aiDescription) {
        await supabaseAdmin.from('users').update({ ai_description: aiDescription }).eq('id', authUser.id);
      }
    } else {
      const { data: { user: newAuthUser }, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });
      if (createAuthError || !newAuthUser) throw createAuthError || new Error("Could not create auth user.");

      await supabaseAdmin.from('users').insert({ id: newAuthUser.id, email });
      
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: { redirectTo: 'https://app.reprogrammingmind.com/calibrate/1' },
      });
      if(linkError || !linkData) throw linkError || new Error("Could not generate magic link.");
      const magicLink = linkData.properties.action_link;

      const pdfPath = path.join(process.cwd(), 'public', 'instructions.pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);
      await resend.emails.send({
        from: 'Dev <dev@reprogrammingmind.com>',
        to: email,
        subject: 'Welcome! Activate Your First Treatment',
        html: `<div><h1>Welcome!</h1><p>Your guide is attached. Click the link below to sign in and begin:</p><a href="${magicLink}">Begin Treatment 1</a></div>`,
        attachments: [{ filename: 'instructions.pdf', content: pdfBuffer }],
      });
    }

    res.status(200).json({ message: 'Please check your email for a sign-in link.' });

  } catch (error) {
    console.error('Error in initiate-session:', error);
    res.status(500).json({ error: 'Server error while processing your request.' });
  }
}
