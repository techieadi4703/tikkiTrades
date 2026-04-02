import { Activity } from 'lucide-react';

export default function NewsSkeleton() {
  return (
    <div className="w-full flex flex-col gap-8 h-[600px] xl:h-[842px]">
      {/* Score Skeleton */}
      <div className="bg-white/2 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col items-center animate-pulse shrink-0">
        <div className="flex items-center gap-2 mb-6 w-full opacity-40">
          <Activity className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">AI Sentinel Score</h3>
        </div>
        
        <div className="relative flex items-center justify-center w-40 h-40 mb-4">
          <svg className="w-full h-full transform -rotate-90 opacity-20" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r="60"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/10"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="h-10 w-16 bg-white/10 rounded mb-2"></div>
            <div className="h-3 w-10 bg-white/5 rounded"></div>
          </div>
        </div>
        
        <div className="h-6 w-32 bg-white/10 rounded mb-6"></div>
        
        <div className="w-full p-4 bg-white/5 rounded-xl flex items-center justify-center gap-3">
          <Activity className="w-4 h-4 text-emerald-500 animate-spin" />
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em]">Calculating score...</span>
        </div>
      </div>

      {/* Existing News Skeleton */}
      <div className="w-full flex-1 flex flex-col min-h-[150px] animate-pulse overflow-hidden">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
          <h2 className="text-xl xl:text-2xl font-bold text-white tracking-tight">
            Latest News & Sentiment
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto pr-3 scrollbar-hide">
          <div className="flex flex-col gap-4 pb-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/2 border border-white/5 rounded-2xl p-5 shrink-0">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-20 bg-white/10 rounded"></div>
                      <div className="h-5 w-16 bg-white/10 rounded-full"></div>
                    </div>
                    <div className="h-6 bg-white/10 rounded w-3/4"></div>
                    <div className="h-6 bg-white/10 rounded w-1/2"></div>
                  </div>
                  <div className="shrink-0 w-24 h-24 rounded-lg bg-white/5 hidden sm:block"></div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-white/5 rounded w-full"></div>
                  <div className="h-4 bg-white/5 rounded w-5/6"></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-white/10 rounded"></div>
                  <div className="h-4 w-20 bg-white/10 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
