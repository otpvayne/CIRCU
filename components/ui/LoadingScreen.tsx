"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { LoadingDots } from "./LoadingDots";

interface LoadingScreenProps {
  message?: string;
}

/** Pantalla de carga a pantalla completa. Sin fondo propio: hereda el gradiente/grano de globals.css. */
export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4">
      <motion.div
        animate={{ scale: [1, 1.03, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image src="/icons/icon-512.png" alt="CIRCU" width={88} height={88} className="rounded-2xl" priority />
      </motion.div>
      <LoadingDots />
      {message && <p className="text-gray-500 text-sm text-center">{message}</p>}
    </div>
  );
}
