import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import InstanceModel from '@/models/Instance';
import UserModel from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await connectDB();

    const user = await UserModel.findById(userId).lean();
    const instances = await InstanceModel.find({ userId }).sort({ createdAt: 1 }).lean();

    return NextResponse.json({
      instances: instances.map((inst: any) => ({
        id: inst._id.toString(),
        vmName: inst.vmName,
        label: inst.label || null,
        ip: inst.ip || null,
        status: inst.status,
        zone: inst.zone,
        createdAt: inst.createdAt,
      })),
      instanceSlots: (user as any)?.instanceSlots || 1,
      instanceCount: instances.length,
    });
  } catch (error: any) {
    console.error('Instances list error:', error);
    return NextResponse.json({ error: 'Failed to list instances' }, { status: 500 });
  }
}
