# AI Image Gallery

A fullstack web application for generating, uploading, and browsing AI-generated images. Built with a React frontend and Node.js backend.

## Features

- User authentication (register, login, protected routes)
- AI image generation (via backend workers)
- Image upload and gallery browsing
- REST API with Swagger documentation
- Supabase integration for storage
- In-memory queue for image processing

## Project Structure

```
ai-image-gallery/
  ├── backend/   # Node.js/Express API, AI workers, Supabase integration
  └── frontend/  # React app (Vite), UI components, pages
```

## Getting Started

### Prerequisites

- Node.js (v22+ recommended)
- npm or yarn
- Supabase account (for image storage)

### Setup

#### Backend

1. Copy `.env.example` to `.env` and fill in your environment variables.
2. Install dependencies:
   ```
   cd backend
   npm install
   ```
3. Start the backend server:
   ```
   npm start
   ```

#### Frontend

1. Copy `.env.example` to `.env` and configure API endpoints.
2. Install dependencies:
   ```
   cd frontend
   npm install
   ```
3. Install Tailwind (if not already installed correctly):
   ```
   npm install tailwindcss @tailwindcss/vite
   ```
4. Start the frontend dev server:
   ```
   npm run dev
   ```

### API Documentation

- Swagger docs available at `/api-docs` when backend is running.

## Scripts

- `npm run start` from the parent folder

## Environment Variables

Both frontend and backend require `.env` files for configuration. See `.env.example` in each folder.

## License

MIT

---

*This project is for educational purposes and demonstrates fullstack AI image gallery concepts.*