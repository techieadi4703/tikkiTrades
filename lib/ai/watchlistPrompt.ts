export function buildWatchlistPrompt(
  watchlist: {
    company: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
  }[],
  userMessage: string
) {
  return `
You are a stock market assistant inside a trading app.

User watchlist:
${watchlist
  .map(
    (s) =>
      `• ${s.company} (${s.symbol}) - Price: $${s.price}, Change: ${s.change} (${s.changePercent}%), Volume: ${s.volume}`
  )
  .join("\n")}

User question:
"${userMessage}"

Rules:
- Answer using the watchlist context
- Be concise and actionable
- If user asks comparison, compare only watchlist stocks
- If data is insufficient, say so clearly
`;
}
