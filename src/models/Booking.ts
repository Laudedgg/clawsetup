import mongoose, { Schema, Model } from 'mongoose';
import { Booking as IBooking } from '@/types';

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: String, required: true, ref: 'User' },
    scheduledAt: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
      default: 'pending' 
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const BookingModel: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default BookingModel;
