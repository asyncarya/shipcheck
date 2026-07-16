import { NextResponse } from 'next/server';
import { runStore } from '@/lib/runStore';
import { analyzeTestRun } from '@/lib/analyzer';

export async function POST(
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

    if (run.status === 'created' || run.status === 'planning' || run.status === 'running') {
      return NextResponse.json(
        { error: { code: 'RUN_IN_PROGRESS', message: 'Test execution is still in progress. Please wait until it completes.' } },
        { status: 400 }
      );
    }

    // Perform analysis
    const bugReport = await analyzeTestRun(run);

    // Save report in the store
    await runStore.updateRun(runId, { bugReport });

    return NextResponse.json({ bugReport });
  } catch (error: any) {
    console.error('[API Analyze] Error:', error);
    return NextResponse.json(
      { error: { code: 'ANALYZER_ERROR', message: error.message || 'An error occurred while compiling the bug report.' } },
      { status: 500 }
    );
  }
}
