import { NextRequest, NextResponse } from 'next/server'
import { extractTenantFromToken } from '@/lib/utils/auth'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
    try {
        // Extract tenant ID from JWT token
        const authHeader = request.headers.get('authorization');
        const tenantId = extractTenantFromToken(authHeader);

        console.log('tenantId', tenantId)

        if (!tenantId) {
            return NextResponse.json(
                { error: 'Authentication required or invalid token' },
                { status: 401 }
            );
        }

        const body = await request.json()

        // Build request body with authenticated user's tenant_id
        const requestBody = {
            limit: body.limit || 50,
            offset: body.offset || 0,
            ...(body.status && { status: body.status }),
            ...(body.cloud_provider && { cloud_provider: body.cloud_provider }),
        }

        // Forward request to FastAPI backend with authentication
        const response = await fetch(`${FASTAPI_BASE_URL}/api/scan/scans`, {
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
                    error: 'Failed to fetch scans',
                    details: response.status >= 500 ? 'Internal server error' : errorText
                },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Scans POST API error:', error)

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to process scans request'
            },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
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
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')
        const status = searchParams.get('status')
        const cloud_provider = searchParams.get('cloud_provider')

        // Build request body for POST request to FastAPI (using authenticated tenant)
        const requestBody = {
            limit,
            offset,
            ...(status && { status }),
            ...(cloud_provider && { cloud_provider }),
        }

        // Forward request to FastAPI backend with authentication
        const response = await fetch(`${FASTAPI_BASE_URL}/api/scan/scans`, {
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
                    error: 'Failed to fetch scans',
                    details: response.status >= 500 ? 'Internal server error' : errorText
                },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Scans GET API error:', error)

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to process scans request'
            },
            { status: 500 }
        )
    }
} 