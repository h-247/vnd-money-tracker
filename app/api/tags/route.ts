import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { tags, transactions, userSettings } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';
import {
  CreateTagSchema,
  DEFAULT_EXPENSE_TAGS,
  DEFAULT_INCOME_TAGS,
} from '@/lib/financial';

export const dynamic = 'force-dynamic';

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

    // Query user's tags
    let userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, user.userId))
      .orderBy(asc(tags.name));

    // Check user_settings to see if default tags have ever been seeded
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.userId));

    // If never seeded and user currently has 0 tags, seed the default starter tags once
    if (!settings?.tagsSeeded) {
      if (userTags.length === 0) {
        const now = new Date();
        const seedItems = [
          ...DEFAULT_INCOME_TAGS.map((name) => ({
            id: crypto.randomUUID(),
            userId: user.userId,
            name,
            type: 'INCOME' as const,
            color: '#22C55E',
            createdAt: now,
            updatedAt: now,
          })),
          ...DEFAULT_EXPENSE_TAGS.filter(
            (name) => !DEFAULT_INCOME_TAGS.includes(name),
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

        for (const item of seedItems) {
          await db.insert(tags).values(item);
        }

        userTags = await db
          .select()
          .from(tags)
          .where(eq(tags.userId, user.userId))
          .orderBy(asc(tags.name));
      }

      // Mark tagsSeeded as true so we never auto-re-seed if the user deletes them
      if (!settings) {
        await db.insert(userSettings).values({
          userId: user.userId,
          tagsSeeded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await db
          .update(userSettings)
          .set({ tagsSeeded: true, updatedAt: new Date() })
          .where(eq(userSettings.userId, user.userId));
      }
    }

    return NextResponse.json({
      success: true,
      data: userTags,
    });
  } catch (error) {
    console.error('Failed to get tags:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching tags.' },
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

    const parsed = CreateTagSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Validation error';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, type, color } = parsed.data;
    const db = await getDb();

    // Check for duplicate name (case-insensitive)
    const existing = await db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(eq(tags.userId, user.userId));

    const duplicate = existing.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `A tag with name "${name}" already exists.` },
        { status: 400 },
      );
    }

    const now = new Date();
    const newId = crypto.randomUUID();

    const [created] = await db
      .insert(tags)
      .values({
        id: newId,
        userId: user.userId,
        name,
        type,
        color: color || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: created,
        message: `Tag "${name}" created successfully.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create tag:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating tag.' },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      );
    }

    const db = await getDb();

    // 1. Delete all tags belonging to user
    await db.delete(tags).where(eq(tags.userId, user.userId));

    // 2. Disassociate tags from user's transactions
    await db
      .update(transactions)
      .set({ tag: null, updatedAt: new Date() })
      .where(eq(transactions.userId, user.userId));

    // 3. Mark tagsSeeded as true in user_settings so they are not reseeded
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.userId));

    if (!settings) {
      await db.insert(userSettings).values({
        userId: user.userId,
        tagsSeeded: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (!settings.tagsSeeded) {
      await db
        .update(userSettings)
        .set({ tagsSeeded: true, updatedAt: new Date() })
        .where(eq(userSettings.userId, user.userId));
    }

    return NextResponse.json({
      success: true,
      message: 'All existing tags deleted successfully.',
    });
  } catch (error) {
    console.error('Failed to delete all tags:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting all tags.' },
      { status: 500 },
    );
  }
}
