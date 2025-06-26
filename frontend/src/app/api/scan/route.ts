import { NextResponse } from 'next/server';
import { SNSClient, PublishCommand, SNSServiceException } from '@aws-sdk/client-sns';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { aws_access_key_id, aws_secret_access_key, scan_name } = body;

        // Validate request body
        if (!scan_name) {
            return NextResponse.json(
                {
                    error: 'Validation Error',
                    message: 'Scan name is required'
                },
                { status: 400 }
            );
        }

        // Validate environment variables
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_SNS_TOPIC_ARN) {
            throw new Error('Missing required AWS environment variables');
        }

        // Create SNS client with environment credentials
        const snsClient = new SNSClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });

        // Prepare the message with user provided credentials and scan name
        const message = JSON.stringify({
            aws_access_key_id,
            aws_secret_access_key,
            scan_name
        });

        // Publish to SNS using environment variable for topic ARN
        const command = new PublishCommand({
            TopicArn: process.env.AWS_SNS_TOPIC_ARN,
            Message: message,
        });

        await snsClient.send(command);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error details:', error);

        if (error instanceof SNSServiceException) {
            if (error.name === 'AuthorizationErrorException') {
                return NextResponse.json(
                    {
                        error: 'AWS Authorization Error',
                        message: 'The AWS user does not have permission to publish to SNS. Please add SNS:Publish permission to the IAM user.',
                        details: error.message
                    },
                    { status: 403 }
                );
            }
        }

        if (error instanceof Error && error.message === 'Missing required AWS environment variables') {
            return NextResponse.json(
                {
                    error: 'Configuration Error',
                    message: 'Missing required AWS environment variables. Please check server configuration.'
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                error: 'SNS Publishing Error',
                message: 'Failed to publish message to SNS',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 