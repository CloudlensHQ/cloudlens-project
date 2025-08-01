import { NextRequest, NextResponse } from 'next/server'
import { extractTenantFromToken } from '@/lib/utils/auth'
import { getEncryptionService } from '@/lib/encryption'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface StartScanRequest {
    provider: string;
    credentials: {
        aws_access_key: string;
        aws_secret_key: string;
        aws_session_token?: string;
    };
    excluded_regions?: string[];
    scan_options?: number;
    scan_name?: string;
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

        const body: StartScanRequest = await request.json();

        // Validate request
        if (body.provider !== 'aws') {
            return NextResponse.json(
                { error: 'Only AWS provider is currently supported' },
                { status: 400 }
            );
        }

        if (!body.credentials?.aws_access_key || !body.credentials?.aws_secret_key) {
            return NextResponse.json(
                { error: 'AWS access key and secret key are required' },
                { status: 400 }
            );
        }

        // Encrypt AWS credentials using the same method as backend
        let encryptedCredentials;
        try {
            const encryptionService = getEncryptionService();
            encryptedCredentials = encryptionService.encryptAWSCredentials(
                body.credentials.aws_access_key,
                body.credentials.aws_secret_key,
                body.credentials.aws_session_token
            );
        } catch (error) {
            console.error('Encryption error:', error);
            return NextResponse.json(
                { error: 'Failed to encrypt credentials' },
                { status: 500 }
            );
        }

        // Prepare request for FastAPI backend
        const scanRequest = {
            encrypted_aws_access_key: encryptedCredentials.encrypted_aws_access_key,
            encrypted_aws_secret_key: encryptedCredentials.encrypted_aws_secret_key,
            ...(encryptedCredentials.encrypted_aws_session_token && {
                encrypted_aws_session_token: encryptedCredentials.encrypted_aws_session_token
            }),
            excluded_regions: body.excluded_regions || [],
            scan_options: body.scan_options || 840, // Default scan options
            ...(body.scan_name && { scan_name: body.scan_name }),
        };

        console.log('Starting AWS scan for tenant:', tenantId);

        // Forward request to FastAPI backend
        const response = await fetch(`${FASTAPI_BASE_URL}/api/scan/aws-cloud-scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader!,
            },
            body: JSON.stringify(scanRequest),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`FastAPI error: ${response.status} - ${errorText}`);

            // Parse error message if possible
            let errorMessage = 'Failed to start scan';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.detail || errorMessage;
            } catch {
                // Use the raw error text if JSON parsing fails
                errorMessage = errorText || errorMessage;
            }

            return NextResponse.json(
                {
                    error: 'Failed to start scan',
                    details: response.status >= 500 ? 'Internal server error' : errorMessage
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        console.log('Scan started successfully:', {
            scan_id: data.scan_id,
            tenant_id: tenantId
        });

        return NextResponse.json({
            success: true,
            scan_id: data.scan_id,
            status: data.status,
            message: 'Scan started successfully',
            details: data
        });

    } catch (error) {
        console.error('Start scan API error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to process scan request'
            },
            { status: 500 }
        );
    }
} 