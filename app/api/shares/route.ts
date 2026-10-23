import { and, asc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db';
import { financialShares } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';
import { normalizeEmail } from '@/lib/sharing';

export const dynamic = 'force-dynamic';

const createShareSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    const db = await getDb();
    const email = normalizeEmail(user.email);
    const [outgoing, incoming] = await Promise.all([
      db
        .select({
          id: financialShares.id,
          viewerEmail: financialShares.viewerEmail,
          createdAt: financialShares.createdAt,
        })
        .from(financialShares)
        .where(eq(financialShares.ownerUserId, user.userId))
        .orderBy(asc(financialShares.createdAt)),
      db
        .select({
          id: financialShares.id,
          ownerName: financialShares.ownerName,
          createdAt: financialShares.createdAt,
        })
        .from(financialShares)
        .where(eq(financialShares.viewerEmail, email))
        .orderBy(asc(financialShares.createdAt)),
    ]);

    return NextResponse.json({ success: true, data: { outgoing, incoming } });
  } catch (error) {
    console.error('Failed to fetch financial shares:', error);
    return NextResponse.json(
      { error: 'Unable to load sharing settings.' },
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

    const parsed = createShareSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 },
      );
    }

    const email = normalizeEmail(parsed.data.email);
    if (email === normalizeEmail(user.email)) {
      return NextResponse.json(
        { error: 'You already have access to your own account.' },
        { status: 400 },
      );
    }

    const db = await getDb();
    const [created] = await db
      .insert(financialShares)
      .values({
        id: crypto.randomUUID(),
        ownerUserId: user.userId,
        ownerName: user.fullName || user.displayName || 'A ChatGPT user',
        viewerEmail: email,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({
        id: financialShares.id,
        viewerEmail: financialShares.viewerEmail,
        createdAt: financialShares.createdAt,
      });

    if (created) {
      return NextResponse.json(
        { success: true, data: created },
        { status: 201 },
      );
    }

    const [existing] = await db
      .select({
        id: financialShares.id,
        viewerEmail: financialShares.viewerEmail,
        createdAt: financialShares.createdAt,
      })
      .from(financialShares)
      .where(
        and(
          eq(financialShares.ownerUserId, user.userId),
          eq(financialShares.viewerEmail, email),
        ),
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      data: existing,
      alreadyShared: true,
    });
  } catch (error) {
    console.error('Failed to create financial share:', error);
    return NextResponse.json(
      { error: 'Unable to create this invitation.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    const id = new URL(request.url).searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json(
        { error: 'Invitation ID is required.' },
        { status: 400 },
      );
    }

    const db = await getDb();
    const deleted = await db
      .delete(financialShares)
      .where(
        and(
          eq(financialShares.id, id),
          eq(financialShares.ownerUserId, user.userId),
        ),
      )
      .returning({ id: financialShares.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Invitation not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke financial share:', error);
    return NextResponse.json(
      { error: 'Unable to revoke this invitation.' },
      { status: 500 },
    );
  }
}
