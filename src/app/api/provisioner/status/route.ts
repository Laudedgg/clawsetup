import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import InstanceModel from '@/models/Instance';
import { getVMStatus } from '@/lib/gcp';

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

    const vmStatus = await getVMStatus(instance.vmName);

    if (vmStatus.status && vmStatus.status !== instance.status) {
      instance.status = vmStatus.status as any;
    }
    if (vmStatus.ip && vmStatus.ip !== instance.ip) {
      instance.ip = vmStatus.ip;
    }

    await instance.save();

    return NextResponse.json({
      id: instance._id.toString(),
      vmName: instance.vmName,
      ip: instance.ip,
      status: instance.status,
      zone: instance.zone,
      label: instance.label || null,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Failed to get instance status' }, { status: 500 });
  }
}
