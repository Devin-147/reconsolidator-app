// FILE: api/initiate-session.ts
// EXTREMELY Simplified for "ghost" code test

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("<<<<<<<<<< MINIMAL API HANDLER (initiate-session.ts) WAS CALLED >>>>>>>>>>");
  res.status(200).json({ message: 'Minimal API alive!' });
}