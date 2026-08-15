"use client";

import { motion, type Variants } from "motion/react";

const dotVariants: Variants = {
  animate: (i: number) => ({
    scale: [1, 1.4, 1],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 1.1,
      repeat: Infinity,
      ease: "easeInOut",
      delay: i * 0.15,
    },
  }),
};

interface LoadingDotsProps {
  size?: number;
  color?: string;
  className?: string;
}

/** Puntos animados en secuencia, tipo "typing indicator". Para loaders inline (botones, texto pequeño). */
export function LoadingDots({ size = 7, color = "#FF2E2E", className }: LoadingDotsProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`} role="status" aria-label="Cargando">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          custom={i}
          animate="animate"
          variants={dotVariants}
          className="rounded-full"
          style={{ width: size, height: size, backgroundColor: color }}
        />
      ))}
    </span>
  );
}
