import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const isAdminByFlag = !!(session?.user as any)?.isAdmin;
  const isAdminByEnv = email ? parseAdminEmails().includes(email) : false;

  if (!session?.user || (!isAdminByFlag && !isAdminByEnv)) {
    return { ok: false as const, session };
  }

  return { ok: true as const, session };
}
