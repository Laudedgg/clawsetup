import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import InstanceModel from '@/models/Instance';
import { restartVM } from '@/lib/gcp';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { instanceId } = await req.json().catch(() => ({ instanceId: null }));

    await connectDB();

    const instance = instanceId
      ? await InstanceModel.findOne({ _id: instanceId, userId })
      : await InstanceModel.findOne({ userId });

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    await restartVM(instance.vmName);

    return NextResponse.json({ success: true, message: 'Instance restarting' });
  } catch (error: any) {
    console.error('Restart error:', error);
    return NextResponse.json({ error: 'Failed to restart instance' }, { status: 500 });
  }
}
