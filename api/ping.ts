// FILE: api/ping.ts (FULL AND COMPLETE - Minimal for 500 Debug)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Log added BEFORE any potential failure point
  console.log("[API /api/ping] Function handler started. Attempting to send pong."); 
  try {
    res.status(200).json({ message: "pong from /api/ping" });
    // Log added AFTER successful sending (might not be reached if error occurs before)
    console.log("[API /api/ping] Successfully sent pong response."); 
  } catch (error) {
     // Log if an error happens INSIDE the try block
    console.error("[API /api/ping] Error INSIDE handler try block:", error);
    // Ensure a response is sent even if logging fails, though less likely here
    if (!res.writableEnded) {
       res.status(500).json({ error: "Ping handler failed internally" });
    }
  }
}