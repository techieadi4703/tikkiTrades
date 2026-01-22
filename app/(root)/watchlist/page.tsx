import { getWatchlist } from "@/lib/actions/watchlist.actions";
import WatchlistButton from "@/components/WatchlistButton";
import Link from "next/link";
import { getQuote } from "@/lib/actions/finnhub.actions";
function formatVolume(v?: number) {
  if (!v) return "-----";
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + "B";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(2) + "K";
  return v.toString();
}

export default async function WatchlistPage() {
  const watchlist = await getWatchlist();
  const quotes = await Promise.all(watchlist.map((w) => getQuote(w.symbol)));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">My Watchlist</h1>

      {watchlist.length === 0 ? (
        <p className="text-gray-400">No stocks in watchlist</p>
      ) : (
        <div className="rounded-xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div
            className="grid bg-gray-900 px-4 py-3 text-sm text-gray-300"
            style={{
              gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
            }}
          >
            <div>★</div>
            <div>Company</div>
            <div>Symbol</div>
            <div>Price</div>
            <div>Change</div>
            <div>Change %</div>
            <div>Volume</div>
            <div className="text-center">Action</div>
          </div>

          {/* Rows */}
          {watchlist.map((item, i) => {
            const q = quotes[i];
            const change = q?.d ?? 0;
            const changePct = q?.dp ?? 0;
            const isUp = change >= 0;

            return (
              <div
                key={item._id}
                className="grid items-center px-4 py-4 border-t border-gray-500"
                style={{
                  gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 1fr 1fr 1.5fr",
                }}
              >
                <div>⭐</div>

                <div>
                  <Link
                    href={`/stocks/${item.symbol}`}
                    className="font-bold hover:text-yellow-400"
                  >
                    {item.company}
                  </Link>
                </div>

                <div className="text-gray-400">{item.symbol}</div>

                <div className="font-medium">${q?.c?.toFixed(2)}</div>

                <div className={isUp ? "text-green-400" : "text-red-400"}>
                  {isUp ? "+" : ""}
                  {change.toFixed(2)}
                </div>

                <div className={isUp ? "text-green-400" : "text-red-400"}>
                  {isUp ? "+" : ""}
                  {changePct.toFixed(2)}%
                </div>

                <div className="text-gray-400 pl-2">
                  {formatVolume(quotes[i]?.v)}
                </div>

                <div className="flex justify-end cursor-pointer">
                  <WatchlistButton
                    symbol={item.symbol}
                    company={item.company}
                    isInWatchlist={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
