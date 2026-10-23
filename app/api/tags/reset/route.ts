import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { tags, userSettings } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';
import { DEFAULT_EXPENSE_TAGS, DEFAULT_INCOME_TAGS } from '@/lib/financial';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    const db = await getDb();

    // Fetch existing tag names to avoid duplicates
    const existing = await db
      .select({ name: tags.name })
      .from(tags)
      .where(eq(tags.userId, user.userId));

    const existingNames = new Set(existing.map((t) => t.name.toLowerCase()));
    const now = new Date();

    const newItems = [
      ...DEFAULT_INCOME_TAGS.filter(
        (n) => !existingNames.has(n.toLowerCase()),
      ).map((name) => ({
        id: crypto.randomUUID(),
        userId: user.userId,
        name,
        type: 'INCOME' as const,
        color: '#22C55E',
        createdAt: now,
        updatedAt: now,
      })),
      ...DEFAULT_EXPENSE_TAGS.filter(
        (n) =>
          !existingNames.has(n.toLowerCase()) &&
          !DEFAULT_INCOME_TAGS.some(
            (inc) => inc.toLowerCase() === n.toLowerCase(),
          ),
      ).map((name) => ({
        id: crypto.randomUUID(),
        userId: user.userId,
        name,
        type: 'EXPENSE' as const,
        color: '#EF4444',
        createdAt: now,
        updatedAt: now,
      })),
    ];

    for (const item of newItems) {
      await db.insert(tags).values(item);
    }

    // Ensure tagsSeeded is true
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.userId));

    if (!settings) {
      await db.insert(userSettings).values({
        userId: user.userId,
        tagsSeeded: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Return all user tags
    const allTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, user.userId));

    return NextResponse.json({
      success: true,
      data: allTags,
      message: 'Default tags have been restored.',
    });
  } catch (error) {
    console.error('Failed to reset tags:', error);
    return NextResponse.json(
      { error: 'Internal server error while resetting tags.' },
      { status: 500 },
    );
  }
}
