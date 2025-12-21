// FILE: api/user.ts
// FINAL CORRECTED VERSION

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

    const form = formidable({});
    try {
        const [fields] = await form.parse(req);
        const email = fields.email?.[0]?.trim().toLowerCase();
        if (!email) { return res.status(400).json({ error: 'Email is required.' }); }

        // Always generate a magic link. Supabase handles new vs. existing users.
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: { redirectTo: 'https://app.reprogrammingmind.com/calibrate/1' },
        });
        if (linkError || !linkData || !linkData.properties) throw linkError || new Error("Could not generate magic link.");
        const magicLink = linkData.properties.action_link;
        
        // Check if the user is new to decide if we send the PDF.
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const isNewUser = !users.some(u => u.email === email);

        if (isNewUser) {
            // If new user, also create their auth entry and profile in the 'users' table
            const { data: { user: newAuthUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });
            if (createError || !newAuthUser) throw createError || new Error("Could not create auth user profile.");
            await supabaseAdmin.from('users').insert({ id: newAuthUser.id, email });
        }

        // Prepare and send the email from Resend
        const pdfPath = path.join(process.cwd(), 'api', 'instructions1.pdf');
        const pdfBuffer = fs.readFileSync(pdfPath);
        
        await resend.emails.send({
            from: 'Dev <dev@reprogrammingmind.com>',
            to: email,
            subject: 'Welcome! Your Treatment Link and Instructions',
            html: `
                <div>
                    <h3>Wow, you made it!</h3>
                    <p>First, let's get into the Reconsolidation Program.</p>
                    <p>You'll be asked to <strong>briefly</strong> record the target event... (and so on, using your full text from the broadcast)</p>
                    <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #39e5f6; color: #192835; text-decoration: none; border-radius: 8px; font-weight: bold;">Begin Treatment 1</a>
                </div>
            `,
            attachments: isNewUser ? [{ filename: 'instructions1.pdf', content: pdfBuffer }] : [],
        });

        res.status(200).json({ message: 'Please check your email for a sign-in link and instructions.' });

    } catch (error) {
        console.error('Error in user API:', error);
        res.status(500).json({ error: 'Server error while processing your request.' });
    }
}
