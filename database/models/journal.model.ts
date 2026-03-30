import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface JournalEntryItem extends Document {
  userId: string;
  ticker?: string;
  entryText: string;
  aiReview?: {
    emotionalBiases: string[];
    thesisStrength: number;
    keyRisks: string[];
    improvement: string;
  };
  createdAt: Date;
}

const JournalEntrySchema = new Schema<JournalEntryItem>(
  {
    userId: { type: String, required: true, index: true },
    ticker: { type: String, uppercase: true, trim: true },
    entryText: { type: String, required: true },
    aiReview: {
      emotionalBiases: [{ type: String }],
      thesisStrength: { type: Number },
      keyRisks: [{ type: String }],
      improvement: { type: String }
    },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const JournalEntry: Model<JournalEntryItem> =
  (models?.JournalEntry as Model<JournalEntryItem>) || model<JournalEntryItem>('JournalEntry', JournalEntrySchema);
