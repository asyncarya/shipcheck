import { NextResponse } from 'next/server';
import { generateTestPlan } from '@/lib/planner';
import { validateUrl, formatUrl } from '@/lib/urlValidation';
import { runStore } from '@/lib/runStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, task, expectedResult } = body;

    if (!url) {
      return NextResponse.json(
        { error: { code: 'INVALID_URL', message: 'Target website URL is required.' } },
        { status: 400 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { error: { code: 'INVALID_TASK', message: 'Task description is required.' } },
        { status: 400 }
      );
    }

    const { isValid, error } = validateUrl(url);
    if (!isValid) {
      return NextResponse.json(
        { error: { code: 'INVALID_URL', message: error } },
        { status: 400 }
      );
    }

    const formattedUrl = formatUrl(url);
    const plan = await generateTestPlan(formattedUrl, task, expectedResult);
    
    // Assign a unique plan ID
    const planId = `plan_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save the plan so /api/runs can look it up
    runStore.savePlan(planId, plan);

    return NextResponse.json({
      plan: {
        id: planId,
        ...plan,
      },
    });
  } catch (error: any) {
    console.error('[API Plans] Error:', error);
    return NextResponse.json(
      { error: { code: 'PLANNER_ERROR', message: error.message || 'An error occurred while generating the test plan.' } },
      { status: 500 }
    );
  }
}
