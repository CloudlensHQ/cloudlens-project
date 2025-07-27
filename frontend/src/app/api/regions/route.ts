import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const cloud_provider = searchParams.get('cloud_provider') || 'AWS'

        // Forward request to FastAPI backend
        const response = await fetch(`${FASTAPI_BASE_URL}/api/regions/?cloud_provider=${cloud_provider}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Forward any auth headers if needed
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
                    error: 'Failed to fetch regions',
                    details: response.status >= 500 ? 'Internal server error' : errorText
                },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Regions GET API error:', error)

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to process regions request'
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const cloud_provider = body.cloud_provider || 'AWS'

        // Forward request to FastAPI backend
        const response = await fetch(`${FASTAPI_BASE_URL}/api/regions/?cloud_provider=${cloud_provider}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Forward any auth headers if needed
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
                    error: 'Failed to fetch regions',
                    details: response.status >= 500 ? 'Internal server error' : errorText
                },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Regions POST API error:', error)

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to process regions request'
            },
            { status: 500 }
        )
    }
} 