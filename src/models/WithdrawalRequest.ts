import mongoose, { Schema, Model } from 'mongoose';
import { WithdrawalRequest as IWithdrawal } from '@/types';

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    payoutDetails: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String },
  },
  { timestamps: true }
);

WithdrawalSchema.index({ userId: 1 });

const WithdrawalModel: Model<IWithdrawal> =
  mongoose.models.WithdrawalRequest ||
  mongoose.model<IWithdrawal>('WithdrawalRequest', WithdrawalSchema);

export default WithdrawalModel;
