import mongoose, { Schema, Model } from 'mongoose';
import { Payment as IPayment } from '@/types';

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: String, required: true, ref: 'User' },
    amount: { type: Number, required: true },
    provider: {
      type: String,
      enum: ['stripe', 'nowpayments'],
      required: true
    },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'cancelled'], 
      default: 'pending' 
    },
    tier: { 
      type: String, 
      enum: ['free', 'tier1', 'tier2', 'tier3'], 
      required: true 
    },
    txHash: { type: String },
    stripeSessionId: { type: String },
    nowpaymentsId: { type: String },
  },
  { timestamps: true }
);

const PaymentModel: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default PaymentModel;
