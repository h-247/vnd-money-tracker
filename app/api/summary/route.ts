import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { transactions } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';
import { calculateFinancialSummary } from '@/lib/financial';
import { canViewFinancialAccount } from '@/lib/sharing';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    const db = await getDb();
    const requestedShareId =
      new URL(request.url).searchParams.get('shareId')?.trim() || null;
    const access = await canViewFinancialAccount(db, user, requestedShareId);
    if (!access) {
      return NextResponse.json(
        { error: 'This account is not shared with your signed-in email.' },
        { status: 403 },
      );
    }

    const userTxs = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(eq(transactions.userId, access.ownerUserId));

    const summary = calculateFinancialSummary(userTxs);

    return NextResponse.json({
      success: true,
      data: summary,
      user: {
        userId: user.userId,
        displayName: user.displayName,
        email: user.email,
      },
      viewing: {
        ownerName: access.ownerName,
        isShared: access.isShared,
      },
    });
  } catch (error) {
    console.error('Failed to get financial summary:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching summary.' },
      { status: 500 },
    );
  }
}
