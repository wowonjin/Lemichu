"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export const SECTION_EASE = [0.22, 1, 0.36, 1] as const;

export const revealVariants = {
  up: {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  soft: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  left: {
    hidden: { opacity: 0, x: -22 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 22 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  },
} as const;

export type RevealVariant = keyof typeof revealVariants;

export const revealViewport = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -8% 0px",
} as const;

export const panelStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

export const panelItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: SECTION_EASE },
  },
};

export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
  duration = 0.7,
}: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      variants={revealVariants[variant]}
      transition={{ duration, delay, ease: SECTION_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0.06,
  as = "div",
  role,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  as?: "div" | "ul";
  role?: string;
  "aria-label"?: string;
}) {
  const reduceMotion = useReducedMotion();
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : stagger,
        delayChildren: reduceMotion ? 0 : delay,
      },
    },
  };

  if (as === "ul") {
    return (
      <motion.ul
        className={className}
        role={role}
        aria-label={ariaLabel}
        initial="hidden"
        whileInView="visible"
        viewport={revealViewport}
        variants={variants}
      >
        {children}
      </motion.ul>
    );
  }

  return (
    <motion.div
      className={className}
      role={role}
      aria-label={ariaLabel}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  variant = "soft",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  as?: "div" | "li";
}) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : revealVariants[variant];

  if (as === "li") {
    return (
      <motion.li
        className={className}
        variants={variants}
        transition={{ duration: 0.55, ease: SECTION_EASE }}
      >
        {children}
      </motion.li>
    );
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      transition={{ duration: 0.55, ease: SECTION_EASE }}
    >
      {children}
    </motion.div>
  );
}
