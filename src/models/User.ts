import mongoose, { Schema, Model } from 'mongoose';
import { User as IUser } from '@/types';

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    password: { type: String },
    googleId: { type: String },
    tier: { 
      type: String, 
      enum: ['free', 'tier1', 'tier2', 'tier3'], 
      default: 'free' 
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'cancelled'], 
      default: 'pending' 
    },
    vmIds: [{ type: String }],
    instanceSlots: { type: Number, default: 1 },
    solanaWallet: { type: String },
    tierSource: { type: String, enum: ['payment', 'claw_holding'], default: 'payment' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    isAdmin: { type: Boolean, default: false },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String },
  },
  { timestamps: true }
);

const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
