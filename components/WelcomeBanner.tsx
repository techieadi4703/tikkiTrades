'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Zap, BarChart3 } from 'lucide-react';

const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening'];

export default function WelcomeBanner({ userName }: { userName: string }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? GREETINGS[0] : hour < 17 ? GREETINGS[1] : GREETINGS[2];
  const firstName = userName?.split(' ')[0] || 'Trader';

  const stats = [
    { icon: BarChart3, label: 'Markets Open', value: 'NYSE · NASDAQ', color: 'text-emerald-500' },
    { icon: Zap, label: 'Real-time Data', value: 'Active', color: 'text-amber-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500/10 via-background to-background border border-emerald-500/20 p-6 md:p-8 mb-8 shadow-xl"
    >
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-widest">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {greeting}, <span className="text-emerald-500">{firstName}</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md">
            Here's your market dashboard. Explore real-time data, heatmaps, and breaking financial news.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 bg-card/80 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-sm"
            >
              <div className={`p-2 rounded-lg bg-secondary/80 ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-sm font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
