/* eslint-disable @typescript-eslint/no-explicit-any */
// Helper function to extract tenant ID from JWT token
export function extractTenantFromToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.tenant_id || null;
    } catch (error) {
        console.error('Error extracting tenant from token:', error);
        return null;
    }
}

// Helper function to extract user ID from JWT token
export function extractUserFromToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
    } catch (error) {
        console.error('Error extracting user from token:', error);
        return null;
    }
}

// Helper function to validate JWT token and extract full payload
export function extractTokenPayload(authHeader: string | null): any | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp < currentTime) {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Error extracting token payload:', error);
        return null;
    }
} 