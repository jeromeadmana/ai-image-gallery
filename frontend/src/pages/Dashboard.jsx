import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation } from "react-router-dom";
import { logout } from "../services/authService";
import UserMenu from "../components/userMenu";
import GalleryImage from "../components/galleryImage";

const API_URL = import.meta.env.VITE_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Dashboard = () => {
  const [images, setImages] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalImage, setModalImage] = useState(null);
  const limit = 20;

  const location = useLocation();
  const user = location.state?.user;

  const fetchImages = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); 
      if (!token) throw new Error("Missing auth token");

      const res = await fetch(
        `${API_URL}/images?page=${pageNumber}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch images");

      const data = await res.json();
      setImages(data.images || []);
      setPage(data.page);
      setTotalPages(Math.ceil(data.total / data.limit));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const formData = new FormData();
      acceptedFiles.forEach((file) => formData.append("images", file));

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing auth token");

        const res = await fetch(`${API_URL}/images/uploads`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");

        fetchImages(page);
      } catch (err) {
        setError(err.message);
      }
    },
    [page]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const filteredImages = images.filter((img) => {
    const metadata = img.metadata?.[0] || {};
    const desc = metadata.description || "";
    const tags = metadata.tags?.join(" ") || "";
    const colors = metadata.colors?.join(" ") || "";
    const query = search.toLowerCase();
    return (
      desc.toLowerCase().includes(query) ||
      tags.toLowerCase().includes(query) ||
      colors.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <UserMenu email={user?.email || ""} />
          <button
            onClick={async () => {
              await logout();
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className="bg-red-500 text-white px-3 py-2 rounded-md"
          >
            Logout
          </button>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`mb-6 border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop the files here ...</p>
        ) : (
          <p className="text-gray-600">
            Drag & drop images here, or{" "}
            <span className="text-blue-500 font-medium">click to select</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-md mb-6">
        <input
          type="text"
          placeholder="Search by description, tags or colors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search ? (
          <button
            onClick={() => setSearch("")}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md"
          >
            ×
          </button>
        ) : (
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md">
            🔍
          </button>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-40 bg-gray-200 rounded-md animate-pulse"
            />
          ))}
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {!loading && filteredImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <GalleryImage
              key={img.id}
              img={img}
              supabaseUrl={SUPABASE_URL}
              setSearch={setSearch}
              onClick={(modalData) => setModalImage(modalData)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => fetchImages(page - 1)}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => fetchImages(page + 1)}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setModalImage(null)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalImage.url}
              alt="original"
              className="w-full rounded-md mb-4"
            />
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                {modalImage.description || "No description"}
              </p>
              {modalImage.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {modalImage.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setModalImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
