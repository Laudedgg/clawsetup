import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import UserModel from '@/models/User';
import InstanceModel from '@/models/Instance';
import { createVM } from '@/lib/gcp';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { telegramBotToken, anthropicApiKey, label } = await req.json();

    await connectDB();

    const user = await UserModel.findById(userId);
    if (!user || user.tier !== 'tier3') {
      return NextResponse.json(
        { error: 'Tier 3 subscription required' },
        { status: 403 }
      );
    }

    // Check instance count against slots
    const instanceCount = await InstanceModel.countDocuments({ userId });
    const slots = (user as any).instanceSlots || 1;
    if (instanceCount >= slots) {
      return NextResponse.json(
        { error: 'Instance limit reached — purchase an additional slot to spin up more instances.' },
        { status: 400 }
      );
    }

    const vm = await createVM(userId, { telegramBotToken, anthropicApiKey });

    const instance = await InstanceModel.create({
      userId,
      vmName: vm.vmName,
      zone: vm.zone,
      ip: vm.ip,
      status: 'provisioning',
      label: label || `Instance ${instanceCount + 1}`,
      config: {
        telegramBotToken,
        anthropicApiKey,
      },
    });

    await UserModel.findByIdAndUpdate(userId, {
      $push: { vmIds: instance._id.toString() },
    });

    return NextResponse.json({
      success: true,
      instance: {
        id: instance._id,
        vmName: instance.vmName,
        ip: instance.ip,
        status: instance.status,
        label: instance.label,
      },
    });
  } catch (error: any) {
    console.error('VM creation error:', error);
    return NextResponse.json({ error: 'Failed to create instance' }, { status: 500 });
  }
}
