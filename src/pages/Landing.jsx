import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Logo from "../assets/logo.png";
import bgVideo from "../assets/bg-video.mp4";

export default function Landing() {

  // 🔥 Fix autoplay stop when switching tabs
  useEffect(() => {
    const video = document.querySelector("video");

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        video?.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      {/* Foreground Content */}
      <div className="relative z-10 p-6 flex flex-col items-center">
        
        {/* Logo + Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-10"
        >
          

          <h1 className="text-3xl font-extrabold mt-4 drop-shadow-lg">
            Quiz Master
          </h1>
          <p className="text-lg opacity-90 mt-2 text-center max-w-md">
            Elevate learning with fun, interactive, and intelligent quizzes for students and teachers.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col gap-4 w-full max-w-xs"
        >
          <Link to="/login">
            <button className="w-full bg-white text-indigo-700 font-semibold py-3 rounded-2xl shadow-lg hover:bg-gray-200 transition-all">
              Login
            </button>
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 flex items-center gap-2 text-sm opacity-80"
        >
          <p>Empowering campus learning through technology</p>
        </motion.div>

      </div>
    </div>
  );
}
