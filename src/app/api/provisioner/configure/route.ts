import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import InstanceModel from '@/models/Instance';
import { updateVMConfig } from '@/lib/gcp';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { instanceId, telegramBotToken, anthropicApiKey } = await req.json();

    await connectDB();

    const instance = instanceId
      ? await InstanceModel.findOne({ _id: instanceId, userId })
      : await InstanceModel.findOne({ userId });

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const newToken = telegramBotToken || instance.config.telegramBotToken || '';
    const newKey = anthropicApiKey || instance.config.anthropicApiKey || '';

    // Update DB config
    instance.config = { telegramBotToken: newToken, anthropicApiKey: newKey };
    await instance.save();

    // Push config to the live VM via metadata update + restart
    if (instance.status === 'running' || instance.status === 'provisioning') {
      try {
        await updateVMConfig(instance.vmName, { telegramBotToken: newToken, anthropicApiKey: newKey });
      } catch (vmErr) {
        console.warn('VM metadata update warning:', vmErr);
        // DB is already saved; non-fatal
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated and applied to the VM.',
    });
  } catch (error: any) {
    console.error('Configure error:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
