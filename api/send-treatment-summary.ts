// api/send-treatment-summary.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TreatmentResult } from '@/types/recording'; // Import type

// --- Initialize Clients (Similar to other API routes) ---
// Supabase Admin Client (using Service Key - NEEDED to fetch user data if needed)
let supabaseAdmin: SupabaseClient | null = null;
let supabaseInitError: string | null = null;
try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase URL/Service Key');
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
} catch(e: any) { supabaseInitError = `Supabase Admin Init Error: ${e.message}`; console.error(supabaseInitError, e); }

// Resend Client
let resend: Resend | null = null;
let resendInitError: string | null = null;
try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) throw new Error('Missing Resend API Key');
    resend = new Resend(resendApiKey);
} catch (e: any) { resendInitError = `Resend Init Error: ${e.message}`; console.error(resendInitError, e); }

// Verified Sender Email
const verifiedSenderEmail = 'Dev <dev@reprogrammingmind.com>'; // Adjust as needed
// --- End Initialization ---


// --- Helper Function to Generate Email Content ---
function generateEmailContent(result: TreatmentResult): { subject: string, bodyHtml: string } {
    const { treatmentNumber, initialSuds, finalSuds, improvementPercentage, isImprovement } = result;
    let subject = `Reconsolidation Program: Treatment ${treatmentNumber} Complete!`;
    let body = `<div style="font-family: sans-serif; ...">`; // Add base styling
    body += `<h2 style="color: #7be4da;">Treatment ${treatmentNumber} Completed!</h2>`;

    // Add SUDS results section
    body += `<p>Here's a summary of your session:</p><ul>`;
    body += `<li>Initial SUDS (Before Treatment ${treatmentNumber}): ${initialSuds ?? 'N/A'}</li>`;
    body += `<li>Final SUDS (After Treatment ${treatmentNumber}): ${finalSuds}</li>`;
    if (improvementPercentage !== null) {
        const color = isImprovement ? '#22c55e' : '#ef4444'; // Green or Red
        const text = isImprovement ? 'Improvement' : 'Increase';
        body += `<li style="color: ${color}; font-weight: bold;">Distress Reduction: ${improvementPercentage.toFixed(0)}% ${text}</li>`;
    } else {
        body += `<li>Distress Reduction: Not applicable (Initial SUDS was 0 or missing)</li>`;
    }
    body += `</ul>`;

    // Add dynamic message based on improvement
    if (improvementPercentage !== null) {
        if (improvementPercentage >= 40) { // Significant Improvement
            body += `<p><strong>Excellent work!</strong> A reduction of ${improvementPercentage.toFixed(0)}% is fantastic progress in reprocessing this memory.</p>`;
        } else if (improvementPercentage > 5) { // Moderate Improvement
             body += `<p><strong>Good progress!</strong> You achieved a ${improvementPercentage.toFixed(0)}% reduction. Consistency is key.</p>`;
        } else if (improvementPercentage > -10) { // Minor/No Improvement
             body += `<p>Completing the process is valuable, even if SUDS changes are small initially. Sometimes additional shifts happen between sessions.</p>`;
        } else { // SUDS Increased
             body += `<p>It's okay for distress levels to fluctuate sometimes during reprocessing. Ensure you focused on the specific target event and prediction errors. The hardest treatment is the  first one and you've already done one.  Now you've built up some neural pathways to make the next session easier and more impactful in yielding even better results.</p>`;
        }
    } else {
         body += `<p>You've completed the steps for this treatment.</p>`;
    }

    // Add Next Steps / Consolidation Reminder
    body += `<p><strong>Important:</strong> Allow at least two nights of sleep for your brain to consolidate these changes before starting the next treatment session.</p>`;
    if (treatmentNumber < 5) {
        body += `<p>Treatment ${treatmentNumber + 1} will be available after this consolidation period.</p>`;
    } else {
        body += `<p>You have completed the core treatments! The Follow-Up assessment is recommended in approximately 6 weeks.</p>`;
    }

    // Closing
    body += `<p>Keep up the great work!</p>`;
    body += `</div></div>`; // Close styling divs

    return { subject, bodyHtml: body };
}
// --- End Helper Function ---


// --- Main Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    if (!resend || resendInitError) return res.status(500).json({ error: resendInitError || 'Resend client not available.' });
    // Removed Supabase check here, assuming parent function already verified user access if needed

    // Validate incoming data (TreatmentResult)
    const resultData = req.body as TreatmentResult; // Assume body sends the full result object
    if (!resultData || typeof resultData.treatmentNumber !== 'number' || typeof resultData.finalSuds !== 'number' || !resultData.completedAt || typeof resultData.initialSuds !== 'number') {
        return res.status(400).json({ error: 'Invalid or incomplete TreatmentResult data in request body.' });
    }
    // Validate user email is present if needed for sending 'to' field
    const userEmail = req.body.userEmail; // Assuming email is sent along with resultData
     if (!userEmail || typeof userEmail !== 'string') {
         return res.status(400).json({ error: 'Missing or invalid userEmail in request body.' });
     }


    try {
        console.log(`Generating summary email for ${userEmail}, Treatment ${resultData.treatmentNumber}`);
        const { subject, bodyHtml } = generateEmailContent(resultData);

        const { data, error: emailError } = await resend.emails.send({
            from: verifiedSenderEmail,
            to: [userEmail], // Send to the user who completed the treatment
            subject: subject,
            html: bodyHtml,
        });

        if (emailError) {
            throw emailError; // Let generic catch handle
        }

        console.log(`Treatment ${resultData.treatmentNumber} summary email sent to ${userEmail}. Resend ID: ${data?.id}`);
        res.status(200).json({ success: true, message: 'Summary email sent.' });

    } catch (error: any) {
        console.error(`Error sending treatment summary email for ${userEmail}:`, error);
        res.status(500).json({ error: `Failed to send summary email: ${error.message}` });
    }
}