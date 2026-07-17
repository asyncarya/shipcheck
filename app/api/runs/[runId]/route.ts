import { NextResponse } from 'next/server';
import { runStore } from '@/lib/runStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;

    const run = await runStore.getRun(runId);
    if (!run) {
      return NextResponse.json(
        { error: { code: 'RUN_NOT_FOUND', message: `Test run with ID ${runId} was not found.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({ run });
  } catch (error: any) {
    console.error('[API Get Run] Error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: error.message || 'An error occurred while fetching the run.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;

    const success = await runStore.deleteRun(runId);
    if (!success) {
      return NextResponse.json(
        { error: { code: 'DELETE_FAILED', message: `Could not delete test run with ID ${runId}.` } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Delete Run] Error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: error.message || 'An error occurred while deleting the run.' } },
      { status: 500 }
    );
  }
}
