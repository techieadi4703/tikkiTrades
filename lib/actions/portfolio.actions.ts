'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Portfolio } from '@/database/models/portfolio.model';
import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';
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
