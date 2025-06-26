import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!
    }
});

export async function GET() {
    try {
        const bucketName = process.env.NEXT_S3_BUCKET_NAME;
        const basePath = process.env.NEXT_S3_BASE_PATH;
        const tenantId = process.env.NEXT_TENANT_ID;

        const prefix = `${basePath}${tenantId}/`;

        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            Delimiter: '/'
        });

        const response = await s3Client.send(command);

        // Extract folder names and remove the prefix
        const folders = response.CommonPrefixes?.map((prefixObj) => {
            const folderPath = prefixObj.Prefix || '';
            return folderPath.replace(prefix, '').replace('/', '');
        }) || [];

        // Sort folders by timestamp (descending order)
        const sortedFolders = folders.sort((a, b) => {
            const timestampA = parseInt(a);
            const timestampB = parseInt(b);
            return timestampB - timestampA;
        });

        return NextResponse.json({ scans: sortedFolders });

    } catch (error) {
        console.error('Error fetching folders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch folders' },
            { status: 500 }
        );
    }
}
