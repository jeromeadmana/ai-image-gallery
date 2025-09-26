import { createClient } from "@supabase/supabase-js";
import supabase from "../lib/supabaseClient.js";
import imageService from "../services/imageService.js";
import { addJob } from "../services/inMemoryQueue.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const requireUserId = (req) => {
  if (!req.user?.id) throw new Error("Authenticated user ID missing");
  return req.user.id;
};


export const getImages = async (req, res) => {
  try {
    const userId = requireUserId(req);
    console.log("getImages for user ID:", userId);

    const { page = 1, limit = 20 } = req.query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from("images")
      .select(`
        *,
        metadata: image_metadata (
          id,
          description,
          tags,
          colors,
          ai_processing_status,
          created_at
        )
      `, { count: "exact" })
      .eq("user_id", userId)
      .range(from, to)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("Fetched images:", data?.length);
    res.json({ page: Number(page), limit: Number(limit), total: count, images: data });
  } catch (err) {
    console.error("getImages error:", err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
};

export const uploadImages = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    const results = [];

    for (const file of files) {
      console.log("Processing file:", file.originalname);

      const uploadResult = await imageService.processAndUpload(file, req.user.id, supabaseAdmin);

      const { data: imageRecord, error: dbErr } = await supabaseAdmin
        .from("images")
        .insert({
          user_id: req.user.id,
          filename: uploadResult.filename,
          original_path: uploadResult.original_path,
          thumbnail_path: uploadResult.thumbnail_path
        })
        .select()
        .single();
      if (dbErr) throw new Error(`DB insert failed: ${dbErr.message}`);

      await supabaseAdmin.from("image_metadata").insert({
        image_id: imageRecord.id,
        user_id: req.user.id,
        ai_processing_status: "pending"
      });

      addJob(
        { imageId: imageRecord.id, userId: req.user.id, imageUrl: uploadResult.original_url },
        async ({ imageId, userId, imageUrl }) => {
          try {
            console.log(`🚀 AI processing started for image ${imageId}`);
            await supabaseAdmin.from("image_metadata").update({ ai_processing_status: "processing" }).eq("image_id", imageId);

            const aiResult = await imageService.analyzeImage(imageUrl);
            console.log(`💡 AI result for image ${imageId}:`, aiResult);

            await supabaseAdmin.from("image_metadata").update({
              tags: aiResult.tags,
              colors: aiResult.colors,
              description: aiResult.description,
              ai_processing_status: "done"
            }).eq("image_id", imageId);

            console.log(`AI metadata saved for image ${imageId}`);
          } catch (err) {
            console.error(`AI processing failed for image ${imageId}:`, err.message);
            await supabaseAdmin.from("image_metadata").update({ ai_processing_status: "failed" }).eq("image_id", imageId);
          }
        }
      );

      results.push(imageRecord);
    }

    res.json({ uploaded: results });
  } catch (err) {
    console.error("uploadImages error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const getImageById = async (req, res) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params;

    const { data, error } = await supabase
      .from("images")
      .select("*, image_metadata(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) return res.status(404).json({ error: "Image not found" });

    res.json(data);
  } catch (err) {
    console.error("getImageById error:", err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
};

export const deleteImages = async (req, res) => {
  try {
    const userId = requireUserId(req);
    let ids = [];

    if (req.params.id) {
      ids = [Number(req.params.id)]; 
    } else if (Array.isArray(req.body.ids) && req.body.ids.length > 0) {
      ids = req.body.ids.map(id => Number(id)); 
    } else {
      return res.status(400).json({ error: "No image IDs provided" });
    }

    console.log("Attempting delete for IDs:", ids, "user ID:", userId);

    const { data: images, error: fetchErr } = await supabaseAdmin
      .from("images")
      .select("*")
      .in("id", ids)
      .eq("user_id", userId);

    if (fetchErr) throw fetchErr;

    if (!images || images.length === 0) {
      return res.status(404).json({ error: "No images found for deletion" });
    }

    await supabaseAdmin
      .from("image_metadata")
      .delete()
      .in("image_id", images.map(img => img.id))
      .eq("user_id", userId);

    const { data: deletedImages, error: delErr } = await supabaseAdmin
      .from("images")
      .delete()
      .in("id", images.map(img => img.id))
      .eq("user_id", userId)
      .select();

    if (delErr) throw delErr;

    for (const img of images) {
      try {
        await imageService.deleteFromStorage(img);
      } catch (err) {
        console.error(`Failed to delete storage file for image ${img.id}:`, err.message);
      }
    }

    res.json({ message: "Images deleted successfully", deletedCount: deletedImages.length });
  } catch (err) {
    console.error("deleteImages error:", err);
    res.status(500).json({ error: "Failed to delete images" });
  }
};

export const getImageMetadata = async (req, res) => {
  try {
    const userId = requireUserId(req);
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("image_metadata")
      .select("*")
      .eq("image_id", id)
      .eq("user_id", userId)
     .single();
    
      console.log("Metadata row:", data);
console.log("Authenticated user ID:", req.user.id);

    if (error || !data) return res.status(404).json({ error: "Metadata not found" });

    res.json(data);
  } catch (err) {
    console.error("getImageMetadata error:", err);
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
};

export const searchImages = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { query, color, page = 1, limit = 20, similarToId } = req.query;
    const offset = (page - 1) * limit;

    console.log("[searchImages] userId:", userId);
    console.log("[searchImages] query params:", req.query);

    let filter = supabaseAdmin
      .from("image_metadata")
      .select(`
        id,
        image_id,
        description,
        tags,
        colors,
        ai_processing_status,
        created_at,
        images:images(filename, original_path, thumbnail_path)
      `)
      .eq("user_id", userId);

    if (similarToId) {
      console.log("[searchImages] finding similar to image ID:", similarToId);
      const { data: refImage, error: refErr } = await supabaseAdmin
        .from("image_metadata")
        .select("tags")
        .eq("id", similarToId)
        .single();

      if (refErr || !refImage) {
        console.error("[searchImages] reference image not found:", refErr);
        return res.status(404).json({ error: "Reference image not found" });
      }

      filter = filter.overlaps("tags", refImage.tags);
    } else {
      if (query) {
        console.log("[searchImages] applying text search:", query);
        filter = filter.ilike("description", `%${query}%`);
      }

      if (color) {
        console.log("[searchImages] applying color filter:", color);
        filter = filter.contains("colors", [color.toLowerCase()]);
      }
    }

    const { data, error } = await filter.range(offset, offset + limit - 1);

    if (error) {
      console.error("[searchImages] query error:", error);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    console.log("[searchImages] returned data count:", data.length);
    res.json({ data, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("[searchImages] error:", err);
    res.status(500).json({ error: "Failed to search images" });
  }
};

