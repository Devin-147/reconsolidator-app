// FILE: api/user.ts
// FINAL CORRECTED VERSION

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: false } };

function fileToGenerativePart(filePath: string, mimeType: string): Part {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString("base64"),
      mimeType,
    },
  };
}

async function handleInitiateSession(req: VercelRequest, res: VercelResponse) {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const email = fields.email?.[0]?.trim().toLowerCase();
    if (!email) { return res.status(400).json({ error: 'Email is required.' }); }

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);

    if (authUser) {
        await supabaseAdmin.auth.signInWithOtp({ email });
    } else {
        const { data: { user: newAuthUser } } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });
        if (!newAuthUser) throw new Error("Could not create auth user.");
        await supabaseAdmin.from('users').insert({ id: newAuthUser.id, email });
        
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: 'https://app.reprogrammingmind.com/calibrate/1' }});
        if (!linkData || !linkData.properties) throw new Error("Could not generate magic link.");
        const magicLink = linkData.properties.action_link;

        const pdfBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'instructions.pdf'));
        await resend.emails.send({
            from: 'Dev <dev@reprogrammingmind.com>',
            to: email,
            subject: 'Welcome! Activate Your First Treatment',
            html: `<div>... (Welcome Email HTML) ... <a href="${magicLink}">Begin</a> ...</div>`,
            attachments: [{ filename: 'instructions.pdf', content: pdfBuffer }],
        });
    }
    return res.status(200).json({ message: 'Please check your email for a sign-in link.' });
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

    await supabaseAdmin.from('users').update({ ai_description: aiDescription }).eq('email', userEmail);
    
    return res.status(200).json({ message: 'Selfie analyzed and description saved!', aiDescription });
}

async function handleGetUserStatus(req: VercelRequest, res: VercelResponse) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const { data: user, error } = await supabaseAdmin.from('users').select('*').eq('email', email).single();
    if (error) throw error;
    
    return res.status(200).json(user);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const isMultiPart = req.headers['content-type']?.includes('multipart/form-data');
    
    if (isMultiPart) {
        const form = formidable({});
        // We need to parse fields to determine the action
        const [fields] = await form.parse(req);
        const action = fields.action?.[0];
        
        // Re-pass the request to the specific handler, which will re-parse it.
        // This is not the most efficient, but it isolates logic cleanly.
        if (action === 'analyzeSelfie') {
            return await handleAnalyzeSelfie(req, res);
        } else { // Default multipart action is initiateSession
            return await handleInitiateSession(req, res);
        }
    } else {
        // Handle JSON-based requests
        const { action, payload } = req.body;
        if (action === 'getUserStatus') {
            // Pass a mock request object with the payload in the body for the handler
            return await handleGetUserStatus({ body: payload } as VercelRequest, res);
        }
        return res.status(400).json({ error: 'Invalid action for JSON request.' });
    }
}
