// FILE: api/user.ts
// NEW: A consolidated API endpoint for all user and session management.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// --- Initialize Services ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: false } };
function fileToGenerativePart(path: string, mimeType: string) { /* ... */ }

// --- Handler for Initiating Session (New & Returning Users) ---
async function handleInitiateSession(req: VercelRequest, res: VercelResponse) {
    // This logic is mostly from your old initiate-session.ts file
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const email = fields.email?.[0]?.trim().toLowerCase();
    if (!email) { return res.status(400).json({ error: 'Email is required.' }); }

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ email });
    const authUser = users[0];

    if (authUser) {
        await supabaseAdmin.auth.signInWithOtp({ email });
    } else {
        const { data: { user: newAuthUser } } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });
        if (!newAuthUser) throw new Error("Could not create auth user.");
        await supabaseAdmin.from('users').insert({ id: newAuthUser.id, email });
        
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: 'https://app.reprogrammingmind.com/calibrate/1' }});
        const magicLink = linkData.properties.action_link;

        const pdfBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'instructions.pdf'));
        await resend.emails.send({
            from: 'Onboarding <onboarding@reprogrammingmind.com>',
            to: email,
            subject: 'Welcome! Activate Your First Treatment',
            html: `<div>... (Welcome Email HTML) ... <a href="${magicLink}">Begin</a> ...</div>`,
            attachments: [{ filename: 'instructions.pdf', content: pdfBuffer }],
        });
    }
    return res.status(200).json({ message: 'Please check your email for a sign-in link.' });
}

// --- Handler for Uploading & Analyzing Selfie ---
async function handleAnalyzeSelfie(req: VercelRequest, res: VercelResponse) {
    // This logic is from your old upload-and-analyze-selfie.ts file
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

// --- Handler for Getting User Status ---
async function handleGetUserStatus(req: VercelRequest, res: VercelResponse) {
    const { email } = req.body.payload;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const { data: user, error } = await supabaseAdmin.from('users').select('*').eq('email', email).single();
    if (error) throw error;
    
    return res.status(200).json(user);
}

// --- Main Router Function ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { action } = req.body;
    try {
        switch (action) {
            case 'initiateSession':
                return await handleInitiateSession(req, res);
            case 'analyzeSelfie':
                return await handleAnalyzeSelfie(req, res);
            case 'getUserStatus':
                return await handleGetUserStatus(req, res);
            default:
                // If no action, assume it's the old initiate-session flow for backward compatibility
                if(req.body.email) return await handleInitiateSession(req, res);
                return res.status(400).json({ error: 'Invalid action.' });
        }
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
