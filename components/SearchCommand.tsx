"use client"

import { useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {Loader2,  TrendingUp} from "lucide-react";
import Link from "next/link";
import {searchStocks, aiDiscoverStocks} from "@/lib/actions/finnhub.actions";
import {useDebounce} from "@/hooks/useDebounce";

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAiSearching, setIsAiSearching] = useState(false)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleSearch = async () => {
    if(!isSearchMode) return setStocks(initialStocks);

    // If it's a very long query, they might want AI, but standard search is default
    setLoading(true)
    try {
        const results = await searchStocks(searchTerm.trim());
        setStocks(results);
    } catch {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }

  const handleAiDiscovery = async () => {
    if(!searchTerm.trim()) return;
    setIsAiSearching(true);
    setStocks([]); // Clear existing
    try {
      const results = await aiDiscoverStocks(searchTerm.trim());
      setStocks(results);
    } catch {
      setStocks([]);
    } finally {
      setIsAiSearching(false);
    }
  }

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  }

  return (
    <>
      {renderAs === 'text' ? (
          <span onClick={() => setOpen(true)} className="search-text">
            {label}
          </span>
      ): (
          <Button onClick={() => setOpen(true)} className="search-btn">
            {label}
          </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
        <div className="search-field">
          <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks or ask AI for ideas..." className="search-input" />
          {(loading || isAiSearching) && <Loader2 className="search-loader" />}
        </div>
        <CommandList className="search-list">
          {(loading || isAiSearching) ? (
              <CommandEmpty className="search-list-empty">{isAiSearching ? 'AI is discovering ideas...' : 'Loading stocks...'}</CommandEmpty>
          ) : displayStocks?.length === 0 ? (
              <div className="search-list-indicator">
                {isSearchMode ? 'No exact matches found' : 'No stocks available'}
              </div>
            ) : (
            <ul>
              <div className="search-count flex justify-between items-center">
                <span>
                  {isSearchMode ? 'Search results' : 'Popular stocks'}
                  {` `}({displayStocks?.length || 0})
                </span>
                
                {isSearchMode && searchTerm.split(' ').length >= 2 && !isAiSearching && (
                  <button 
                    onClick={handleAiDiscovery}
                    className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded transition-colors border border-emerald-500/20 font-bold"
                  >
                    ✨ Ask AI
                  </button>
                )}
              </div>
              {displayStocks?.map((stock, i) => (
                  <li key={stock.symbol} className="search-item">
                    <Link
                        href={`/stocks/${stock.symbol}`}
                        onClick={handleSelectStock}
                        className="search-item-link"
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div  className="flex-1">
                        <div className="search-item-name">
                          {stock.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stock.symbol} | {stock.exchange } | {stock.type}
                        </div>
                      </div>
                    {/*<Star />*/}
                    </Link>
                  </li>
              ))}
            </ul>
          )
          }
        </CommandList>
      </CommandDialog>
    </>
  )
}