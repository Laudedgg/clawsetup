import mongoose, { Schema, Model } from 'mongoose';
import { Referral as IReferral } from '@/types';

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: { type: String, required: true },
    referredUserId: { type: String, required: true },
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

ReferralSchema.index({ paymentId: 1 }, { unique: true });
ReferralSchema.index({ referrerId: 1 });

const ReferralModel: Model<IReferral> =
  mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);

export default ReferralModel;
