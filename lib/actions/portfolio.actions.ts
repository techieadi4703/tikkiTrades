'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Portfolio } from '@/database/models/portfolio.model';
import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
import { GoogleGenAI } from '@google/genai';
import { revalidatePath } from 'next/cache';
import { getQuote, getCompanyProfile } from './finnhub.actions';

export type PortfolioHolding = {
  _id: string;
  symbol: string;
  name: string;
  shares: number;
  averagePrice: number;
  datePurchased: Date;
  currentPrice: number;
  previousClose: number;
  totalValue: number;
  totalCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
};

export async function getPortfolioHoldings(): Promise<PortfolioHolding[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB not initialized');

    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string }>({
      email: session.user.email,
    });

    if (!user) return [];
    const userId = user.id || String(user._id || '');
    if (!userId) return [];

    const items = await Portfolio.find({ userId }).lean();
    if (!items || items.length === 0) return [];

    const holdingsWithData = await Promise.all(
      items.map(async (item: any) => {
        try {
          const [quoteData, profileData] = await Promise.all([
            getQuote(item.symbol),
            getCompanyProfile(item.symbol),
          ]);

          const currentPrice = quoteData?.c || item.averagePrice;
          const previousClose = quoteData?.pc || currentPrice;
          const name = profileData?.name || item.symbol;

          const totalValue = currentPrice * item.shares;
          const totalCost = item.averagePrice * item.shares;
          const unrealizedPnL = totalValue - totalCost;
          const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
          
          const dailyChange = (currentPrice - previousClose) * item.shares;
          const dailyChangePercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

          return {
            _id: item._id.toString(),
            symbol: item.symbol,
            name,
            shares: item.shares,
            averagePrice: item.averagePrice,
            datePurchased: item.datePurchased,
            currentPrice,
            previousClose,
            totalValue,
            totalCost,
            unrealizedPnL,
            unrealizedPnLPercent,
            dailyChange,
            dailyChangePercent,
          };
        } catch (err) {
          console.error(`Error fetching data for ${item.symbol}:`, err);
          // Fallback if Finnhub fails
          const totalCost = item.averagePrice * item.shares;
          return {
            _id: item._id.toString(),
            symbol: item.symbol,
            name: item.symbol,
            shares: item.shares,
            averagePrice: item.averagePrice,
            datePurchased: item.datePurchased,
            currentPrice: item.averagePrice,
            previousClose: item.averagePrice,
            totalValue: totalCost,
            totalCost,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            dailyChange: 0,
            dailyChangePercent: 0,
          };
        }
      })
    );

    return holdingsWithData;
  } catch (err) {
    console.error('getPortfolioHoldings error:', err);
    return [];
  }
}

export async function addPortfolioHolding(data: { symbol: string; shares: number; averagePrice: number; datePurchased: Date }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) throw new Error('Not authenticated');

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    const userId = user.id || String(user._id);

    const newHolding = await Portfolio.create({
      userId,
      symbol: data.symbol.toUpperCase(),
      shares: Number(data.shares),
      averagePrice: Number(data.averagePrice),
      datePurchased: new Date(data.datePurchased),
    });

    revalidatePath('/portfolio');
    return { success: true, holdingId: newHolding._id.toString() };
  } catch (e: any) {
    console.error('addPortfolioHolding error:', e);
    return { success: false, error: e.message };
  }
}

export async function removePortfolioHolding(holdingId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) throw new Error('Not authenticated');

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');

    const userId = user.id || String(user._id);

    await Portfolio.deleteOne({ userId, _id: holdingId });
    revalidatePath('/portfolio');
    return { success: true };
  } catch (e: any) {
    console.error('removePortfolioHolding error:', e);
    return { success: false, error: e.message };
  }
}

export async function getPortfolioHealthAnalysis(holdings: PortfolioHolding[]) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, message: "No API key found." };
    }
    
    if (!holdings || holdings.length === 0) {
      return { success: false, message: "No holdings to analyze." };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Create a summarized view for the prompt
    const portfolioSummary = holdings.map(h => ({
      symbol: h.symbol,
      value: h.totalValue,
      unrealizedPnLPercent: h.unrealizedPnLPercent
    }));

    const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);

    const prompt = `You are an elite quantitative analyst and portfolio manager. Analyze the following user's stock portfolio.
    
Portfolio Data:
${JSON.stringify(portfolioSummary, null, 2)}
Total Value: $${totalPortfolioValue}

Return your analysis as a valid JSON object matching exactly this format:
{
  "alphaScore": number (1-100, where 100 is excellent health/diversification),
  "diversificationRisk": "A short sentence about their sector concentration risk",
  "estimatedBeta": "High", "Medium", or "Low" (estimate based on typical tech/index volatility),
  "actionableAdvice": "One specific suggestion on how to balance or improve the portfolio."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const responseText = response.text || "{}";
    const cleanJsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanJsonText);

    return { success: true, analysis };
  } catch (error) {
    console.error("Failed to generate portfolio health analysis:", error);
    return { success: false, message: "AI Analysis failed." };
  }
}
