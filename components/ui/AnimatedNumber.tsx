"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  formatter: (n: number) => string;
  duration?: number;
  className?: string;
}

/** Cuenta desde 0 hasta `value` al montar (o cuando `value` cambia), sin re-render de React. */
export function AnimatedNumber({ value, formatter, duration = 1.2, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => formatter(Math.round(latest)));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [value, duration, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
