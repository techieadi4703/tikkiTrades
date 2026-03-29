import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PortfolioItem extends Document {
  userId: string;
  symbol: string;
  shares: number;
  averagePrice: number;
  datePurchased: Date;
  addedAt: Date;
}

const PortfolioSchema = new Schema<PortfolioItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    shares: { type: Number, required: true, min: 0 },
    averagePrice: { type: Number, required: true, min: 0 },
    datePurchased: { type: Date, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

PortfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Portfolio: Model<PortfolioItem> =
  (models?.Portfolio as Model<PortfolioItem>) || model<PortfolioItem>('Portfolio', PortfolioSchema);
