import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

export async function parseS3JsonObject(s3Client: any, command: GetObjectCommand) {
    const response = await s3Client.send(command);

    // Convert the readable stream to string
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }

    const dataString = Buffer.concat(chunks).toString('utf-8');

    // Parse the JSON string
    try {
        const jsonData = JSON.parse(dataString);
        return jsonData;
    } catch (error) {
        throw new Error('Failed to parse JSON data from S3 object');
    }
}
