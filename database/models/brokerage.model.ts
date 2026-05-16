import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PaperAccountItem extends Document {
  userId: string;
  buyingPower: number;
  initialBalance: number;
  updatedAt: Date;
}

const PaperAccountSchema = new Schema<PaperAccountItem>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    buyingPower: { type: Number, required: true, default: 100000 },
    initialBalance: { type: Number, required: true, default: 100000 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const PaperAccount: Model<PaperAccountItem> =
  (models?.PaperAccount as Model<PaperAccountItem>) || model<PaperAccountItem>('PaperAccount', PaperAccountSchema);


export interface PaperOrderItem extends Document {
  userId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
  shares: number;
  executionPrice: number;
  totalAmount: number;
  status: 'EXECUTED' | 'PENDING' | 'CANCELLED';
  createdAt: Date;
}

const PaperOrderSchema = new Schema<PaperOrderItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    action: { type: String, required: true, enum: ['BUY', 'SELL'] },
    orderType: { type: String, required: true, enum: ['MARKET', 'LIMIT'] },
    limitPrice: { type: Number },
    shares: { type: Number, required: true, min: 0.0001 },
    executionPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, enum: ['EXECUTED', 'PENDING', 'CANCELLED'], default: 'EXECUTED' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PaperOrder: Model<PaperOrderItem> =
  (models?.PaperOrder as Model<PaperOrderItem>) || model<PaperOrderItem>('PaperOrder', PaperOrderSchema);
