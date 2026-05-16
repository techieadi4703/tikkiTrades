'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Loader2, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getJournalPatternAnalysis } from '@/lib/actions/journal.actions';

interface PatternAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  detectedPatterns: string[];
  actionableAdvice: string;
}

export default function PsychologyDashboardModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await getJournalPatternAnalysis(userId);
      if (res.success && res.analysis) {
        setAnalysis(res.analysis);
      } else {
        setError(res.message || "Failed to analyze patterns.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !analysis && !isLoading) {
      fetchAnalysis();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center justify-center gap-2 p-3 bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 rounded-xl border border-violet-500/20 font-bold text-sm transition-all shadow-sm">
          <Brain className="w-4 h-4" />
          AI Psychology Profile
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-background border-border text-foreground sm:max-w-3xl overflow-hidden p-0 h-[80vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="bg-violet-500/10 p-2 rounded-lg text-violet-500 border border-violet-500/20">
              <Brain className="w-6 h-6" />
            </div>
            Trading Psychology Profile
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                <Brain className="w-12 h-12 text-violet-500/50" />
              </motion.div>
              <p>Scanning your trading history for behavioral patterns...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 text-center">
              <AlertTriangle className="w-12 h-12 text-orange-500/50" />
              <p className="max-w-md">{error}</p>
              <Button onClick={fetchAnalysis} variant="outline">Try Again</Button>
            </div>
          ) : analysis ? (
            <AnimatePresence mode="popLayout">
              {/* Summary */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/50 border border-border p-5 rounded-xl"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Executive Summary
                </h3>
                <p className="text-foreground leading-relaxed text-lg">
                  {analysis.summary}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patterns */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-card border border-violet-500/20 p-5 rounded-xl shadow-sm"
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider text-violet-500 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Hidden Patterns
                  </h3>
                  <ul className="space-y-3">
                    {analysis.detectedPatterns.map((p, i) => (
                      <li key={i} className="flex gap-3 text-sm text-foreground">
                        <span className="text-violet-500 font-bold shrink-0">{i+1}.</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Strengths & Weaknesses */}
                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-card border border-emerald-500/20 p-5 rounded-xl shadow-sm"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Strengths
                    </h3>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <span className="text-emerald-500 text-lg leading-none">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-card border border-red-500/20 p-5 rounded-xl shadow-sm"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Vulnerabilities
                    </h3>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <span className="text-red-500 text-lg leading-none">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              </div>

              {/* Actionable Advice */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl shadow-sm"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Primary Directive
                </h3>
                <p className="text-blue-950 dark:text-blue-100 font-medium">
                  {analysis.actionableAdvice}
                </p>
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
