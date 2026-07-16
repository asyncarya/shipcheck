import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, forceSuccess } = body;

    // Simulate server processing time
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (forceSuccess === true || (name && name.toLowerCase().includes('happypath'))) {
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully',
      });
    }

    // Default: Simulate internal database error / server failure
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to insert contact inquiry.' },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
