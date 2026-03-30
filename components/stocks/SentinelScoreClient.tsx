'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Info, Activity } from 'lucide-react';
import { SentinelScore } from '@/database/models/newsCache.model';

export default function SentinelScoreClient({ scoreData }: { scoreData?: SentinelScore }) {
  const [isOpen, setIsOpen] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  if (!scoreData) return null;

  const { score, verdict, rationale, bulls, bears } = scoreData;

  useEffect(() => {
    // Small delay to let the component mount before animating
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  // Determine color based on score
  const getColor = (val: number) => {
    if (val <= 30) return { stroke: '#ef4444', text: 'text-red-500', glow: 'drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' };
    if (val <= 55) return { stroke: '#f59e0b', text: 'text-amber-500', glow: 'drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' };
    if (val <= 75) return { stroke: '#10b981', text: 'text-emerald-500', glow: '' };
    return { stroke: '#34d399', text: 'text-emerald-400', glow: 'drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]' };
  };

  const styleParams = getColor(score);
  
  // SVG Gauge Math
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="bg-white/2 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
      <div className="flex items-center gap-2 mb-6 w-full opacity-80">
        <Activity className="w-5 h-5 text-emerald-500" />
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">AI Sentinel Score</h3>
      </div>

      {/* Circular Gauge */}
      <div className="relative flex items-center justify-center w-40 h-40 mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white/10"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            stroke={styleParams.stroke}
            strokeWidth="10"
            fill="transparent"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ type: "spring", duration: 2, bounce: 0.1 }}
            style={{ strokeDasharray: circumference }}
            className={`transition-all duration-1000 ${styleParams.glow}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black ${styleParams.text} tracking-tighter`}>
            {animatedScore}
          </span>
          <span className="text-[10px] text-gray-500 font-medium uppercase mt-1 tracking-wider">/ 100</span>
        </div>
      </div>

      <div className={`text-xl font-black uppercase tracking-wider ${styleParams.text} mb-6 text-center`}>
        {verdict}
      </div>

      {/* Collapsible Section */}
      <div className="w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl text-sm font-semibold text-gray-300"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-500" />
            <span>View Rationale</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pb-2 space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed px-2">
                  {rationale}
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Bull Case</h4>
                    </div>
                    <ul className="space-y-2">
                      {bulls?.map((bull, i) => (
                        <li key={i} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span className="leading-relaxed">{bull}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Bear Case</h4>
                    </div>
                    <ul className="space-y-2">
                      {bears?.map((bear, i) => (
                        <li key={i} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span className="leading-relaxed">{bear}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
