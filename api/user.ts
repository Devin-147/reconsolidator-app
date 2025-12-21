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

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: { redirectTo: 'https://app.reprogrammingmind.com/calibrate/1' },
        });
        if (linkError || !linkData || !linkData.properties) throw linkError || new Error("Could not generate magic link.");
        const magicLink = linkData.properties.action_link;
        
        const pdfPath = path.join(process.cwd(), 'api', 'instructions1.pdf');
        const pdfBuffer = fs.readFileSync(pdfPath);
        
        await resend.emails.send({
            from: 'Dev <dev@reprogrammingmind.com>',
            to: email,
            subject: 'Your Treatment Link and Instructions',
            html: `
                <div style="font-family: sans-serif; line-height: 1.6;">
                    <h3>Welcome to the Reconsolidation Program</h3>
                    <p> The program begins by asking you to briefly record the target event. Recording your 'target event'/problem memory in under a minute is good.

Then you are asked to tell a positive memory that happened before the event and one positive memory from after the event.
<br></br>
The application is asking you for these:
<br></br>
target/problem memory <br></br>
pre-target memory <br></br>
post-target memory <br></br>
                    For an overview, please read the briefing in the PDF attached. When you are ready, click the link below to begin your treatment.</p>
                    <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #39e5f6; color: #192835; text-decoration: none; border-radius: 8px; font-weight: bold;">Begin Treatment 1</a>
                </div>
            `,
            attachments: [{ filename: 'instructions1.pdf', content: pdfBuffer }],
        });

        res.status(200).json({ message: 'Please check your email for a sign-in link and instructions.' });

    } catch (error) {
        console.error('Error in user API:', error);
        res.status(500).json({ error: 'Server error while processing your request.' });
    }
}
