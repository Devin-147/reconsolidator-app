// FILE: api/user.ts
// FINAL CORRECTED VERSION: Uses the faster client-side Supabase method to prevent timeouts.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey); // Use the client-side client

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export const config = { api: { bodyParser: false } };

function fileToGenerativePart(filePath: string, mimeType: string): Part { /* ... */ }

async function handleInitiateSession(req: VercelRequest, res: VercelResponse) {
    const form = formidable({});
    const [fields] = await form.parse(req);
    const email = fields.email?.[0]?.trim().toLowerCase();
    if (!email) { return res.status(400).json({ error: 'Email is required.' }); }

    // --- vvv THIS IS THE FASTER, SIMPLIFIED LOGIC vvv ---
    // This single command works for both new and existing users.
    // Supabase handles the logic of whether to send a "sign up" or "sign in" link.
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true, // This is the key: if user doesn't exist, create them.
            emailRedirectTo: 'https://app.reprogrammingmind.com/calibrate/1',
        },
    });

    if (error) throw error;
    // --- ^^^ END OF CORRECTION ^^^ ---

    return res.status(200).json({ message: 'Please check your email for a sign-in link.' });
}

// ... (The rest of the file - handleAnalyzeSelfie, handleGetUserStatus, and the main handler - is unchanged)
// ...
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ...
}
