import { promises as fs } from 'fs';
import path from 'path';

export interface ServiceData {
    [key: string]: any;
}

export async function loadServiceData(timestamp: string, region: string, service: string): Promise<ServiceData> {
    try {
        const response = await fetch(`/api/scans?timestamp=${timestamp}&region=${region}&service=${service}`);
        if (!response.ok) {
            throw new Error('Failed to fetch service data');
        }
        return response.json();
    } catch (error) {
        console.error(`Error loading service data: ${error}`);
        return {};
    }
}

export async function getAvailableTimestamps(): Promise<string[]> {
    try {
        const response = await fetch('/api/scans');
        if (!response.ok) {
            throw new Error('Failed to fetch timestamps');
        }
        return response.json();
    } catch (error) {
        console.error(`Error loading timestamps: ${error}`);
        return [];
    }
}

export async function getAvailableRegions(timestamp: string): Promise<string[]> {
    try {
        const response = await fetch(`/api/scans?timestamp=${timestamp}`);
        if (!response.ok) {
            throw new Error('Failed to fetch regions');
        }
        return response.json();
    } catch (error) {
        console.error(`Error loading regions: ${error}`);
        return [];
    }
}

export async function getAvailableServices(timestamp: string, region: string): Promise<string[]> {
    try {
        const response = await fetch(`/api/scans?timestamp=${timestamp}&region=${region}`);
        if (!response.ok) {
            throw new Error('Failed to fetch services');
        }
        return response.json();
    } catch (error) {
        console.error(`Error loading services: ${error}`);
        return [];
    }
} 