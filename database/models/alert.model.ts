import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface AlertItem extends Document {
  userId: string;
  ticker: string;
  targetPrice: number;
  condition: 'above' | 'below';
  triggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  // Smart Alert fields
  alertType: 'price' | 'volume_spike' | 'sentiment_shift';
  volumeThreshold?: number; // e.g., 2.0 means 2x average volume
  sentimentDirection?: 'bullish' | 'bearish';
  smartAlertMessage?: string; // AI-generated reason for the alert
}

const AlertSchema = new Schema<AlertItem>(
  {
    userId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, uppercase: true, trim: true },
    targetPrice: { type: Number, required: false, default: 0 },
    condition: { type: String, required: false, enum: ['above', 'below'], default: 'above' },
    triggered: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    triggeredAt: { type: Date },
    // Smart Alert fields
    alertType: { type: String, enum: ['price', 'volume_spike', 'sentiment_shift'], default: 'price' },
    volumeThreshold: { type: Number },
    sentimentDirection: { type: String, enum: ['bullish', 'bearish'] },
    smartAlertMessage: { type: String },
  },
  { timestamps: false }
);

// We might have multiple active alerts per user and ticker, but we can index for faster queries
AlertSchema.index({ userId: 1, ticker: 1 });
AlertSchema.index({ triggered: 1 }); // Important for finding active alerts efficiently
AlertSchema.index({ alertType: 1 }); // For filtering by alert type

export const Alert: Model<AlertItem> =
  (models?.Alert as Model<AlertItem>) || model<AlertItem>('Alert', AlertSchema);
