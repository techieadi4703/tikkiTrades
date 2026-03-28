"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface LiveChartProps {
  color?: string;
  trend?: "up" | "down" | "neutral";
}

const LiveChart = ({ color = "#22c55e", trend = "neutral" }: LiveChartProps) => {
  const [data, setData] = useState<number[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate initial spiky data
    const initialData = Array.from({ length: 24 }, (_, i) => {
      const base = trend === "up" ? 20 + i * 2 : trend === "down" ? 80 - i * 2 : 50;
      return base + (Math.random() - 0.5) * 45; // Increased variance for spikiness
    });
    setData(initialData);

    // Update data with sharp shifts
    const interval = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        let next;
        const shift = (Math.random() - 0.5) * 40; // Sharper real-time updates
        if (trend === "up") {
          next = Math.max(10, Math.min(95, last + Math.random() * 25 - 5));
        } else if (trend === "down") {
          next = Math.max(5, Math.min(90, last - Math.random() * 25 + 5));
        } else {
          next = Math.max(10, Math.min(90, last + shift));
        }
        return [...prev.slice(1), next];
      });
    }, 1500); // Slightly faster updates for a "live" feel

    return () => clearInterval(interval);
  }, [trend]);


  const maxValue = 100;
  const width = 400;
  const height = 150;
  const step = width / (data.length - 1);

  const points = data
    .map((val, i) => `${i * step},${height - (val / maxValue) * height}`)
    .join(" ");

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.round(x / (rect.width / (data.length - 1)));
    if (index >= 0 && index < data.length) setHoverIndex(index);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
      className="w-full h-40 relative group cursor-crosshair"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        style={{ filter: `drop-shadow(0 0 8px ${color}44)` }}
      >
        <defs>
          <linearGradient id={`chartGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {data.length > 0 && (
          <>
            <motion.polyline
              fill={`url(#chartGradient-${color})`}
              stroke="none"
              points={`0,${height} ${points} ${width},${height}`}
              animate={{ points: `0,${height} ${points} ${width},${height}` }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            <motion.polyline
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              animate={{ points }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </>
        )}
        
        <AnimatePresence>
          {hoverIndex !== null && data[hoverIndex] !== undefined && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <line x1={hoverIndex * step} y1="0" x2={hoverIndex * step} y2={height} stroke="white" strokeWidth="1" strokeDasharray="4 2" opacity="0.3" />
              <circle cx={hoverIndex * step} cy={height - (data[hoverIndex] / maxValue) * height} r="5" fill={color} stroke="white" strokeWidth="2" />
            </motion.g>
          )}
        </AnimatePresence>

        {!hoverIndex && data.length > 0 && (
          <motion.circle
            cx={width}
            cy={height - (data[data.length - 1] / maxValue) * height}
            r="4"
            fill={color}
            animate={{ cy: height - (data[data.length - 1] / maxValue) * height }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
          </motion.circle>
        )}
      </svg>


      <AnimatePresence>
        {hoverIndex !== null && data[hoverIndex] !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute top-0 pointer-events-none bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded text-[10px] text-white font-mono z-20"
            style={{ 
              left: `${(hoverIndex / (data.length - 1)) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            {trend === "down" ? "-" : ""}${(data[hoverIndex] * (trend === "up" ? 850.42 : 124.50)).toFixed(2)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MarketCard = ({ 
  symbol, 
  price, 
  change, 
  isActive, 
  onClick 
}: { 
  symbol: string, 
  price: string, 
  change: string,
  isActive?: boolean,
  onClick?: () => void
}) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`p-4 rounded-xl flex justify-between items-center w-full cursor-pointer transition-all duration-300 group ${
      isActive 
        ? "bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
        : "bg-black/40 border-white/10 hover:bg-white/5"
    } border`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
        isActive 
          ? "bg-white/20 text-white" 
          : change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}>
        {symbol.charAt(0)}
      </div>
      <div>
        <h3 className={`font-bold uppercase transition-colors ${isActive ? 'text-white' : 'group-hover:text-green-400 text-gray-200'}`}>{symbol}</h3>
        <p className="text-gray-400 text-xs">Real-time Feed</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-white font-mono font-medium">{price}</p>
      <p className={`text-xs font-semibold ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
        {change}
      </p>
    </div>
  </motion.div>
);

export default LiveChart;


