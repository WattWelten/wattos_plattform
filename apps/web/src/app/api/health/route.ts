import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint für Web-App
 */
export async function GET() {
  try {
    // Optional: API-Connectivity-Check
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    let apiHealthy = false;
    
    try {
      const response = await fetch(`${apiUrl}/api/health/liveness`, {
        signal: AbortSignal.timeout(5000),
      });
      apiHealthy = response.ok;
    } catch {
      // API-Check optional, nicht kritisch
    }

    return NextResponse.json({
      ok: true,
      service: 'web',
      timestamp: new Date().toISOString(),
      api: apiHealthy ? 'connected' : 'unreachable',
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: 'web',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
