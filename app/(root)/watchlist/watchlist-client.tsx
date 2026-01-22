"use client";
import { useState } from "react";
import Link from "next/link";
import WatchlistButton from "@/components/WatchlistButton";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

type SortKey = "company" | "price" | "change" | "changePercent" | "volume";

type WatchlistItem = {
  _id: string;
  company: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
};

export default function WatchlistClient({
  initialData,
}: {
  initialData: WatchlistItem[];
}) {
  const [data, setData] = useState<WatchlistItem[]>(initialData);
  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    const nextOrder =
      key === sortKey ? (order === "asc" ? "desc" : "asc") : "asc";

    const sorted = [...data].sort((a, b) => {
      const A = a[key];
      const B = b[key];

      if (typeof A === "string" && typeof B === "string") {
        return nextOrder === "asc" ? A.localeCompare(B) : B.localeCompare(A);
      }

      return nextOrder === "asc"
        ? Number(A) - Number(B)
        : Number(B) - Number(A);
    });

    setSortKey(key);
    setOrder(nextOrder);
    setData(sorted);
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => {
    const isActive = sortKey === k;

    return (
      <button
        onClick={() => handleSort(k)}
        className="flex items-center gap-1 hover:text-yellow-400 cursor-pointer"
      >
        {label}
        {isActive ? (
          order === "asc" ? (
            <ArrowUp size={14} />
          ) : (
            <ArrowDown size={14} />
          )
        ) : (
          <ArrowUpDown size={14} className="opacity-40" />
        )}
      </button>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">My Watchlist</h1>

      <div className="rounded-xl border border-gray-700 overflow-hidden">
        <div
          className="grid bg-gray-900 px-4 py-3 text-sm text-gray-300"
          style={{
            gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
          }}
        >
          <div>★</div>
          <SortHeader label="Company" k="company" />
          <div>Symbol</div>
          <SortHeader label="Price" k="price" />
          <SortHeader label="Change" k="change" />
          <SortHeader label="Change %" k="changePercent" />
          <SortHeader label="Volume" k="volume" />
          <div className="text-center">Action</div>
        </div>

        {data.map((item) => {
          const isUp = item.change >= 0;
          return (
            <div
              key={item._id}
              className="grid items-center px-4 py-4 border-t border-gray-600"
              style={{
                gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
              }}
            >
              <div>⭐</div>
              <Link
                href={`/stocks/${item.symbol}`}
                className="font-bold hover:text-yellow-400"
              >
                {item.company}
              </Link>
              <div>{item.symbol}</div>
              <div>${item.price.toFixed(2)}</div>
              <div className={isUp ? "text-green-400" : "text-red-400"}>
                {item.change.toFixed(2)}
              </div>
              <div className={isUp ? "text-green-400" : "text-red-400"}>
                {item.changePercent.toFixed(2)}%
              </div>
              <div>{item.volume}</div>
              <div className="flex justify-end">
                <WatchlistButton
                  symbol={item.symbol}
                  company={item.company}
                  isInWatchlist
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
