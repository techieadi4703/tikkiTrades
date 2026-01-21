"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { User } from "@/database/models/user.model";

export const getWatchlistSymbolsByEmail = async (
  email: string,
): Promise<string[]> => {
  if (!email) return [];

  try {
    await connectToDatabase();

    const user = await User.findOne({ email }).lean();
    if (!user) return [];

    const items = await Watchlist.find({ userId: user._id.toString() })
      .select("symbol")
      .lean();

    return items.map((item) => item.symbol);
  } catch (error) {
    console.error("getWatchlistSymbolsByEmail error:", error);
    return [];
  }
};
