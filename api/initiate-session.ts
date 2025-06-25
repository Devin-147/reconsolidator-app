// FILE: api/initiate-session.ts
// EXTREMELY Simplified for "ghost" code test

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("<<<<<<<<<< MINIMAL API HANDLER (initiate-session.ts) WAS CALLED >>>>>>>>>>");
  console.log("  Request Body:", req.body); // Log body to see if email comes through
  res.status(200).json({ 
    message: 'Minimal API for initiate-session alive and well!',
    receivedEmail: req.body?.email || "No email in body" 
  });
}