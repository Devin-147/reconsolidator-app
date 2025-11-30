// FILE: api/initiate-session.ts
// UPGRADED: Implements Supabase Magic Link authentication for new users.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// --- Initialize External Services ---
// Use the SERVICE_ROLE_KEY for admin actions like creating users
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: false } };
function fileToGenerativePart(path: string, mimeType: string) { /* ... */ }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') { /* ... */ }

  const form = formidable({});
  try {
    const [fields, files] = await form.parse(req);
    const email = fields.email?.[0]?.trim().toLowerCase();
    if (!email) { return res.status(400).json({ error: 'Email is required.' }); }
    
    // (AI analysis logic is unchanged)
    let aiDescription: string | null = null;
    /* ... */

    // --- Check if user exists in the auth schema ---
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (authError && authError.message !== 'User not found') {
      throw authError;
    }

    if (authUser) {
      // --- USER EXISTS ---
      // Send a regular sign-in link
      await supabaseAdmin.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: 'https://app.reprogrammingmind.com/calibrate/1', // Redirect to calibration after login
        },
      });
      // Optionally, update ai_description if a new selfie was uploaded
      if (aiDescription) {
        await supabaseAdmin.from('users').update({ ai_description: aiDescription }).eq('id', authUser.id);
      }
    } else {
      // --- NEW USER ---
      // 1. Create the user in the auth schema
      const { data: { user: newAuthUser }, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true, // Auto-confirm the email
      });

      if (createAuthError) throw createAuthError;
      if (!newAuthUser) throw new Error("Could not create auth user.");

      // 2. Insert their profile into the public.users table
      const { error: createProfileError } = await supabaseAdmin
        .from('users')
        .insert({ id: newAuthUser.id, email: email, ai_description: aiDescription, status: 'calibrating' });
      
      if (createProfileError) throw createProfileError;

      // 3. Send the welcome email with a sign-in link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: 'https://app.reprogrammingmind.com/calibrate/1',
        },
      });
      if(linkError) throw linkError;
      const magicLink = linkData.properties.action_link;

      // 4. Send email via Resend
      const pdfPath = path.join(process.cwd(), 'public', 'instructions.pdf');
      const pdfBuffer = fs.readFileSync(pdfPath);
      await resend.emails.send({
        from: 'Dev <dev@reprogrammingmind.com>',
        to: email,
        subject: 'Welcome! Activate Your First Treatment',
        html: `
          <div>
            <h1>Welcome to the Reconsolidation Program</h1>
            <p>Your guide is attached. Click the link below to securely sign in and begin your first session:</p>
            <a href="${magicLink}">Begin Treatment 1</a>
            <p>Reprogramming Mind</p>
          </div>
        `,
        attachments: [{ filename: 'instructions.pdf', content: pdfBuffer }],
      });
    }

    res.status(200).json({ 
      message: 'Please check your email for a sign-in link.',
    });

  } catch (error) {
    console.error('Error in initiate-session:', error);
    res.status(500).json({ error: 'Server error while processing your request.' });
  }
}
