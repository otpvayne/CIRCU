import type { Variants } from "motion/react";

/** Fade + slide sutil para la entrada escalonada de secciones. Usar con `custom={delaySeconds}`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay },
  }),
};

/** Contenedor para listas con stagger entre hijos (usar junto a staggerItem). */
export const staggerList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};
