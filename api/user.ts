// FILE: api/user.ts
// FINAL CORRECTED VERSION: Initiate session is now handled on the client.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export const config = { api: { bodyParser: false } };

function fileToGenerativePart(filePath: string, mimeType: string): Part {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString("base64"),
      mimeType,
    },
  };
}

async function handleAnalyzeSelfie(req: VercelRequest, res: VercelResponse) {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const userEmail = fields.userEmail?.[0];
    const selfieFile = files.selfie?.[0];
    if (!userEmail || !selfieFile) return res.status(400).json({ error: 'Email and selfie are required.' });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = "Analyze the person...";
    const imagePart = fileToGenerativePart(selfieFile.filepath, selfieFile.mimetype || 'image/jpeg');
    const result = await model.generateContent([prompt, imagePart]);
    const aiDescription = result.response.text().trim();

    await supabase.from('users').update({ ai_description: aiDescription }).eq('email', userEmail);
    
    return res.status(200).json({ message: 'Selfie analyzed and description saved!', aiDescription });
}

async function handleGetUserStatus(req: VercelRequest, res: VercelResponse) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) throw error;
    
    return res.status(200).json(user);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const isMultiPart = req.headers['content-type']?.includes('multipart/form-data');
        
        if (isMultiPart) {
            const form = formidable({});
            const [fields] = await form.parse(req);
            const action = fields.action?.[0];
            
            if (action === 'analyzeSelfie') {
                return await handleAnalyzeSelfie(req, res);
            }
        } else {
            const { action, payload } = req.body;
            if (action === 'getUserStatus') {
                return await handleGetUserStatus({ body: payload } as VercelRequest, res);
            }
        }
        return res.status(400).json({ error: 'Invalid action.' });
    } catch(error) {
        return res.status(500).json({ error: (error as Error).message });
    }
}
