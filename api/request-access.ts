// FILE: api/request-access.ts
// Simplified version for testing
// Timestamp: (Add a new current timestamp here to be sure) e.g., 2025-06-22 11:30:00 AM YOUR_TIMEZONE

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("------------------------------------------------------------");
  console.log("[API /api/request-access] LATEST COMMITTED SIMPLE TEST HANDLER INVOKED"); // New log message
  console.log("  Request Method:", req.method);
  console.log("  Request Body:", req.body);
  console.log("  Request Headers:", req.headers);
  console.log("------------------------------------------------------------");

  if (req.method === 'POST') {
    res.status(200).json({ 
      message: 'Access request received successfully (LATEST COMMITTED simple test).',
      email: req.body?.email || 'No email provided in body'
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}