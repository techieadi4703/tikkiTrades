import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface AlertItem extends Document {
  userId: string;
  ticker: string;
  targetPrice: number;
  condition: 'above' | 'below';
  triggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

const AlertSchema = new Schema<AlertItem>(
  {
    userId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, uppercase: true, trim: true },
    targetPrice: { type: Number, required: true },
    condition: { type: String, required: true, enum: ['above', 'below'] },
    triggered: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    triggeredAt: { type: Date },
  },
  { timestamps: false }
);

// We might have multiple active alerts per user and ticker, but we can index for faster queries
AlertSchema.index({ userId: 1, ticker: 1 });
AlertSchema.index({ triggered: 1 }); // Important for finding active alerts efficiently

export const Alert: Model<AlertItem> =
  (models?.Alert as Model<AlertItem>) || model<AlertItem>('Alert', AlertSchema);
