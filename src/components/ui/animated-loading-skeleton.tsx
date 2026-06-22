"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

type GridConfig = {
  numCards: number;
  cols: number;
  xBase: number;
  yBase: number;
  xStep: number;
  yStep: number;
};

const ease = [0.4, 0, 0.2, 1] as const;

function getGridConfig(width: number): GridConfig {
  return {
    numCards: 6,
    cols: width >= 1024 ? 3 : width >= 640 ? 2 : 1,
    xBase: 40,
    yBase: 60,
    xStep: 210,
    yStep: 230
  };
}

function generateSearchPath(config: GridConfig) {
  const { numCards, cols, xBase, yBase, xStep, yStep } = config;
  const rows = Math.ceil(numCards / cols);
  const positions: Array<{ x: number; y: number }> = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (row * cols + col < numCards) {
        positions.push({ x: xBase + col * xStep, y: yBase + row * yStep });
      }
    }
  }

  const shuffled = positions.sort(() => Math.random() - 0.5).slice(0, 4);
  shuffled.push(shuffled[0]);

  return {
    x: shuffled.map((pos) => pos.x),
    y: shuffled.map((pos) => pos.y),
    scale: Array(shuffled.length).fill(1.2),
    transition: {
      duration: shuffled.length * 2,
      repeat: Infinity,
      ease,
      times: shuffled.map((_, i) => i / (shuffled.length - 1))
    }
  };
}

export default function AnimatedLoadingSkeleton() {
  const [windowWidth, setWindowWidth] = useState(0);
  const controls = useAnimation();
  const config = getGridConfig(windowWidth);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    controls.start(generateSearchPath(getGridConfig(windowWidth)));
  }, [windowWidth, controls]);

  return (
    <motion.div
      className="mx-auto w-full max-w-4xl rounded-xl bg-white p-6 shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <motion.div className="pointer-events-none absolute z-10" animate={controls} style={{ left: 24, top: 24 }}>
          <motion.div
            className="rounded-full bg-blue-500/20 p-3 backdrop-blur-sm"
            animate={{
              boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.2)",
                "0 0 35px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(59, 130, 246, 0.2)"
              ],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(config.numCards)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              className="rounded-lg bg-white p-4 shadow-sm"
            >
              <motion.div
                className="mb-3 h-32 rounded-md bg-gray-200"
                animate={{ background: ["#f3f4f6", "#e5e7eb", "#f3f4f6"] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="mb-2 h-3 w-3/4 rounded bg-gray-200"
                animate={{ background: ["#f3f4f6", "#e5e7eb", "#f3f4f6"] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="h-3 w-1/2 rounded bg-gray-200"
                animate={{ background: ["#f3f4f6", "#e5e7eb", "#f3f4f6"] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
