import * as crypto from 'crypto';

export class EncryptionService {
    private encryptionKey: string;
    private keyBuffer: Buffer;

    constructor(encryptionKey: string) {
        this.encryptionKey = encryptionKey;
        this.keyBuffer = this.prepareKey(encryptionKey);
    }

    private prepareKey(key: string): Buffer {
        // Ensure we have a 32-byte key for AES-256 (same logic as backend)
        let processedKey = key;

        if (key.length < 32) {
            // Pad key to 32 bytes if shorter
            processedKey = key.padEnd(32, '0');
        } else if (key.length > 32) {
            // Truncate key to 32 bytes if longer
            processedKey = key.substring(0, 32);
        }

        return Buffer.from(processedKey, 'utf-8');
    }

    encrypt(plaintext: string): string {
        if (!plaintext) {
            return "";
        }

        try {
            // Generate random 16-byte IV
            const iv = crypto.randomBytes(16);

            // Create cipher
            const cipher = crypto.createCipheriv('aes-256-cbc', this.keyBuffer, iv);

            // Encrypt data
            let encrypted = cipher.update(plaintext, 'utf8');
            encrypted = Buffer.concat([encrypted, cipher.final()]);

            // Combine IV + encrypted data and encode as base64
            const combined = Buffer.concat([iv, encrypted]);
            return combined.toString('base64');
        } catch (error) {
            throw new Error(`Failed to encrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    decrypt(encryptedData: string): string {
        if (!encryptedData) {
            return "";
        }

        try {
            // Decode base64
            const combined = Buffer.from(encryptedData, 'base64');

            // Extract IV (first 16 bytes) and encrypted data
            const iv = combined.subarray(0, 16);
            const encrypted = combined.subarray(16);

            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.keyBuffer, iv);

            // Decrypt data
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return decrypted.toString('utf8');
        } catch (error) {
            throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    encryptAWSCredentials(accessKey: string, secretKey: string, sessionToken?: string): {
        encrypted_aws_access_key: string;
        encrypted_aws_secret_key: string;
        encrypted_aws_session_token?: string;
    } {
        return {
            encrypted_aws_access_key: this.encrypt(accessKey),
            encrypted_aws_secret_key: this.encrypt(secretKey),
            encrypted_aws_session_token: sessionToken ? this.encrypt(sessionToken) : undefined,
        };
    }
}

// Create a singleton instance using the environment variable
let encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
    if (!encryptionService) {
        const encryptionKey = process.env.ENCRYPTION_KEY;
        if (!encryptionKey) {
            throw new Error('ENCRYPTION_KEY environment variable is not set');
        }
        encryptionService = new EncryptionService(encryptionKey);
    }
    return encryptionService;
}

// Utility functions for easy access
export function encryptString(plaintext: string): string {
    return getEncryptionService().encrypt(plaintext);
}

export function decryptString(encryptedData: string): string {
    return getEncryptionService().decrypt(encryptedData);
} 