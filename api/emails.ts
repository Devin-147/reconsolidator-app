// FILE: api/emails.ts
// NEW: A consolidated API endpoint for sending all application emails.

import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TreatmentResult } from '@/types/recording';

const resend = new Resend(process.env.RESEND_API_KEY);
const summarySender = 'Dev <dev@reprogrammingmind.com>';
const reminderSender = 'Reminders <reminders@reprogrammingmind.com>';

// --- Handler for Treatment Summary Email ---
async function handleSendSummary(req: VercelRequest, res: VercelResponse) {
  const resultData = req.body.payload as TreatmentResult;
  const userEmail = req.body.userEmail;

  if (!resultData || !userEmail) {
    return res.status(400).json({ error: 'Invalid payload for summary email.' });
  }

  const { subject, bodyHtml } = generateSummaryContent(resultData);
  const { data, error } = await resend.emails.send({
    from: summarySender,
    to: [userEmail],
    subject: subject,
    html: bodyHtml,
  });

  if (error) throw error;
  return res.status(200).json({ success: true, message: `Summary email sent. ID: ${data?.id}` });
}

// --- Handler for Treatment Reminder Email ---
async function handleSendReminder(req: VercelRequest, res: VercelResponse) {
  const { email, initialSuds, currentSuds, lastTreatmentNumber } = req.body.payload;

  if (!email || typeof initialSuds !== 'number' || typeof currentSuds !== 'number' || typeof lastTreatmentNumber !== 'number') {
    return res.status(400).json({ error: 'Invalid payload for reminder email.' });
  }

  const improvement = initialSuds > 0 ? (((initialSuds - currentSuds) / initialSuds) * 100).toFixed(0) : 0;
  const nextTreatmentNumber = lastTreatmentNumber + 1;

  await resend.emails.send({
    from: reminderSender,
    to: email,
    subject: `Your Progress Report & Next Treatment`,
    html: `<div>... (Your reminder email HTML here) ...</div>`, // Full HTML from previous version
  });

  return res.status(200).json({ status: 'Reminder email sent' });
}


// --- Main Router Function ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { action } = req.body;

  try {
    switch (action) {
      case 'sendSummary':
        return await handleSendSummary(req, res);
      case 'sendReminder':
        return await handleSendReminder(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action specified.' });
    }
  } catch (error: any) {
    console.error(`Error in emails API for action "${action}":`, error);
    return res.status(500).json({ error: `Failed to send email: ${error.message}` });
  }
}

// --- Helper function for summary email (from your original file) ---
function generateSummaryContent(result: TreatmentResult): { subject: string, bodyHtml: string } {
    // This is the exact function from your send-treatment-summary.ts file.
    // ... (paste the full function logic here) ...
    return { subject: "Your Treatment Summary", bodyHtml: "..." };
}
