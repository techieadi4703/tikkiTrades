'use server';

import { GoogleGenAI } from '@google/genai';
import { connectToDatabase } from '@/database/mongoose';
import { NewsCache, NewsArticle } from '@/database/models/newsCache.model';
import { getDateRange, formatArticle } from '@/lib/utils';
import { fetchJSON } from '@/lib/actions/finnhub.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export async function getCompanyNewsWithSentiment(symbol: string): Promise<NewsArticle[]> {
  try {
    await connectToDatabase();
    const upperSymbol = symbol.toUpperCase();

    const cached = await NewsCache.findOne({ symbol: upperSymbol });
    const now = new Date();
    
    if (cached && now.getTime() - cached.updatedAt.getTime() < 30 * 60 * 1000) {
      // Return cached articles if less than 30 minutes old
      return JSON.parse(JSON.stringify(cached.articles));
    }

    const range = getDateRange(7);
    const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(upperSymbol)}&from=${range.from}&to=${range.to}&token=${token}`;
    
    const articles = await fetchJSON<any[]>(url, 0); 
    
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
    
    await NewsCache.findOneAndUpdate(
      { symbol: upperSymbol },
      { symbol: upperSymbol, articles: topArticles, updatedAt: now },
      { upsert: true, new: true }
    );
    
    return JSON.parse(JSON.stringify(topArticles));
  } catch (error) {
    console.error('getCompanyNewsWithSentiment error:', error);
    return [];
  }
}
