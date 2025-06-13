import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { performPurge } from "./performPurge"; // Make sure this exists and is correct

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Purge Function Handler Error: Missing Supabase credentials.");
    return res.status(500).json({ error: "Internal configuration error." });
  }

  const supabaseAdminEdge = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const result = await performPurge(supabaseAdminEdge);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error during scheduled purge execution:", error);
      return res.status(500).json({ error: `Purge failed: ${error.message}` });
    } else {
      console.error("Unknown error:", error);
      return res.status(500).json({ error: "Unknown error during purge." });
    }
  }
}