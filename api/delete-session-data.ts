// api/delete-session-data.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Initialize Supabase Admin Client ---
// (Same initialization logic as other API routes, checking env vars)
let supabaseAdmin: SupabaseClient | null = null;
let supabaseInitError: string | null = null;
try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase URL/Service Key');
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
} catch(e: any) { supabaseInitError = `Supabase Admin Init Error: ${e.message}`; console.error(supabaseInitError, e); }
// --- End Initialization ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    if (supabaseInitError || !supabaseAdmin) return res.status(500).json({ error: supabaseInitError || 'Supabase admin client not available.' });

    // --- Get Data from Request Body ---
    // Expecting user identifier and identifiers for the specific session data to delete
    // IMPORTANT: In a real app, you MUST get the user identifier from a secure session/token,
    // not just trust the request body. For now, we'll assume email is passed for demo.
    const { userEmail, treatmentNumber } = req.body; // Or setupId, resultId if you use those

    if (!userEmail || typeof userEmail !== 'string') return res.status(400).json({ error: 'Missing or invalid userEmail.' });
    if (typeof treatmentNumber !== 'number') return res.status(400).json({ error: 'Missing or invalid treatmentNumber.' });
    // --- End Data Validation ---

    console.log(`Attempting to delete data for user ${userEmail}, treatment ${treatmentNumber}`);

    try {
        // --- 1. Identify Data and Files to Delete ---
        // This query structure depends heavily on your specific table schemas
        // Example: Assuming setup and results are linked by userEmail and treatmentNumber
        // And assuming file paths are stored directly in these tables or derived

        // Get file paths from related records BEFORE deleting the records
        const BUCKET_NAME = 'narrations';
        let filePathsToDelete: string[] = [];

        // Example: Get paths from treatment_setups (adjust table/column names)
        const { data: setupData, error: setupError } = await supabaseAdmin
            .from('treatment_setups') // <<< YOUR TABLE NAME
            .select('target_audio_path, memory1_audio_path, memory2_audio_path') // <<< YOUR COLUMN NAMES
            .eq('user_email', userEmail) // <<< Use user_id if using Supabase Auth IDs
            .eq('treatment_number', treatmentNumber)
            .maybeSingle(); // Expect one setup per treatment number per user

        if (setupError) console.error("Error fetching setup paths:", setupError.message);
        if (setupData) {
            if (setupData.target_audio_path) filePathsToDelete.push(setupData.target_audio_path);
            if (setupData.memory1_audio_path) filePathsToDelete.push(setupData.memory1_audio_path);
            if (setupData.memory2_audio_path) filePathsToDelete.push(setupData.memory2_audio_path);
        }

        // Example: Get paths for narration audios (assuming stored separately)
        // This requires knowing the exact paths generated for narrations 1-11
        // It might be easier to delete by prefix if structure is consistent
        const narrationPrefix = `${userEmail}/treatment_${treatmentNumber}/`;
        console.log(`Listing narration files with prefix: ${narrationPrefix}`);
        const { data: narrationFiles, error: listError } = await supabaseAdmin
            .storage
            .from(BUCKET_NAME)
            .list(narrationPrefix, { limit: 11 }); // Limit just in case

        if (listError) console.error("Error listing narration files:", listError.message);
        if (narrationFiles && narrationFiles.length > 0) {
            const narrationPaths = narrationFiles.map(file => `${narrationPrefix}${file.name}`);
            filePathsToDelete = [...filePathsToDelete, ...narrationPaths];
        }

        // --- 2. Delete Database Records ---
        // Example: Delete treatment result (adjust table names/logic)
        console.log(`Deleting database records for T${treatmentNumber}...`);
        const { error: deleteResultError } = await supabaseAdmin
            .from('treatment_results') // <<< YOUR TABLE NAME
            .delete()
            .eq('user_email', userEmail) // <<< Use user_id if appropriate
            .eq('treatment_number', treatmentNumber);
        if (deleteResultError) throw new Error(`DB Result Deletion Failed: ${deleteResultError.message}`);

        // Example: Delete treatment setup
        const { error: deleteSetupError } = await supabaseAdmin
            .from('treatment_setups') // <<< YOUR TABLE NAME
            .delete()
            .eq('user_email', userEmail) // <<< Use user_id if appropriate
            .eq('treatment_number', treatmentNumber);
        if (deleteSetupError) throw new Error(`DB Setup Deletion Failed: ${deleteSetupError.message}`);

        // --- 3. Delete Storage Files ---
        if (filePathsToDelete.length > 0) {
            console.log(`Deleting ${filePathsToDelete.length} files from storage:`, filePathsToDelete);
            const { data: deleteFilesData, error: deleteFilesError } = await supabaseAdmin
                .storage
                .from(BUCKET_NAME)
                .remove(filePathsToDelete);

            if (deleteFilesError) {
                // Log error but might continue if DB records were deleted
                console.error(`Storage file deletion failed: ${deleteFilesError.message}`);
                // Don't throw here, let the request succeed if DB is clean
            } else {
                console.log("Storage files deleted successfully:", deleteFilesData);
            }
        } else {
             console.log("No associated storage files found to delete.");
        }

        // --- Return Success ---
        res.status(200).json({ success: true, message: `Data for treatment ${treatmentNumber} deleted.` });

    } catch (error: any) {
        console.error(`Error deleting session data for user ${userEmail}, T${treatmentNumber}:`, error);
        res.status(500).json({ error: `Failed to delete session data: ${error.message}` });
    }
}