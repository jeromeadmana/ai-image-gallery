import React, { useState } from "react";

const GalleryImage = ({ img, supabaseUrl, onClick, setSearch }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const metadata = img.metadata?.[0] || {};
  const originalUrl = `${supabaseUrl}/${img.original_path}`;
  const thumbnailUrl = img.thumbnail_path
    ? `${supabaseUrl}/${img.thumbnail_path}`
    : originalUrl;

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer p-2 relative"
      onClick={() =>
        onClick({
          url: originalUrl,
          description: metadata.description,
          tags: metadata.tags || [],
        })
      }
    >
      {/* Spinner overlay */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <img
        src={thumbnailUrl}
        alt={img.filename}
        className={`w-full h-40 object-cover rounded-md mb-2 transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
      />

      <div className="flex flex-wrap gap-2">
        {metadata.tags?.map((tag, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setSearch(tag);
            }}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GalleryImage;
