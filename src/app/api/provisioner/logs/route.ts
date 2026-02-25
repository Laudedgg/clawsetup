import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import InstanceModel from '@/models/Instance';
import { getVMLogs } from '@/lib/gcp';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const instanceId = req.nextUrl.searchParams.get('instanceId');

    await connectDB();

    const instance = instanceId
      ? await InstanceModel.findOne({ _id: instanceId, userId })
      : await InstanceModel.findOne({ userId });

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const { logs, done } = await getVMLogs(instance.vmName);

    // If setup is done and instance was provisioning, update status to running
    if (done && instance.status === 'provisioning') {
      instance.status = 'running';
      await instance.save();
    }

    return NextResponse.json({ logs, done, status: instance.status });
  } catch (error: any) {
    console.error('Logs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
