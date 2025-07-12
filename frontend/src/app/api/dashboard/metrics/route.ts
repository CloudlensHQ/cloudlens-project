import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || 'http://localhost:9000'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate required fields
        if (!body.tenant_id) {
            return NextResponse.json(
                { error: 'tenant_id is required' },
                { status: 400 }
            )
        }

        // Forward request to FastAPI backend
        const response = await fetch(`${FASTAPI_BASE_URL}/api/dashboard/metrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward any auth headers if needed
                ...(request.headers.get('authorization') && {
                    'Authorization': request.headers.get('authorization')!
                }),
            },
            body: JSON.stringify(body),
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
        const { searchParams } = new URL(request.url)
        const tenant_id = searchParams.get('tenant_id')
        const scan_id = searchParams.get('scan_id')
        const days = searchParams.get('days')

        if (!tenant_id) {
            return NextResponse.json(
                { error: 'tenant_id query parameter is required' },
                { status: 400 }
            )
        }

        // Build query string for FastAPI
        const queryParams = new URLSearchParams({ tenant_id })
        if (scan_id) queryParams.append('scan_id', scan_id)
        if (days) queryParams.append('days', days)

        const response = await fetch(`${FASTAPI_BASE_URL}/api/dashboard/metrics?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(request.headers.get('authorization') && {
                    'Authorization': request.headers.get('authorization')!
                }),
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