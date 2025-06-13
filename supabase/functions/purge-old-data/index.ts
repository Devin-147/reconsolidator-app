// supabase/functions/purge-old-data/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts' // Deno standard library
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2' // Deno compatible Supabase client

console.log(`Function "purge-old-data" starting up...`)

// --- Main Purge Logic ---
async function performPurge(supabaseAdmin: SupabaseClient) {
  console.log("Purge Function: Starting data purge process...");
  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  console.log(`Purge Function: Purging records older than: ${thirtyDaysAgo}`);

  const BUCKET_NAME = 'narrations'; // <<< CONFIRM YOUR BUCKET NAME

  // --- 1. Find old treatment results ---
  // Adjust table and column names as needed
  const { data: oldResults, error: findError } = await supabaseAdmin
    .from('treatment_results') // <<< YOUR RESULTS TABLE NAME
    .select('id, user_email, treatment_number, setup_id, completed_at') // Get email for Resend, IDs for deletion
    .lt('completed_at', thirtyDaysAgo); // Records completed over 30 days ago

  if (findError) throw new Error(`Failed to find old results: ${findError.message}`);
  if (!oldResults || oldResults.length === 0) return { message: "No old results found to purge." };

  console.log(`Purge Function: Found ${oldResults.length} old result record(s).`);

  // --- 2. Collect IDs and File Paths ---
  const resultIdsToDelete: number[] = oldResults.map(r => r.id);
  const setupIdsToDelete: number[] = oldResults.map(r => r.setup_id).filter((id): id is number => id != null); // Filter out nulls, ensure type
  const emailsToSuppress: string[] = oldResults.map(r => r.user_email).filter((email): email is string => !!email); // Get unique emails
  let filePathsToDelete: string[] = [];

  // Fetch associated setup data to get storage paths (adjust table/columns)
  if (setupIdsToDelete.length > 0) {
       const { data: setupData, error: setupFetchError } = await supabaseAdmin
           .from('treatment_setups') // <<< YOUR SETUP TABLE NAME
           .select('id, target_audio_path, memory1_audio_path, memory2_audio_path') // <<< YOUR AUDIO PATH COLUMN NAMES
           .in('id', setupIdsToDelete);

       if (setupFetchError) console.error("Error fetching setup paths:", setupFetchError.message); // Log but continue if possible
       if (setupData) {
           setupData.forEach(setup => {
              if (setup.target_audio_path) filePathsToDelete.push(setup.target_audio_path);
              if (setup.memory1_audio_path) filePathsToDelete.push(setup.memory1_audio_path);
              if (setup.memory2_audio_path) filePathsToDelete.push(setup.memory2_audio_path);
           });
       }
  }

  // Add narration file paths (assuming consistent naming structure)
  for (const result of oldResults) {
        const userIdentifier = result.user_email; // Or user_id if using that
        const treatmentNum = result.treatment_number;
        if (userIdentifier && treatmentNum) {
             // Construct potential paths - adjust if structure differs
             for (let i = 0; i < 11; i++) {
                 filePathsToDelete.push(`${userIdentifier}/treatment_${treatmentNum}/narration_${i + 1}.mp3`);
             }
        }
  }
  // Remove potential duplicates if paths overlap
  filePathsToDelete = [...new Set(filePathsToDelete)];

  // --- 3. Delete DB Records ---
  console.log(`Purge Function: Deleting ${resultIdsToDelete.length} result records...`);
  const { error: deleteResultError } = await supabaseAdmin.from('treatment_results').delete().in('id', resultIdsToDelete);
  if (deleteResultError) throw new Error(`Failed to delete results: ${deleteResultError.message}`);

  if (setupIdsToDelete.length > 0) {
      console.log(`Purge Function: Deleting ${setupIdsToDelete.length} setup records...`);
      const { error: deleteSetupError } = await supabaseAdmin.from('treatment_setups').delete().in('id', setupIdsToDelete);
      if (deleteSetupError) throw new Error(`Failed to delete setups: ${deleteSetupError.message}`);
  }

  // --- 4. Delete Storage Files ---
  if (filePathsToDelete.length > 0) {
      console.log(`Purge Function: Deleting ${filePathsToDelete.length} files from storage bucket '${BUCKET_NAME}'...`);
      // Note: Supabase storage remove can handle up to 1000 keys at once
      // If you expect more, you might need to batch this.
      const { data: deleteData, error: deleteError } = await supabaseAdmin.storage.from(BUCKET_NAME).remove(filePathsToDelete);
      if (deleteError) throw new Error(`Failed to delete storage files: ${deleteError.message}`);
      console.log("Purge Function: Storage files deletion result:", deleteData);
  } else {
      console.log("Purge Function: No storage files identified for deletion.");
  }

  // --- 5. Suppress Emails in Resend ---
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
      console.error("Purge Function: Resend API Key missing, cannot suppress emails.");
  } else {
      const uniqueEmails = [...new Set(emailsToSuppress)]; // Process each email only once
      console.log(`Purge Function: Attempting to suppress ${uniqueEmails.length} unique emails in Resend...`);
      for (const emailToSuppress of uniqueEmails) {
          try {
              const suppressResponse = await fetch(`https://api.resend.com/suppressions`, {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${RESEND_API_KEY}`,
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email: emailToSuppress /*, audience_id: 'YOUR_AUDIENCE_ID' */ }), // Add audience if needed
              });
              if (!suppressResponse.ok) {
                  const errorData = await suppressResponse.json().catch(() => ({}));
                  console.error(`Purge Function: Failed to suppress ${emailToSuppress} in Resend: ${suppressResponse.status}`, errorData);
              } else {
                  console.log(`Purge Function: Email ${emailToSuppress} added to Resend suppression.`);
              }
          } catch (resendError) {
              console.error(`Purge Function: Network error suppressing ${emailToSuppress} in Resend:`, resendError);
          }
      }
  }
  // --- End Resend Suppression ---

  console.log(`Purge Function: Purge complete for ${resultIdsToDelete.length} records.`);
  return { message: `Purged ${resultIdsToDelete.length} records.` };
} // End performPurge

// --- Edge Function Request Handler ---
serve(async (req) => {
  // Recommended: Secure this endpoint, e.g., check for a secret header or specific caller IP
  // For a scheduled function, ensure only Supabase scheduler calls it.

  // Get Supabase credentials from Deno environment (set via `supabase secrets set`)
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Purge Function Handler Error: Missing Supabase credentials.");
    return new Response(JSON.stringify({ error: 'Internal configuration error.' }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }

  // Create Admin client scoped to this function invocation
  const supabaseAdminEdge = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Execute the main purge logic
    const result = await performPurge(supabaseAdminEdge);
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error("Error during scheduled purge execution:", error);
    return new Response(JSON.stringify({ error: `Purge failed: ${error.message}` }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }
})