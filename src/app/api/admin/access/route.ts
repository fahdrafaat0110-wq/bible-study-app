
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

const ALLOWED_STATUSES = ['APPROVED', 'REJECTED', 'REVOKED'] as const;

export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const requests = await prisma.accessRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Access requests GET error:', error);

    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (
      typeof id !== 'string' ||
      !id.trim() ||
      !ALLOWED_STATUSES.includes(status)
    ) {
      return NextResponse.json(
        { error: 'INVALID_DATA' },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.accessRequest.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'REQUEST_NOT_FOUND' },
        { status: 404 }
      );
    }

    console.error('Access requests PATCH error:', error);

    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
