// FILE: api/send-treatment-reminder.ts
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Check for the secret key to protect the endpoint
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { email, initialSuds, currentSuds, lastTreatmentNumber } = req.body;
    
    // 2. Calculate progress
    const improvement = initialSuds > 0 ? (((initialSuds - currentSuds) / initialSuds) * 100).toFixed(0) : 0;
    const nextTreatmentNumber = (lastTreatmentNumber || 0) + 1;

    // 3. Send the email via Resend
    await resend.emails.send({
      from: 'Dev <dev@reprogrammingmind.com>',
      to: email,
      subject: `Your Progress Report & Next Treatment`,
      html: `
        <div>
          <h1>Progress Report</h1>
          <p>Here is a summary of your treatment progress:</p>
          <ul>
            <li>Initial Distress (SUDS): <strong>${initialSuds}</strong></li>
            <li>Current Distress (after T${lastTreatmentNumber}): <strong>${currentSuds}</strong></li>
            <li>Total Improvement: <strong>${improvement}%</strong></li>
          </ul>
          <p>You are making excellent progress. It is time to begin your next session.</p>
          <a href="https://app.reprogrammingmind.com/calibrate/${nextTreatmentNumber}">Begin Treatment ${nextTreatmentNumber}</a>
        </div>
      `,
    });

    res.status(200).json({ status: 'Email sent' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
