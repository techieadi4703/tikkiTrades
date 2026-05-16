"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background transition-colors duration-500">
      {/* Primary Glow - Top Left */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
          x: [-20, 20, -20],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[120px]"
      />
      
      {/* Secondary Glow - Bottom Right */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.08, 0.2, 0.08],
          x: [20, -20, 20],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] bg-green-500/8 dark:bg-green-500/10 rounded-full blur-[120px]"
      />

      {/* Animated Grid with Pulsing Effect */}
      <motion.div 
        animate={{
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 dark:opacity-100 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.08) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(16, 185, 129, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 50%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 95%)'
        }}
      />

      {/* Sweeping Highlight / Scanner Effect */}
      <motion.div
        animate={{
          y: ["-100%", "100%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 w-full h-[30%] bg-linear-to-b from-transparent via-emerald-500/3 dark:via-emerald-500/5 to-transparent skew-y-12 pointer-events-none"
      />
      
      {/* Subtle overlay for depth - adapts to theme */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/50 to-background" />
    </div>
  );
};

export default AnimatedBackground;
