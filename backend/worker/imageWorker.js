// workers/imageWorker.js
import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { analyzeImage } from "../services/_aiService.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export const imageWorker = new Worker("imageQueue", async (job) => {
  const { imageId, userId, imageUrl } = job.data;

  try {
    const aiData = await analyzeImage(imageUrl);

    await supabaseAdmin.from("image_metadata").insert({
      image_id: imageId,
      user_id: userId,
      tags: aiData.tags,
      colors: aiData.colors,
      description: aiData.description,
      ai_processing_status: "done"
    });

    console.log(`✅ AI metadata saved for image ${imageId}`);
  } catch (err) {
    console.error(`❌ Worker failed for image ${imageId}:`, err.message);

    await supabaseAdmin.from("image_metadata").insert({
      image_id: imageId,
      user_id: userId,
      ai_processing_status: "failed"
    });
  }
});
