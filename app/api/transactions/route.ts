import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gte, like, lte, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { transactions } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';
import {
  CreateTransactionSchema,
  calculateFinancialSummary,
  formatVND,
} from '@/lib/financial';
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const typeParam = searchParams.get('type')?.toUpperCase();
    const tagParam = searchParams.get('tag')?.trim();
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const page = Math.max(
      1,
      parseInt(searchParams.get('page') || '1', 10) || 1,
    );
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20),
    );
    const offset = (page - 1) * limit;

    const db = await getDb();
    const requestedShareId = searchParams.get('shareId')?.trim() || null;
    const access = await canViewFinancialAccount(db, user, requestedShareId);
    if (!access) {
      return NextResponse.json(
        { error: 'This account is not shared with your signed-in email.' },
        { status: 403 },
      );
    }

    const conditions = [eq(transactions.userId, access.ownerUserId)];

    if (typeParam === 'ADD' || typeParam === 'SUBTRACT') {
      conditions.push(eq(transactions.type, typeParam));
    }

    if (tagParam && tagParam !== 'ALL') {
      conditions.push(eq(transactions.tag, tagParam));
    }

    if (search) {
      conditions.push(
        or(
          like(transactions.note, `%${search}%`),
          like(transactions.tag, `%${search}%`),
        )!,
      );
    }

    if (startDateParam) {
      const start = new Date(startDateParam);
      if (!Number.isNaN(start.getTime())) {
        conditions.push(gte(transactions.createdAt, start));
      }
    }

    if (endDateParam) {
      const end = new Date(endDateParam);
      if (!Number.isNaN(end.getTime())) {
        // If date-only string like YYYY-MM-DD, set to end of day
        if (endDateParam.length === 10) {
          end.setUTCHours(23, 59, 59, 999);
        }
        conditions.push(lte(transactions.createdAt, end));
      }
    }

    const whereClause = and(...conditions);
    // Query matching rows with pagination
    const items = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        note: transactions.note,
        tag: transactions.tag,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination metadata
    const allMatching = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(whereClause);

    const total = allMatching.length;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch unique tags used by this user to populate tag selection lists
    const userTagRecords = await db
      .selectDistinct({ tag: transactions.tag })
      .from(transactions)
      .where(eq(transactions.userId, access.ownerUserId));

    const usedTags = userTagRecords
      .map((r) => r.tag)
      .filter((t): t is string => Boolean(t && t.trim().length > 0));

    return NextResponse.json({
      success: true,
      data: items,
      availableTags: usedTags,
      viewing: {
        ownerName: access.ownerName,
        isShared: access.isShared,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching transactions.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 },
      );
    }

    const parsed = CreateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Validation error';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { type, amount, note, tag } = parsed.data;
    const db = await getDb();

    // If subtracting, verify user has sufficient funds
    if (type === 'SUBTRACT') {
      const userTxs = await db
        .select({
          type: transactions.type,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(eq(transactions.userId, user.userId));

      const summary = calculateFinancialSummary(userTxs);
      if (amount > summary.currentBalance) {
        return NextResponse.json(
          {
            error: `Insufficient funds. Available balance is ${formatVND(
              summary.currentBalance,
            )}, but tried to subtract ${formatVND(amount)}.`,
          },
          { status: 400 },
        );
      }
    }

    const now = new Date();
    const newId = crypto.randomUUID();

    const [created] = await db
      .insert(transactions)
      .values({
        id: newId,
        userId: user.userId,
        type,
        amount,
        note: note || null,
        tag: tag || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: created,
        message:
          type === 'ADD'
            ? `Successfully added ${formatVND(amount)}.`
            : `Successfully subtracted ${formatVND(amount)}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating transaction.' },
      { status: 500 },
    );
  }
}
