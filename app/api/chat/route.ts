import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getWatchlist } from "@/lib/actions/watchlist.actions";
import { getQuote } from "@/lib/actions/finnhub.actions";
import { buildWatchlistPrompt } from "@/lib/ai/watchlistPrompt";
import { callLLM } from "@/lib/ai/llm";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // STEP 1: fetch watchlist
    const watchlist = await getWatchlist({
      headers: await headers(),
    });

    if (watchlist.length === 0) {
      return NextResponse.json({
        reply:
          "Your watchlist is empty. Add some stocks and I'll analyze them for you 📈",
      });
    }

    // STEP 2: fetch live prices
    const quotes = await Promise.all(watchlist.map((w) => getQuote(w.symbol)));

    // STEP 3: normalize data
    const watchlistContext = watchlist.map((item, i) => {
      const q = quotes[i];
      return {
        company: item.company,
        symbol: item.symbol,
        price: q?.c ?? 0,
        change: q?.d ?? 0,
        changePercent: q?.dp ?? 0,
        volume: q?.v ?? 0,
      };
    });

    // STEP 4: build prompt
    const prompt = buildWatchlistPrompt(watchlistContext, message);

    // STEP 5: call LLM
    const aiResponse = await callLLM(prompt);

    return NextResponse.json({ reply: aiResponse });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
