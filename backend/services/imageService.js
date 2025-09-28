import fs from "fs";
import sharp from "sharp";
import OpenAI from "openai";
import { setTimeout as delay } from "node:timers/promises";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const processAndUpload = async (file, userId, supabaseClient) => {
  const buffer = file.buffer || fs.readFileSync(file.path);
  const thumbBuffer = await sharp(buffer).resize(300, 300).toBuffer();
  const bucket = "images";

  const originalPath = `${userId}/originals/${file.originalname}`;
  const thumbnailPath = `${userId}/thumbnails/${file.originalname}`;

  const { error: origError } = await supabaseClient.storage
    .from(bucket)
    .upload(originalPath, buffer, { contentType: file.mimetype, upsert: true });
  if (origError) throw origError;

  const { error: thumbError } = await supabaseClient.storage
    .from(bucket)
    .upload(thumbnailPath, thumbBuffer, { contentType: file.mimetype, upsert: true });
  if (thumbError) throw thumbError;

  if (file.path) fs.unlinkSync(file.path);

  return {
    filename: file.originalname,
    original_path: originalPath,
    thumbnail_path: thumbnailPath,
    original_url: supabaseClient.storage.from(bucket).getPublicUrl(originalPath).data.publicUrl,
    thumbnail_url: supabaseClient.storage.from(bucket).getPublicUrl(thumbnailPath).data.publicUrl,
  };
};

export const deleteFromStorage = async (image) => {
  const bucket = "images";

  try {
    const pathsToDelete = [];

    const extractPath = (urlOrPath) => {
      if (!urlOrPath) return null;
      if (urlOrPath.startsWith("http")) {
        const parts = urlOrPath.split(`/storage/v1/object/public/${bucket}/`);
        return parts[1];
      }
      return urlOrPath;
    };

    if (image.original_path) pathsToDelete.push(extractPath(image.original_path));
    if (image.thumbnail_path) pathsToDelete.push(extractPath(image.thumbnail_path));

    for (const path of pathsToDelete) {
      if (!path) continue;

      const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
      if (error) {
        console.error(`Failed to delete file ${path}:`, error.message);
      } else {
        console.log(`Deleted file ${path} successfully`);
      }
    }
  } catch (err) {
    console.error("deleteFromStorage error:", err);
    throw err;
  }
};

export const analyzeImage = async (imageUrl, retries = 3) => {
  if (!imageUrl) throw new Error("Missing image URL for analysis");

  const prompt = `Analyze this image and return a JSON object with:
- description: short caption of the image
- tags: array of relevant keywords
- colors: dominant colors
Image URL: ${imageUrl}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices?.[0]?.message?.content;

    try {
      return JSON.parse(raw);
    } catch {
      return { description: raw, tags: [], colors: [] };
    }
  } catch (err) {
    if ((err.code === "insufficient_quota" || err.status === 429) && retries > 0) {
      console.warn("Quota exceeded, retrying in 10s...");
      await delay(10000);
      return analyzeImage(imageUrl, retries - 1);
    }
    throw err;
  }
};

export default {
  processAndUpload,
  deleteFromStorage,
  analyzeImage,
};
