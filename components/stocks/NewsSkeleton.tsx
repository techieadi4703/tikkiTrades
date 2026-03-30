import React from 'react';

export default function NewsSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 bg-white/10 rounded-full"></div>
        <div className="h-8 w-48 bg-white/5 rounded-md"></div>
      </div>
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/2 border border-white/5 rounded-2xl p-5">
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
  );
}
