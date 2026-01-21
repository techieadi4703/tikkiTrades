import { Schema, model, models, InferSchemaType } from "mongoose";

const watchlistSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Prevent duplicate symbols per user
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export type WatchlistItem = InferSchemaType<typeof watchlistSchema>;

export const Watchlist =
  models?.Watchlist || model<WatchlistItem>("Watchlist", watchlistSchema);
