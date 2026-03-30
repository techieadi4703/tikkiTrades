'use server';

import { GoogleGenAI } from '@google/genai';
import { connectToDatabase } from '@/database/mongoose';
import { NewsCache, NewsArticle, SentinelScore } from '@/database/models/newsCache.model';
import { getDateRange, formatArticle } from '@/lib/utils';
import { fetchJSON, getBasicFinancials, getQuote } from '@/lib/actions/finnhub.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export async function getCompanyNewsWithSentiment(symbol: string): Promise<{ articles: NewsArticle[], score?: SentinelScore }> {
  try {
    await connectToDatabase();
    const upperSymbol = symbol.toUpperCase();

    const cached = await NewsCache.findOne({ symbol: upperSymbol });
    const now = new Date();
    
    if (cached && cached.sentinelScore && now.getTime() - cached.updatedAt.getTime() < 30 * 60 * 1000) {
      // Return cached articles if less than 30 minutes old and if the AI Sentinel Score exists
      return {
        articles: JSON.parse(JSON.stringify(cached.articles)),
        score: JSON.parse(JSON.stringify(cached.sentinelScore)),
      };
    }

    const range = getDateRange(7);
    const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    let articles: any[] = [];
    if (!upperSymbol.includes('.')) {
      try {
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(upperSymbol)}&from=${range.from}&to=${range.to}&token=${token}`;
        articles = await fetchJSON<any[]>(url, 0); 
      } catch (err) {
        console.warn(`Finnhub news fetch failed for ${upperSymbol}`);
      }
    } else {
      // Use Yahoo Finance specifically for .NS and other international stocks
      try {
        const yahooFinance = (await import('yahoo-finance2')).default;
        const query: any = await yahooFinance.search(upperSymbol, { newsCount: 6 });
        if (query && query.news) {
          articles = query.news.map((item: any) => ({
            category: 'company',
            datetime: item.providerPublishTime,
            headline: item.title,
            id: item.uuid || Math.random().toString(),
            image: item.thumbnail?.resolutions?.[0]?.url || '',
            related: upperSymbol,
            source: item.publisher,
            summary: item.type === 'VIDEO' ? 'Video Report' : item.title,
            url: item.link
          }));
        }
      } catch (e) {
        console.warn(`Yahoo Finance news fetch failed for ${upperSymbol}:`, e);
      }
    }
    
    const validArticles = (articles || []).filter(a => a.headline && a.summary && a.url && a.datetime);
    
    // Limit to top 6 articles to preserve Gemini API limits and layout density
    const topArticles = validArticles.slice(0, 6).map((a, idx) => formatArticle(a, true, upperSymbol, idx)) as any[];
    
    let ai: GoogleGenAI | null = null;
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    if (ai && topArticles.length > 0) {
      const prompt = `Analyze the sentiment of the following financial news articles.
For each article, reply with exactly one word: "Positive", "Negative", or "Neutral".
Return the results as a valid JSON array of strings in the exact same order as the articles provided.

Articles:
${topArticles.map((a, i) => `[${i}] Headline: "${a.headline}". Summary: "${a.summary}"`).join('\n\n')}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        
        const responseText = response.text || "[]";
        let sentiments: string[] = [];
        try {
          sentiments = JSON.parse(responseText);
        } catch (parseErr) {
          console.error("Failed to parse Gemini JSON output:", responseText);
        }

        for (let i = 0; i < topArticles.length; i++) {
          let sentiment = sentiments[i] || 'Neutral';
          if (sentiment.toLowerCase().includes('positive')) topArticles[i].sentiment = 'Positive';
          else if (sentiment.toLowerCase().includes('negative')) topArticles[i].sentiment = 'Negative';
          else topArticles[i].sentiment = 'Neutral';
        }
      } catch (err) {
        console.error("Gemini batch sentiment analysis failed:", err);
        for (const article of topArticles) article.sentiment = 'Neutral';
      }
    } else {
      for (const article of topArticles) article.sentiment = 'Neutral';
    }
    
    // Generate Sentinel Score
    let sentinelScore: SentinelScore | undefined = undefined;
    
    try {
      if (ai) {
        const [fundamentals, quote] = await Promise.all([
          getBasicFinancials(upperSymbol),
          getQuote(upperSymbol)
        ]);

        const positiveCount = topArticles.filter(a => a.sentiment === 'Positive').length;
        const negativeCount = topArticles.filter(a => a.sentiment === 'Negative').length;
        const neutralCount = topArticles.filter(a => a.sentiment === 'Neutral').length;

        const currentPrice = quote?.c || 0;
        const volume = quote?.v || 0;
        const peRatio = fundamentals?.metric?.peBasicExclExtraTTM || fundamentals?.metric?.peNormalizedAnnual || 'N/A';
        const revGrowth = fundamentals?.metric?.revenueGrowthTTMYoy || fundamentals?.metric?.revenueGrowth3Y || 'N/A';
        const high52 = fundamentals?.metric?.['52WeekHigh'] || quote?.h || 'N/A';
        const low52 = fundamentals?.metric?.['52WeekLow'] || quote?.l || 'N/A';
        const avgVolume = fundamentals?.metric?.['10DayAverageTradingVolume'] || 'N/A';

        const scorePrompt = `You are a professional AI stock analyst. Analyze ${upperSymbol}.
Data:
- Current Price: $${currentPrice}
- 52W High/Low: $${high52} / $${low52}
- P/E Ratio: ${peRatio}
- Revenue Growth: ${revGrowth}%
- News Sentiment: ${positiveCount} Positive, ${negativeCount} Negative, ${neutralCount} Neutral.
- Current Volume: ${volume} (Avg: ${avgVolume})

Generate a composite "Sentinel Score" rating.
You MUST reply with exactly and ONLY a JSON object evaluating this data. Any text outside JSON will break the parsing. Format:
{
  "score": number (0 to 100, 100 being best),
  "verdict": "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell",
  "rationale": "A 2-3 sentence explanation of your rating",
  "bulls": ["Reason 1", "Reason 2"],
  "bears": ["Concern 1", "Concern 2"]
}`;

        const scoreResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: scorePrompt,
          config: { responseMimeType: 'application/json' }
        });
        
        const rawText = scoreResponse.text || "{}";
        const cleanJsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        sentinelScore = JSON.parse(cleanJsonText);
      }
    } catch (err) {
      console.warn("Sentinel Score generation failed, applying developer fallback due to API Quotas:", err);
      // Hard fallback to preserve UI rendering when hitting 429 Rate Limits
      sentinelScore = {
        score: 65,
        verdict: "Buy",
        rationale: "AI analysis is temporarily paused due to API rate limits. This is a generic fallback evaluation.",
        bulls: ["Strong historical fundamentals", "Temporary API Quota Exhausted"],
        bears: ["Real-time analysis unavailable"]
      };
    }
    
    await NewsCache.findOneAndUpdate(
      { symbol: upperSymbol },
      { symbol: upperSymbol, articles: topArticles, sentinelScore, updatedAt: now },
      { upsert: true, new: true }
    );
    
    return {
      articles: JSON.parse(JSON.stringify(topArticles)),
      score: sentinelScore ? JSON.parse(JSON.stringify(sentinelScore)) : undefined
    };
  } catch (error) {
    console.error('getCompanyNewsWithSentiment error:', error);
    return { articles: [], score: undefined };
  }
}
