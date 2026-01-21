'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '../better-auth/auth';
import { headers } from 'next/headers';

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

// Get full watchlist for logged in user
export async function getWatchlist() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) return [];

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("DB not initialized");

  const user = await db
    .collection("user")
    .findOne<{ _id?: unknown; id?: string }>({
      email: session.user.email,
    });

  if (!user) return [];

  const userId = user.id || String(user._id || "");
  if (!userId) return [];

  const items = await Watchlist.find({ userId }).lean();
  return items;
}


// Add stock
export async function addToWatchlist(symbol: string, company: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    console.log("No session in addToWatchlist");
    throw new Error("Not authenticated");
  }

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    const user = await db.collection("user").findOne({ email: session.user.email });
    if (!user) throw new Error("User not found");

    const userId = user.id || String(user._id);

    await Watchlist.create({
      userId,
      symbol,
      company,
    });

    console.log("Added to watchlist:", symbol);
    return { success: true };
  } catch (e: any) {
    console.error("addToWatchlist error:", e);
    return { success: false };
  }
}


// Remove stock
export async function removeFromWatchlist(symbol: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    console.log("No session in removeFromWatchlist");
    throw new Error("Not authenticated");
  }

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    const user = await db.collection("user").findOne({ email: session.user.email });
    if (!user) throw new Error("User not found");

    const userId = user.id || String(user._id);

    await Watchlist.deleteOne({ userId, symbol });
    console.log("Removed from watchlist:", symbol);

    return { success: true };
  } catch (e) {
    console.error("removeFromWatchlist error:", e);
    return { success: false };
  }
}


// Check if stock is in watchlist
export async function isInWatchlist(symbol: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) return false;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("DB not initialized");

  const user = await db
    .collection("user")
    .findOne<{ _id?: unknown; id?: string }>({
      email: session.user.email,
    });

  if (!user) return false;

  const userId = user.id || String(user._id || "");
  if (!userId) return false;

  const item = await Watchlist.findOne({ userId, symbol });
  return !!item;
}
