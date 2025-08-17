import { useState, useEffect, useRef, useCallback, memo } from "react";
import PropTypes from "prop-types";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  orderBy, // 🔹 Import orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase-comment";
import {
  MessageCircle,
  UserCircle2,
  Loader2,
  AlertCircle,
  Send,
} from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

// 🔹 Komponen Komentar
const Comment = memo(({ comment, formatDate, index }) => (
  <div
    className={`px-4 pt-4 pb-2 rounded-xl border transition-all group hover:shadow-lg hover:-translate-y-0.5 ${
      comment.role === "admin"
        ? "bg-indigo-500/10 border-indigo-500/30"
        : "bg-white/5 border-white/10 hover:bg-white/10"
    }`}
    data-aos="fade-up"
    data-aos-delay={index * 100}
  >
    <div className="flex items-start gap-3">
      {comment.profileImage ? (
        <img
          src={comment.profileImage}
          alt={`${comment.userName}'s profile`}
          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/30"
          loading="lazy"
        />
      ) : (
        <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
          <UserCircle2 className="w-5 h-5" />
        </div>
      )}

      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h4 className="font-medium text-white truncate flex items-center gap-2">
            {comment.userName}
            {comment.role === "admin" && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500 text-white font-medium">
                Admin
              </span>
            )}
          </h4>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="text-gray-300 text-sm break-words leading-relaxed relative bottom-2">
          {comment.content}
        </p>
      </div>
    </div>
  </div>
));

Comment.propTypes = {
  comment: PropTypes.shape({
    profileImage: PropTypes.string,
    userName: PropTypes.string.isRequired,
    createdAt: PropTypes.object,
    content: PropTypes.string.isRequired,
    role: PropTypes.string,
  }).isRequired,
  formatDate: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

// 🔹 Komponen Form
const CommentForm = memo(({ onSubmit, isSubmitting, error }) => {
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size cannot exceed 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleTextareaChange = useCallback((e) => {
    setNewComment(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!newComment.trim() || !userName.trim()) return;

      onSubmit({ newComment, userName, imageFile });
      setNewComment("");
      setUserName(""); // 🔹 Menambahkan reset untuk userName
      setImagePreview(null);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    },
    [newComment, userName, imageFile, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2" data-aos="fade-up" data-aos-duration="1000">
        <label className="block text-sm font-medium text-white">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          required
        />
      </div>

      <div className="space-y-2" data-aos="fade-up" data-aos-duration="1200">
        <label className="block text-sm font-medium text-white">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={handleTextareaChange}
          placeholder="Write your message here..."
          className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none min-h-[120px]"
          required
        />
      </div>

      {/* 🔹 Input Foto Profil */}
      <div className="space-y-2" data-aos="fade-up" data-aos-duration="1400">
        <label className="block text-sm font-medium text-white">
          Profile Photo <span className="text-gray-400">(optional)</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <div
          onClick={() => !imagePreview && fileInputRef.current?.click()}
          className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm cursor-pointer hover:border-indigo-500 transition-all flex flex-col items-center justify-center space-y-2"
        >
          {imagePreview ? (
            <div className="flex flex-col items-center space-y-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // biar gak langsung trigger pilih file
                  setImagePreview(null);
                  setImageFile(null); // 🔹 Menambahkan reset untuk imageFile
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition"
              >
                Delete
              </button>
            </div>
          ) : (
            "Choose Profile Photo"
          )}
        </div>

        <p className="text-xs text-gray-400">Max file size: 5MB</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        data-aos="fade-up"
        data-aos-duration="1000"
        className="relative w-full h-12 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl font-medium text-white overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-12 group-hover:translate-y-0 transition-transform duration-300" />
        <div className="relative flex items-center justify-center gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Post Comment</span>
            </>
          )}
        </div>
      </button>
    </form>
  );
});

CommentForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
};

// 🔹 Komponen Utama
const Komentar = () => {
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    AOS.init({ once: false, duration: 1000 });
  }, []);

  useEffect(() => {
    const commentsRef = collection(db, "portfolio-comments");
    // 🔹 Menambahkan orderBy untuk mengurutkan berdasarkan createdAt secara descending
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, []); // 🔹 Dependensi kosong karena onSnapshot akan terus mendengarkan perubahan

  const uploadImage = useCallback(async (imageFile) => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", "portfolio_profile"); // 🔹 Ganti dengan upload preset dari Cloudinary
    formData.append("folder", "portfolio/profile_images"); // opsional

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dwdwa65i4/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url; // 🔹 URL gambar dari Cloudinary
      } else {
        throw new Error("Failed to upload image to Cloudinary");
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setError("Failed to upload image. Please try again.");
      return null;
    }
  }, []);

  const handleCommentSubmit = useCallback(
    async ({ newComment, userName, imageFile }) => {
      setError("");
      setIsSubmitting(true);

      try {
        const profileImageUrl = await uploadImage(imageFile);

        // 🔹 Tidak perlu me-refresh state secara manual. onSnapshot di useEffect akan melakukannya secara otomatis.
        await addDoc(collection(db, "portfolio-comments"), {
          content: newComment,
          userName,
          profileImage: profileImageUrl,
          role: "guest",
          createdAt: serverTimestamp(),
        });

        // 🔹 Setelah berhasil, `onSnapshot` di `useEffect` akan secara otomatis
        // 🔹 mendengarkan perubahan dan memperbarui state `comments`.
        // 🔹 Jadi, tidak perlu lagi memanggil `setComments` di sini.
      } catch (error) {
        setError("Failed to post comment. Please try again.");
        console.error("Error adding comment: ", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [uploadImage]
  );

  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }, []);

  // 🔹 Memisahkan komentar admin dari komentar tamu untuk render
  const adminComments = comments.filter((c) => c.role === "admin");
  const guestComments = comments.filter((c) => c.role !== "admin");

  return (
    <div
      className="w-full bg-gradient-to-b from-white/10 to-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl"
      data-aos="fade-up"
      data-aos-duration="1000"
    >
      <div
        className="p-6 border-b border-white/10"
        data-aos="fade-down"
        data-aos-duration="800"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20">
            <MessageCircle className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">
            Comments{" "}
            <span className="text-indigo-400">({comments.length})</span>
          </h3>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {error && (
          <div
            className="flex items-center gap-2 p-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl"
            data-aos="fade-in"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* 🔹 Form Komentar */}
        <CommentForm
          onSubmit={handleCommentSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />

        {/* 🔹 Daftar Komentar */}
        <div
          className="space-y-4 h-[300px] overflow-y-auto custom-scrollbar"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          {/* Pinned Admin Comment */}
          {adminComments.map((comment) => (
            <div key={comment.id} className="mb-2">
              {/* Header pinned comment */}
              <div className="flex items-center gap-2 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 11.657L13.414 7.414m0 0a2 2 0 112.828-2.828l4.243 4.243a2 2 0 01-2.828 2.828L13.414 7.414zm-2.121 2.121L6 15l-1.5 4.5L9 18l5.293-5.293"
                  />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide text-indigo-400">
                  Pinned Comment
                </span>
              </div>

              {/* Komentar */}
              <Comment comment={comment} formatDate={formatDate} index={0} />
            </div>
          ))}

          {/* Guest Comments */}
          {guestComments.map((comment, index) => (
            <Comment
              key={comment.id}
              comment={comment}
              formatDate={formatDate}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* 🔹 Custom Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
};

export default Komentar;
