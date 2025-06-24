// FILE: api/request-access.ts
// MODIFIED WITH DETAILED DIAGNOSTIC LOGGING
// Timestamp: 2024-06-23 16:30:00 PM UTC

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // A big, clear header for each request in the logs
  console.log("============================================================");
  console.log(`[API /api/request-access] INVOKED AT: ${new Date().toISOString()}`);

  try {
    // 1. Check and log the request method
    if (req.method !== 'POST') {
      console.log(`-> FAILURE: Invalid method (${req.method}). Responding with 405.`);
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    
    console.log("-> Method is POST. Proceeding...");

    // 2. Log the incoming request body from the frontend
    const body = req.body;
    console.log("-> Received request body:", body);

    // 3. Extract and validate the email
    const email = body?.email;
    if (!email || typeof email !== 'string') {
      console.log("-> FAILURE: Email not found or is not a string in the request body.");
      const failureResponse = { success: false, message: 'Bad Request: Email is required.' };
      console.log("-> Returning Failure Response:", failureResponse);
      return res.status(400).json(failureResponse);
    }

    console.log(`-> Email successfully extracted: ${email}`);

    // 4. *** YOUR ACTUAL LOGIC GOES HERE ***
    // This is a placeholder to simulate checking the user's status.
    // Replace this `if` condition with your real database check or logic.
    console.log("-> Entering business logic check...");
    
    // TODO: Replace this with your real check, e.g., `const user = await db.findUser(email);`
    const isUserAllowed = email.includes('@'); // A simple placeholder check

    if (isUserAllowed) {
      // SUCCESS PATH
      console.log("-> LOGIC CHECK: Success. User is allowed.");
      const successResponse = { success: true, message: `Access granted for ${email}.` };
      console.log("-> Returning Success Response:", successResponse);
      return res.status(200).json(successResponse);

    } else {
      // FAILURE PATH
      console.log("-> LOGIC CHECK: Failure. User is NOT allowed.");
      const failureResponse = { success: false, message: `Access denied for ${email}.` };
      console.log("-> Returning Failure Response:", failureResponse);
      return res.status(200).json(failureResponse); // Note: still 200 OK, but payload says "failed"
    }

  } catch (error) {
    // 5. Catch any unexpected crashes
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! UNEXPECTED CRASH in /api/request-access handler !!!");
    console.error(error);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}