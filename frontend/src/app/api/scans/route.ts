import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const timestamp = searchParams.get('timestamp');
    const region = searchParams.get('region');
    const service = searchParams.get('service');

    try {
        if (service && region && timestamp) {
            // Get service data
            const filePath = path.join(process.cwd(), 'public', '-1', timestamp, region, `${service.toLowerCase()}_results.json`);
            const data = await fs.readFile(filePath, 'utf-8');
            return NextResponse.json(JSON.parse(data));
        } else if (region && timestamp) {
            // Get services for region
            const servicesPath = path.join(process.cwd(), 'public', '-1', timestamp, region);
            const files = await fs.readdir(servicesPath);
            const services = files
                .filter(f => f.endsWith('_results.json'))
                .map(f => f.replace('_results.json', '').toUpperCase());
            return NextResponse.json(services);
        } else if (timestamp) {
            // Get regions for timestamp
            const regionsPath = path.join(process.cwd(), 'public', '-1', timestamp);
            const regions = await fs.readdir(regionsPath);
            return NextResponse.json(regions.filter(r => !r.startsWith('.')));
        } else {
            // Get timestamps
            const timestampsPath = path.join(process.cwd(), 'public', '-1');
            const timestamps = await fs.readdir(timestampsPath);
            return NextResponse.json(timestamps.filter(t => !t.startsWith('.')));
        }
    } catch (error) {
        console.error('Error handling scan data request:', error);
        return NextResponse.json({ error: 'Failed to fetch scan data' }, { status: 500 });
    }
} 