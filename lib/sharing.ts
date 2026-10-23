import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { financialShares } from '@/db/schema';
import type { ChatGPTUser } from '@/app/chatgpt-auth';

type Database = Awaited<ReturnType<typeof getDb>>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function canViewFinancialAccount(
  db: Database,
  viewer: ChatGPTUser,
  shareId: string | null,
): Promise<{
  ownerUserId: string;
  ownerName: string | null;
  isShared: boolean;
} | null> {
  if (!shareId) {
    return { ownerUserId: viewer.userId, ownerName: null, isShared: false };
  }

  const [grant] = await db
    .select({
      ownerUserId: financialShares.ownerUserId,
      ownerName: financialShares.ownerName,
    })
    .from(financialShares)
    .where(
      and(
        eq(financialShares.id, shareId),
        eq(financialShares.viewerEmail, normalizeEmail(viewer.email)),
      ),
    )
    .limit(1);

  return grant ? { ...grant, isShared: true } : null;
}
