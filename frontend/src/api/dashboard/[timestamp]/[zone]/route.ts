import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { parseS3JsonObject } from './scanResults.shim';

const s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!
    }
});

export async function GET(request: Request, { params }: { params: { timestamp: string, zone: string } }) {
    try {
        const bucketName = process.env.NEXT_S3_BUCKET_NAME;
        const basePath = process.env.NEXT_S3_BASE_PATH;
        const tenantId = process.env.NEXT_TENANT_ID;

        const prefix = `${basePath}${tenantId}/`;

        if (!params.timestamp || !params.zone) {
            return NextResponse.json({ error: 'Timestamp and zone are required' }, { status: 400 });
        }


        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: `${prefix}/${params.timestamp}/${params.zone}/`,

        });

        const response = await s3Client.send(command);
        console.log("list scan objects response", response);

        return NextResponse.json({ result: response });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: { timestamp: string, zone: string } }) {
    try {
        const bucketName = process.env.NEXT_S3_BUCKET_NAME;
        const basePath = process.env.NEXT_S3_BASE_PATH;
        const tenantId = process.env.NEXT_TENANT_ID;

        const prefix = `${basePath}${tenantId}/`;

        const body = await request.json();
        console.log("body", body);

        const { objectName } = body;

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: `${prefix}/${params.timestamp}/${params.zone}/${objectName}`
        });

        const jsonData = await parseS3JsonObject(s3Client, command);
        console.log("parsed json data", jsonData);

        return NextResponse.json({ result: jsonData });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

}
