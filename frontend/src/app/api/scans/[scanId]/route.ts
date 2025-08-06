import { NextRequest, NextResponse } from 'next/server'
import { extractTenantFromToken } from '@/lib/utils/auth'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ scanId: string }> }
) {
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

        const { scanId } = await params;

        if (!scanId) {
            return NextResponse.json(
                { error: 'Scan ID is required' },
                { status: 400 }
            );
        }

        // Forward request to FastAPI backend with authentication
        const response = await fetch(`${FASTAPI_BASE_URL}/api/scan/scan/${scanId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader!,
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`FastAPI error: ${response.status} - ${errorText}`)

            if (response.status === 404) {
                return NextResponse.json(
                    { error: 'Scan not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json(
                {
                    error: 'Failed to fetch scan details',
                    details: response.status >= 500 ? 'Internal server error' : errorText
                },
                { status: response.status }
            )
        }

        const data = await response.json()

        return NextResponse.json(data)

    } catch (error) {
        console.error('Scan details GET API error:', error)

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to process scan details request'
            },
            { status: 500 }
        )
    }
} 