// FILE: api/send-treatment-reminder.ts
// NEW: This endpoint is called by the Supabase cron job to send a reminder email.

import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);
const verifiedSenderEmail = 'Reminders <reminders@reprogrammingmind.com>'; // Use a verified sender

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Secure the endpoint with the secret key
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 2. Ensure it's a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, initialSuds, currentSuds, lastTreatmentNumber } = req.body;

    // 3. Basic validation
    if (!email || typeof initialSuds !== 'number' || typeof currentSuds !== 'number' || typeof lastTreatmentNumber !== 'number') {
      return res.status(400).json({ error: 'Invalid payload. Required fields are missing.' });
    }
    
    // 4. Calculate progress
    const improvement = initialSuds > 0 ? (((initialSuds - currentSuds) / initialSuds) * 100).toFixed(0) : 0;
    const nextTreatmentNumber = lastTreatmentNumber + 1;

    // 5. Send the email via Resend
    await resend.emails.send({
      from: verifiedSenderEmail,
      to: email,
      subject: `Your Progress Report & Next Treatment`,
      html: `
        <div style="font-family: sans-serif;">
          <h1>Progress Report</h1>
          <p>This is a reminder to continue your treatment. Here's a summary of your progress so far:</p>
          <ul>
            <li>Initial Distress (SUDS): <strong>${initialSuds}</strong></li>
            <li>Current Distress (after T${lastTreatmentNumber}): <strong>${currentSuds}</strong></li>
            <li>Total Improvement: <strong>${improvement}%</strong></li>
          </ul>
          <p>You are making excellent progress. Let's build on that momentum.</p>
          <a 
            href="https://app.reprogrammingmind.com/calibrate/${nextTreatmentNumber}" 
            style="display: inline-block; padding: 12px 24px; background-color: #39e5f6; color: #192835; text-decoration: none; border-radius: 8px; font-weight: bold;"
          >
            Begin Treatment ${nextTreatmentNumber}
          </a>
        </div>
      `,
    });

    // 6. Respond with success
    res.status(200).json({ status: 'Email sent successfully' });
  } catch (error) {
    console.error("Error in send-treatment-reminder:", error);
    res.status(500).json({ status: 'Error', message: (error as Error).message });
  }
}
