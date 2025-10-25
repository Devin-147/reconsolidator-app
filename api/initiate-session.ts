// FILE: api/initiate-session.ts
// UPGRADED: Now handles multipart/form-data to accept both email and selfie file.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';

// CRITICAL: This config tells Vercel to not parse the request body itself.
// This allows formidable to stream and parse the raw request, which is necessary for file uploads.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // We only expect POST requests for this endpoint.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  console.log("<<<<<<<<<< UPGRADED API HANDLER (initiate-session.ts) WAS CALLED >>>>>>>>>>");

  const form = formidable({});

  try {
    // formidable.parse() unpacks the form data. It returns fields (like email) and files.
    const [fields, files] = await form.parse(req);

    // --- Extract the email ---
    // formidable wraps fields in arrays, so we access the first element.
    const emailField = fields.email?.[0]; 
    if (!emailField) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const email = emailField.trim();
    console.log(`  Email field found: ${email}`);

    // --- Extract the (optional) selfie file ---
    const selfieFile = files.selfie?.[0];
    
    // --- DATABASE LOGIC WILL GO HERE ---
    // For now, we just simulate the logic.
    // In the future, we will find or create a user with the 'email'.
    // If 'selfieFile' exists, we will trigger the video generation process.

    if (selfieFile) {
      console.log(`  Selfie file found: ${selfieFile.originalFilename}`);
      console.log(`    - Type: ${selfieFile.mimetype}`);
      console.log(`    - Size: ${selfieFile.size} bytes`);
      // The file is temporarily stored at `selfieFile.filepath`.
      // We would use this path to upload it to Vercel Blob or send to an AI API.
    } else {
      console.log("  No selfie file was uploaded.");
    }

    // --- Send a successful response ---
    res.status(200).json({ 
      message: 'Session initiated successfully!',
      receivedEmail: email,
      selfieReceived: selfieFile ? selfieFile.originalFilename : 'No',
    });

  } catch (error) {
    console.error('Error parsing form data:', error);
    res.status(500).json({ error: 'Server error while processing your request.' });
  }
}
