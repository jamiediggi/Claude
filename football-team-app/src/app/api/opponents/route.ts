import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, opponents } from '@/lib/db';

export async function GET() {
  try {
    const allOpponents = db
      .select()
      .from(opponents)
      .orderBy(opponents.name)
      .all();

    return NextResponse.json(allOpponents);
  } catch (error) {
    console.error('Failed to get opponents:', error);
    return NextResponse.json(
      { error: 'Failed to get opponents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, homeGroundName, postcode, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const [opponent] = db
      .insert(opponents)
      .values({
        name,
        homeGroundName: homeGroundName || null,
        postcode: postcode || null,
        notes: notes || null,
      })
      .returning()
      .all();

    return NextResponse.json(opponent, { status: 201 });
  } catch (error) {
    console.error('Failed to create opponent:', error);
    return NextResponse.json(
      { error: 'Failed to create opponent' },
      { status: 500 }
    );
  }
}
