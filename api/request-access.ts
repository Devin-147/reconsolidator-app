// FILE: api/request-access.ts
// Simplified version for testing
// Timestamp: 2025-06-23 11:42:00 AM EDT

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("------------------------------------------------------------");
    console.log("[API /api/request-access] LATEST COMMITTED SIMPLE TEST HANDLER INVOKED");
    console.log("  Request Method:", req.method);
    console.log("  Request Body:", req.body);
    console.log("  Request Headers:", req.headers);
    console.log("------------------------------------------------------------");

    if (!req.method) {
      throw new Error("Request method is undefined");
    }

    if (req.method === 'POST') {
      res.status(200).json({ 
        message: 'Access request received successfully (LATEST COMMITTED simple test).',
        email: req.body?.email || 'No email provided in body'
      });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Error in handler:", error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}