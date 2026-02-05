// =======================
// Types
// =======================

export type WatchlistItem = {
  _id: string;
  company: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
};

// =======================
// Stop Words
// =======================

const STOP_WORDS = new Set([
  "inc",
  "inc.",
  "ltd",
  "ltd.",
  "corp",
  "corp.",
  "co",
  "co.",
  "company",
  "group",
  "holdings",
  "plc",
  "platforms",
  "technologies",
  "incorporated",
  "class",
  "common",
  "shares",
  "stock",
  "limited",
  "com",
  "net",
  "org",
]);

// =======================
// Company Aliases
// =======================

const COMPANY_ALIASES: Record<string, string[]> = {
  alphabet: ["google", "googl"],
  meta: ["facebook", "fb"],
  microsoft: ["msft"],
  amazon: ["amzn"],
  tesla: ["tsla"],
  apple: ["aapl"],
  netflix: ["nflx"],
  nvidia: ["nvda"],
};

// =======================
// Helpers
// =======================

const normalizeCompanyWords = (company: string): string[] => {
  return company
    .toLowerCase()
    .replace(/\.(com|net|org)/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
};

// =======================
// Matching Engine
// =======================

const getBestMatch = (
  question: string,
  data: WatchlistItem[],
): WatchlistItem | null => {
  const normalized = question.toLowerCase();

  let bestScore = 0;
  let bestItem: WatchlistItem | null = null;

  for (const item of data) {
    let score = 0;

    // Symbol match (strongest)
    const symbolRegex = new RegExp(`\\b${item.symbol.toLowerCase()}\\b`);
    if (symbolRegex.test(normalized)) score += 100;

    const companyWords = normalizeCompanyWords(item.company);

    // Company keyword match (apple, microsoft)
    for (const word of companyWords) {
      if (normalized.includes(word)) {
        score += 25;
      }
    }

    // Alias match (google -> alphabet, fb -> meta)
    for (const word of companyWords) {
      const aliases = COMPANY_ALIASES[word];
      if (aliases && aliases.some(a => normalized.includes(a))) {
        score += 30;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  return bestScore >= 20 ? bestItem : null;
};


// =======================
// Public API
// =======================

export const getBotResponse = (
  question: string,
  data: WatchlistItem[],
): string => {
  if (!data.length) {
    return "Your watchlist is empty. Add some stocks first so I can help.";
  }

  const normalized = question.toLowerCase();

  const hasStockKeyword = data.some(item => {
    const companyWords = normalizeCompanyWords(item.company);

    if (normalized.includes(item.symbol.toLowerCase())) return true;
    if (companyWords.some(w => normalized.includes(w))) return true;

    return companyWords.some(word =>
      COMPANY_ALIASES[word]?.some(a => normalized.includes(a)),
    );
  });

  if (!hasStockKeyword) {
    return "Please mention a stock name or symbol (for example: Apple, AAPL, Amazon).";
  }

  const match = getBestMatch(question, data);

  if (!match) {
    return "That stock is not in your watchlist yet. You can add it to start tracking it.";
  }

  const parts: string[] = [];

  if (normalized.includes("price") || normalized.includes("quote")) {
    parts.push(`the latest price is $${match.price.toFixed(2)}`);
  }
  if (normalized.includes("change")) {
    parts.push(
      `the change is ${match.change.toFixed(2)} (${match.changePercent.toFixed(2)}%)`,
    );
  }
  if (normalized.includes("volume")) {
    parts.push(`the volume is ${match.volume.toLocaleString()}`);
  }

  if (!parts.length) {
    parts.push(
      `it's trading at $${match.price.toFixed(2)} with a ${match.change.toFixed(2)} (${match.changePercent.toFixed(2)}%) move today`,
    );
  }

  return `${match.company} (${match.symbol}): ${parts.join(", ")}.`;
};
