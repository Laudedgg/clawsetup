import mongoose, { Schema, Model } from 'mongoose';
import { Instance as IInstance } from '@/types';

const InstanceSchema = new Schema<IInstance>(
  {
    userId: { type: String, required: true, ref: 'User' },
    vmName: { type: String, required: true },
    zone: { type: String, required: true },
    ip: { type: String },
    status: {
      type: String,
      enum: ['provisioning', 'running', 'stopped', 'error'],
      default: 'provisioning',
    },
    label: { type: String },
    config: {
      telegramBotToken: { type: String },
      anthropicApiKey: { type: String },
    },
  },
  { timestamps: true }
);

InstanceSchema.index({ userId: 1 });

const InstanceModel: Model<IInstance> = mongoose.models.Instance || mongoose.model<IInstance>('Instance', InstanceSchema);

export default InstanceModel;
