import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import InstanceModel from '@/models/Instance';
import UserModel from '@/models/User';
import { deleteVM } from '@/lib/gcp';

export async function DELETE(req: NextRequest) {
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

    // Delete from GCP (best-effort – don't fail if VM already gone)
    try {
      await deleteVM(instance.vmName);
    } catch (gcpErr) {
      console.warn('GCP delete warning (instance may already be gone):', gcpErr);
    }

    // Remove from DB
    await InstanceModel.deleteOne({ _id: instance._id });
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { vmIds: instance._id.toString() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete instance' }, { status: 500 });
  }
}
