// workers/aiWorker.js
import "dotenv/config"; // load .env first
import path from "path";

// Optional: resolve absolute path
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);

import { createClient } from "@supabase/supabase-js";
import { analyzeImage } from "../services/_aiService.js";


const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function processPendingImages() {
  const { data: pending, error } = await supabaseAdmin
    .from("image_metadata")
    .select("id, image_id, images(original_path)")
    .eq("ai_processing_status", "pending")
    .limit(5);

  if (error) return console.error("DB fetch error:", error.message);
  if (!pending || pending.length === 0) return;

  for (const item of pending) {
    try {
      // Convert storage key → signed URL
      const { data: signed } = await supabaseAdmin
        .storage
        .from("images")
        .createSignedUrl(item.images.original_path, 300); // 5 minutes

      if (!signed?.signedUrl) {
        console.error(`❌ Could not get signed URL for ${item.image_id}`);
        continue;
      }

      const imageUrl = signed.signedUrl;

      // Run Gemini AI analysis
      const aiData = await analyzeImage(imageUrl);

      // Update metadata
      const { error: updateError } = await supabaseAdmin
        .from("image_metadata")
        .update({
          tags: aiData.tags,
          description: aiData.description,
          colors: aiData.colors,
          ai_processing_status: "done",
        })
        .eq("id", item.id);

      if (updateError) {
        console.error(`❌ Update failed for ${item.image_id}:`, updateError.message);
      } else {
        console.log(`✅ Processed image ${item.image_id}`);
      }
    } catch (err) {
      console.error(`❌ Gemini failed for image ${item.image_id}:`, err.message);
      await supabaseAdmin
        .from("image_metadata")
        .update({ ai_processing_status: "failed" })
        .eq("id", item.id);
    }
  }
}

// Run every 30 seconds
setInterval(processPendingImages, 30 * 1000);
console.log("🛰️ AI worker started: processing pending images every 30 seconds...");
