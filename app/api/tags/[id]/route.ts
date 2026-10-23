import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { tags, transactions, userSettings } from '@/db/schema';
import { getAuthUser } from '@/lib/auth';
import { UpdateTagSchema } from '@/lib/financial';

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
        { error: 'Tag ID is required.' },
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

    const parsed = UpdateTagSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Validation error';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, type, color } = parsed.data;
    const db = await getDb();

    // Verify tag exists and belongs to user
    const [existing] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, user.userId)));

    if (!existing) {
      return NextResponse.json(
        { error: 'Tag not found or access denied.' },
        { status: 404 },
      );
    }

    // Check duplicate name if name changed
    if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
      const allUserTags = await db
        .select({ id: tags.id, name: tags.name })
        .from(tags)
        .where(eq(tags.userId, user.userId));

      const duplicate = allUserTags.find(
        (t) => t.id !== id && t.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) {
        return NextResponse.json(
          { error: `Another tag with name "${name}" already exists.` },
          { status: 400 },
        );
      }
    }

    const now = new Date();
    const updateValues: Record<string, unknown> = {
      updatedAt: now,
    };
    if (name !== undefined) updateValues.name = name;
    if (type !== undefined) updateValues.type = type;
    if (color !== undefined) updateValues.color = color || null;

    const [updated] = await db
      .update(tags)
      .set(updateValues)
      .where(and(eq(tags.id, id), eq(tags.userId, user.userId)))
      .returning();

    // If tag name was renamed, cascade update to existing transactions
    if (name && name !== existing.name) {
      await db
        .update(transactions)
        .set({ tag: name, updatedAt: now })
        .where(
          and(
            eq(transactions.userId, user.userId),
            eq(transactions.tag, existing.name),
          ),
        );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Tag updated successfully.',
    });
  } catch (error) {
    console.error('Failed to update tag:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating tag.' },
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
        { error: 'Tag ID is required.' },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Verify tag exists and belongs to user
    const [existing] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, user.userId)));

    if (!existing) {
      return NextResponse.json(
        { error: 'Tag not found or access denied.' },
        { status: 404 },
      );
    }

    // Delete tag from tags table
    await db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, user.userId)));

    // Disassociate this tag from transactions that were using it
    await db
      .update(transactions)
      .set({ tag: null, updatedAt: new Date() })
      .where(
        and(
          eq(transactions.userId, user.userId),
          eq(transactions.tag, existing.name),
        ),
      );

    // Ensure tagsSeeded is recorded so deleting the last tag doesn't re-seed
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
      deletedId: id,
      message: `Tag "${existing.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error('Failed to delete tag:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting tag.' },
      { status: 500 },
    );
  }
}
