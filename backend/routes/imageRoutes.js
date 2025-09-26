import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import upload from "../utils/multerConfig.js";
import {
  uploadImages,
  getImages,
  getImageById,
  deleteImages,
  getImageMetadata,
  searchImages
} from "../controllers/imageController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Image upload, retrieval, and deletion
 *
 * /images:
 *   get:
 *     summary: Get paginated list of uploaded images
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Paginated list of images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Image'
 *
 *   post:
 *     summary: Upload single or multiple images
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Uploaded images info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploaded:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Image'
 *
 *   delete:
 *     summary: Delete multiple images (batch)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: List of image IDs to delete
 *     responses:
 *       200:
 *         description: Images deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       404:
 *         description: No images found for deletion
 *
 * /images/{id}:
 *   get:
 *     summary: Get single image with metadata
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image object with metadata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageWithMetadata'
 *       404:
 *         description: Image not found
 *
 *   delete:
 *     summary: Delete a single image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: integer
 *       404:
 *         description: Image not found
 *
 * /images/{id}/metadata:
 *   get:
 *     summary: Get AI metadata for a specific image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metadata for the image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageMetadata'
 *       404:
 *         description: Metadata not found
 *
 * /images/search:
 *   get:
 *     summary: Search images by tags, description, similar images, or color
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Keyword or tag to search for (e.g., "sunset")
 *       - in: query
 *         name: similarToId
 *         schema:
 *           type: string
 *         description: Image ID to find similar images based on tags
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter images by color (e.g., "blue")
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Paginated search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ImageWithMetadata'
 *       400:
 *         description: Invalid search parameters
 *       500:
 *         description: Failed to perform search
 */

router.get("/search", requireAuth, searchImages);
router.get("/", requireAuth, getImages);
router.post("/uploads", requireAuth, upload.array("images", 10), uploadImages);
router.get("/:id", requireAuth, getImageById);
router.delete("/:id", requireAuth, deleteImages);
router.delete("/", requireAuth, deleteImages);
router.get("/:id/metadata", requireAuth, getImageMetadata);


export default router;
