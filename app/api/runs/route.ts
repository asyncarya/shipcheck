import { NextResponse, after } from 'next/server';
import { runStore } from '@/lib/runStore';
import { runBrowserTest } from '@/lib/runner';
import { createServer } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, planId } = body;

    if (!url) {
      return NextResponse.json(
        { error: { code: 'INVALID_URL', message: 'Target website URL is required.' } },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        { error: { code: 'INVALID_PLAN', message: 'Plan ID is required.' } },
        { status: 400 }
      );
    }

    // Lookup plan
    const plan = await runStore.getPlan(planId);
    if (!plan) {
      return NextResponse.json(
        { error: { code: 'PLAN_NOT_FOUND', message: 'The specified plan was not found or has expired.' } },
        { status: 404 }
      );
    }

    // Authenticate user via Supabase server helper if enabled
    const supabase = await createServer();
    let userId: string | undefined = undefined;
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    // Generate unique run ID
    const runId = `run_${Math.random().toString(36).substr(2, 9)}`;

    // Create run in database
    await runStore.createRun(runId, url, plan.goal, userId);
    await runStore.updateRun(runId, { plan, planId });

    // Kick off test runner asynchronously (keep alive in Vercel with after)
    after(() => {
      runBrowserTest(runId, url, plan).catch((err) => {
        console.error(`[API Runs] Background run ${runId} execution failure:`, err);
      });
    });

    return NextResponse.json({
      run: {
        id: runId,
        status: 'created',
      },
    });
  } catch (error: any) {
    console.error('[API Runs] Error:', error);
    return NextResponse.json(
      { error: { code: 'RUNNER_ERROR', message: error.message || 'An error occurred while launching the test run.' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createServer();
    let userId: string | undefined = undefined;
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    const runs = await runStore.getAllRuns(userId);
    return NextResponse.json({ runs });
  } catch (error: any) {
    console.error('[API Get Runs] Error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: error.message || 'An error occurred while fetching runs.' } },
      { status: 500 }
    );
  }
}
