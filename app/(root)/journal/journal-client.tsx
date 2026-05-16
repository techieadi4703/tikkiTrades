'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { createJournalEntry, retryJournalAnalysis } from '@/lib/actions/journal.actions';
import { 
  BookOpen, 
  PenTool, 
  TrendingUp, 
  AlertTriangle, 
  BrainCircuit, 
  Lightbulb,
  Plus,
  Calendar,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import PsychologyDashboardModal from '@/components/stocks/PsychologyDashboardModal';

interface AIReview {
  emotionalBiases: string[];
  thesisStrength: number;
  keyRisks: string[];
  improvement: string;
  psychologicalScore?: number;
}

interface JournalEntry {
  _id: string;
  userId: string;
  ticker?: string;
  entryText: string;
  emotionalSentiment?: string;
  chartImages?: string[];
  isWin?: boolean;
  aiReview?: AIReview;
  createdAt: string;
}

export default function JournalClient({ initialEntries, userId }: { initialEntries: JournalEntry[], userId: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(initialEntries[0] || null);
  const [isCreatingNew, setIsCreatingNew] = useState(!initialEntries.length);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const [ticker, setTicker] = useState('');
  const [entryText, setEntryText] = useState('');
  const [isWin, setIsWin] = useState<boolean | undefined>(undefined);
  const [chartImage, setChartImage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryText.trim()) {
      toast.error("Please write a trade journal entry.");
      return;
    }

    setIsSubmitting(true);
    let loadingToastId;
    
    try {
      loadingToastId = toast.loading("Gemini is reviewing your trade...");
      const newEntry = await createJournalEntry(userId, entryText, ticker, isWin, chartImage);
      setEntries([newEntry, ...entries]);
      setSelectedEntry(newEntry);
      setIsCreatingNew(false);
      setTicker('');
      setEntryText('');
      setIsWin(undefined);
      setChartImage('');
      toast.dismiss(loadingToastId);
      toast.success("Entry saved and reviewed!");
    } catch (error) {
      if (loadingToastId) toast.dismiss(loadingToastId);
      toast.error("Failed to save entry. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (!selectedEntry || !selectedEntry._id) return;
    setIsRetrying(true);
    let loadingToastId;
    try {
      loadingToastId = toast.loading("Retrying Gemini AI analysis...");
      const updatedEntry = await retryJournalAnalysis(selectedEntry._id);
      
      const newEntries = entries.map(e => e._id === updatedEntry._id ? updatedEntry : e);
      setEntries(newEntries);
      setSelectedEntry(updatedEntry);
      
      toast.dismiss(loadingToastId);
      if (updatedEntry.aiReview) {
        toast.success("AI Analysis successful!");
      } else {
        toast.error("Still hitting API rate limits. Please try again later.");
      }
    } catch (error) {
      if (loadingToastId) toast.dismiss(loadingToastId);
      toast.error("Failed to re-analyze entry.");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-140px)]">
      
      {/* LEFT SIDEBAR: Timeline */}
      <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-4">
        <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <BookOpen className="w-5 h-5 text-emerald-500" />
            <span>Journal Timeline</span>
          </div>
          <button 
            onClick={() => {
              setIsCreatingNew(true);
              setSelectedEntry(null);
            }}
            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-md transition-colors border border-emerald-500/20"
            title="New Entry"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
          {entries.length === 0 && !isCreatingNew ? (
            <div className="text-center p-6 text-muted-foreground bg-card rounded-xl border border-border">
              No entries yet. Start journaling your trades!
            </div>
          ) : (
            entries.map((entry) => (
              <motion.button
                key={entry._id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedEntry(entry);
                  setIsCreatingNew(false);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedEntry?._id === entry._id && !isCreatingNew
                    ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/50' 
                    : 'bg-card border-border hover:border-border hover:bg-secondary/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-bold text-lg ${
                    selectedEntry?._id === entry._id && !isCreatingNew ? 'text-emerald-400' : 'text-foreground'
                  }`}>
                    {entry.ticker || 'General'}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
                {entry.emotionalSentiment && (
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-secondary border border-border inline-block rounded text-foreground">
                    {entry.emotionalSentiment}
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.entryText}
                </p>
                {entry.aiReview && typeof entry.aiReview.thesisStrength === 'number' && (
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20">
                      Score: {entry.aiReview.thesisStrength}/10
                    </span>
                    {entry.aiReview.emotionalBiases?.length > 0 && (
                      <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded border border-orange-500/20">
                        {entry.aiReview.emotionalBiases.length} Biases
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            ))
          )}
        </div>

        <div className="mt-4 shrink-0">
          <PsychologyDashboardModal userId={userId} />
        </div>
      </div>

      {/* RIGHT MAIN VIEW */}
      <div className="w-full lg:w-2/3 xl:w-3/4">
        <AnimatePresence mode="wait">
          {isCreatingNew ? (
            <motion.div
              key="create-new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6 lg:p-8 h-full shadow-xl shadow-black/40"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  <PenTool className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Log New Trade</h2>
                  <p className="text-muted-foreground text-sm">Gemini AI will review your logic and emotions.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ticker Symbol (Optional)
                  </label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="e.g. NVDA"
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Trade Outcome
                    </label>
                    <div className="flex bg-secondary border border-border rounded-lg overflow-hidden h-12">
                      <button type="button" onClick={() => setIsWin(true)} className={`flex-1 text-sm font-medium transition-all ${isWin === true ? 'bg-emerald-500/20 text-emerald-500' : 'text-muted-foreground hover:bg-secondary/80'}`}>Win</button>
                      <button type="button" onClick={() => setIsWin(false)} className={`flex-1 text-sm font-medium transition-all border-l border-r border-border ${isWin === false ? 'bg-red-500/20 text-red-500' : 'text-muted-foreground hover:bg-secondary/80'}`}>Loss</button>
                      <button type="button" onClick={() => setIsWin(undefined)} className={`flex-1 text-sm font-medium transition-all ${isWin === undefined ? 'bg-blue-500/20 text-blue-500' : 'text-muted-foreground hover:bg-secondary/80'}`}>Open</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Chart Screenshot URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={chartImage}
                      onChange={(e) => setChartImage(e.target.value)}
                      placeholder="https://imgur.com/..."
                      className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all h-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Trade Journal Entry
                  </label>
                  <textarea
                    value={entryText}
                    onChange={(e) => setEntryText(e.target.value)}
                    placeholder="Describe your trade thesis, what you're feeling, your risk management plan... Be completely honest."
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all min-h-[250px] resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !entryText.trim()}
                    className="flex justify-center flex-1 sm:flex-none items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-semibold px-8 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <BrainCircuit className="w-5 h-5" />
                        </motion.div>
                        AI Reviewing...
                      </span>
                    ) : (
                      <>
                        Simulate & Review <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : selectedEntry ? (
            <motion.div
              key={`view-${selectedEntry._id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Entry Header/Content */}
              <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-xl shadow-black/40">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2 flex items-center gap-3">
                      {selectedEntry.ticker || 'General Market Trade'}
                      {selectedEntry.isWin === true && <span className="text-sm px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">Win</span>}
                      {selectedEntry.isWin === false && <span className="text-sm px-3 py-1 bg-red-500/10 text-red-500 rounded-full border border-red-500/20">Loss</span>}
                    </h2>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedEntry.createdAt), 'EEEE, MMMM d, yyyy h:mm a')}
                      {selectedEntry.emotionalSentiment && (
                        <>
                          <span className="opacity-50">•</span>
                          <span className="text-foreground font-medium flex items-center gap-1.5 bg-secondary border border-border px-2 py-0.5 rounded text-xs uppercase tracking-wider">
                            Mood: {selectedEntry.emotionalSentiment}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-secondary p-5 rounded-xl border border-border">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedEntry.entryText}
                  </p>
                  {selectedEntry.chartImages && selectedEntry.chartImages.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Attached Chart
                      </p>
                      <img src={selectedEntry.chartImages[0]} alt="Chart snippet" className="rounded-lg border border-border max-h-[500px] object-contain bg-background w-full shadow-md" />
                    </div>
                  )}
                </div>
              </div>

              {/* AI Review Sections */}
              {(!selectedEntry.aiReview || typeof selectedEntry.aiReview.thesisStrength !== 'number' || selectedEntry.aiReview.emotionalBiases?.[0] === "API Quota Exceeded") ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-red-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-lg"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertTriangle className="w-32 h-32 text-red-500" />
                  </div>
                  <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/20 relative z-10">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 relative z-10">AI Analysis Unavailable</h3>
                  <p className="text-muted-foreground max-w-md mb-8 relative z-10 text-sm leading-relaxed">
                    Gemini API rate limit reached (Free Tier). Your trade journal was safely saved to the database, so your data is secure. You can manually re-trigger the AI Coach analysis below when you are ready.
                  </p>
                  <button 
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="relative z-10 flex items-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-black px-6 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRetrying ? (
                      <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <RefreshCcw className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <RefreshCcw className="w-5 h-5" />
                    )}
                    {isRetrying ? "Retrying..." : "Retry AI Analysis"}
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Thesis Score Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-card border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Thesis Strength</h3>
                    </div>
                    <div className="relative z-10 flex items-end gap-2 text-emerald-500">
                      <span className="text-5xl font-bold tracking-tighter">
                        {selectedEntry.aiReview.thesisStrength}
                      </span>
                      <span className="text-xl mb-1 text-emerald-500/50">/10</span>
                    </div>
                  </motion.div>

                  {/* Discipline Score Card */}
                  {typeof selectedEntry.aiReview.psychologicalScore === 'number' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="bg-card border border-violet-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-violet-500/40 transition-colors"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BrainCircuit className="w-24 h-24 text-violet-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="bg-violet-500/10 p-2 rounded-lg text-violet-500">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Discipline Score</h3>
                    </div>
                    <div className="relative z-10 flex items-end gap-2 text-violet-500">
                      <span className="text-5xl font-bold tracking-tighter">
                        {selectedEntry.aiReview.psychologicalScore}
                      </span>
                      <span className="text-xl mb-1 text-violet-500/50">/10</span>
                    </div>
                  </motion.div>
                  )}

                  {/* Suggestion Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-card border border-blue-500/20 rounded-2xl p-6 group hover:border-blue-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Actionable Advice</h3>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">
                      {selectedEntry.aiReview.improvement}
                    </p>
                  </motion.div>

                  {/* Emotional Biases */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-card border border-orange-500/20 rounded-2xl p-6 group hover:border-orange-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Emotional Biases</h3>
                    </div>
                    {selectedEntry.aiReview.emotionalBiases?.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedEntry.aiReview.emotionalBiases.map((bias, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-orange-500 mt-1">•</span>
                            {bias}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No significant biases detected.</p>
                    )}
                  </motion.div>

                  {/* Key Risks */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-card border border-red-500/20 rounded-2xl p-6 group hover:border-red-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-red-500/10 p-2 rounded-lg text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Ignored Risks</h3>
                    </div>
                    {selectedEntry.aiReview.keyRisks?.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedEntry.aiReview.keyRisks.map((risk, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="text-red-500 mt-1">•</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No specific risks highlighted.</p>
                    )}
                  </motion.div>

                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground bg-card rounded-2xl border border-border">
              Select an entry or create a new one to view details.
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
