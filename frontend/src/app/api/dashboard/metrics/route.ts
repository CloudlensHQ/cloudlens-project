import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// Helper function to extract tenant ID from JWT token
function extractTenantFromToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.tenant_id || null;
    } catch (error) {
        console.error('Error extracting tenant from token:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Extract tenant ID from JWT token
        const authHeader = request.headers.get('authorization');
        const tenantId = extractTenantFromToken(authHeader);

        if (!tenantId) {
            return NextResponse.json(
                { error: 'Authentication required or invalid token' },
                { status: 401 }
            );
        }

        const body = await request.json()

        // Build request body with authenticated user's tenant_id
        const requestBody = {
            tenant_id: tenantId,
            ...(body.scan_id && { scan_id: body.scan_id }),
            ...(body.days && { days: body.days }),
        };

        // Forward request to FastAPI backend with authentication
        const response = await fetch(`${FASTAPI_BASE_URL}/api/dashboard/metrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader!,
            },
            body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`FastAPI error: ${response.status} - ${errorText}`)

            return NextResponse.json(
                {
                    error: 'Failed to fetch dashboard metrics',
                    details: response.status >= 500 ? 'Internal server error' : errorText
                },
                { status: response.status }
            )
        }

        const data = await response.json()

        // Optionally transform or validate the response here
        return NextResponse.json(data)

    } catch (error) {
        console.error('Dashboard metrics API error:', error)

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to process dashboard metrics request'
            },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    // Handle GET requests with query parameters
    try {
        // Extract tenant ID from JWT token
        const authHeader = request.headers.get('authorization');
        const tenantId = extractTenantFromToken(authHeader);

        if (!tenantId) {
            return NextResponse.json(
                { error: 'Authentication required or invalid token' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url)
        const scan_id = searchParams.get('scan_id')
        const days = searchParams.get('days')

        // Build query string for FastAPI using authenticated tenant_id
        const queryParams = new URLSearchParams({ tenant_id: tenantId })
        if (scan_id) queryParams.append('scan_id', scan_id)
        if (days) queryParams.append('days', days)

        const response = await fetch(`${FASTAPI_BASE_URL}/api/dashboard/metrics?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader!,
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`FastAPI error: ${response.status} - ${errorText}`)

            return NextResponse.json(
                {
                    error: 'Failed to fetch dashboard metrics',
                    details: response.status >= 500 ? 'Internal server error' : errorText
                },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Dashboard metrics GET API error:', error)

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to process dashboard metrics request'
            },
            { status: 500 }
        )
    }
} 