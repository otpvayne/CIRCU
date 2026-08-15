"use client";

import { motion } from "motion/react";
import { LoadingDots } from "./LoadingDots";

interface LoadingScreenProps {
  message?: string;
}

/** Pantalla de carga a pantalla completa. Sin fondo propio: hereda el gradiente/grano de globals.css. */
export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4">
      <motion.span
        animate={{ scale: [1, 1.03, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-4xl sm:text-5xl font-bold tracking-[0.2em] text-white"
      >
        CIRCU
      </motion.span>
      <LoadingDots />
      {message && <p className="text-gray-500 text-sm text-center">{message}</p>}
    </div>
  );
}
