import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { transactions } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';
import {
  UpdateTransactionSchema,
  canDeleteTransaction,
  canUpdateTransaction,
  formatVND,
} from '@/lib/financial';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required.' },
        { status: 400 },
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

    const parsed = UpdateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Validation error';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { amount, type, note, tag } = parsed.data;
    const db = await getDb();

    // Verify ownership and load all user transactions for balance integrity check
    const allUserTxs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.userId));

    const existingTx = allUserTxs.find((t) => t.id === id);
    if (!existingTx) {
      return NextResponse.json(
        { error: 'Transaction not found or access denied.' },
        { status: 404 },
      );
    }

    // If amount or type is changing, run integrity checks
    if (
      (amount !== undefined && amount !== existingTx.amount) ||
      (type !== undefined && type !== existingTx.type)
    ) {
      const integrityCheck = canUpdateTransaction(allUserTxs, id, {
        amount,
        type,
      });

      if (!integrityCheck.allowed) {
        return NextResponse.json(
          {
            error:
              integrityCheck.reason ||
              'Update rejected: would violate non-negative balance rule.',
          },
          { status: 400 },
        );
      }
    }

    const now = new Date();
    const updateValues: Record<string, unknown> = {
      updatedAt: now,
    };
    if (amount !== undefined) updateValues.amount = amount;
    if (type !== undefined) updateValues.type = type;
    if (note !== undefined) updateValues.note = note || null;
    if (tag !== undefined) updateValues.tag = tag || null;

    const [updated] = await db
      .update(transactions)
      .set(updateValues)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.userId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Transaction updated successfully.',
    });
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating transaction.' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required.' },
        { status: 400 },
      );
    }

    const db = await getDb();
    const allUserTxs = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.userId));

    const existingTx = allUserTxs.find((t) => t.id === id);
    if (!existingTx) {
      return NextResponse.json(
        { error: 'Transaction not found or access denied.' },
        { status: 404 },
      );
    }

    // Verify deletion does not cause negative balance
    const deletionCheck = canDeleteTransaction(allUserTxs, id);
    if (!deletionCheck.allowed) {
      return NextResponse.json(
        {
          error:
            deletionCheck.reason ||
            'Cannot delete this transaction: it would result in a negative balance.',
        },
        { status: 400 },
      );
    }

    await db
      .delete(transactions)
      .where(
        and(eq(transactions.id, id), eq(transactions.userId, user.userId)),
      );

    return NextResponse.json({
      success: true,
      deletedId: id,
      message: `Transaction of ${formatVND(existingTx.amount)} deleted successfully.`,
    });
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting transaction.' },
      { status: 500 },
    );
  }
}
