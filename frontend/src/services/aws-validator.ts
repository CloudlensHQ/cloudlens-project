// AWS Validator service for CloudLens frontend
// Performs validation fully in the browser (no backend storage, no permission checks)

import { AWSCredentials, ValidationResponse, ValidationResultItem, ValidationStats } from "@/types/aws-validator";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

export class AWSValidatorService {
  /**
   * Validate AWS credentials locally using AWS SDK v3 in the browser
   */
  static async validateCredentials(credentials: AWSCredentials): Promise<ValidationResponse> {
    const region = credentials.region || "us-east-1";
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    const baseClientConfig = {
      region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    } as const;

    const results: ValidationResultItem[] = [];

    try {
      // 1) Core validation: STS GetCallerIdentity
      const sts = new STSClient(baseClientConfig);
      const stsStart = typeof performance !== "undefined" ? performance.now() : Date.now();
      const caller = await sts.send(new GetCallerIdentityCommand({}));
      const stsTime = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - stsStart);
      results.push({
        service: "STS:GetCallerIdentity",
        status: "success",
        message: "Credentials are valid",
        responseTime: stsTime,
      });

      const totalResponseTime = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);

      return {
        isValid: true,
        arn: caller.Arn || undefined,
        userId: caller.UserId || undefined,
        account: caller.Account || undefined,
        errorMessage: undefined,
        results,
        totalResponseTime,
        validatedAt: new Date().toISOString(),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Validation failed";
      const totalResponseTime = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);
      return {
        isValid: false,
        arn: undefined,
        userId: undefined,
        account: undefined,
        errorMessage: msg,
        results: results.length ? results : [
          { service: "STS:GetCallerIdentity", status: "failed", message: msg },
        ],
        totalResponseTime,
        validatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate multiple credentials with progress callback
   */
  static async validateBulk(
    credentialsList: Array<AWSCredentials & { name?: string }>,
    onProgress?: (index: number, total: number, result: ValidationResponse) => void
  ): Promise<Array<ValidationResponse & { name?: string }>> {
    const results: Array<ValidationResponse & { name?: string }> = [];
    for (let i = 0; i < credentialsList.length; i++) {
      const cred = credentialsList[i];
      const result = await this.validateCredentials(cred);
      results.push({ ...result, name: cred.name });
      if (onProgress) {
        onProgress(i + 1, credentialsList.length, result);
      }
    }
    return results;
  }

  /**
   * Export validation results as CSV with comprehensive details
   */
  static exportToCSV(
    results: Array<{
      accessKeyId: string;
      secretAccessKey: string;
      status: "VALID" | "INVALID";
      arn?: string | null;
      account?: string | null;
      userId?: string | null;
      region?: string;
      errorMessage?: string | null;
      responseTime: number;
    }>
  ): string {
    const headers = [
      "Access Key ID",
      "Secret Access Key",
      "Status",
      "ARN",
      "Account",
      "User ID",
      "Region",
      "Error Message",
      "Response Time (ms)",
    ].join(",");

    const rows = results.map((r) => [
      r.accessKeyId,
      r.secretAccessKey,
      r.status,
      r.arn || "",
      r.account || "",
      r.userId || "",
      r.region || "us-east-1",
      r.errorMessage ? `"${r.errorMessage.replace(/"/g, '""')}"` : "",
      r.responseTime,
    ].join(","));

    return [headers, ...rows].join("\n");
  }

  /**
   * Parse CSV file and extract credentials
   * Expected columns: Name (optional), Access Key ID, Secret Access Key, Session Token (optional)
   */
  static parseCSV(csvText: string): Array<AWSCredentials & { name?: string }> {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV must have at least headers and one data row");

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const accessKeyIdx = headers.findIndex((h) => h.includes("access key"));
    const secretKeyIdx = headers.findIndex((h) => h.includes("secret"));
    const sessionTokenIdx = headers.findIndex((h) => h.includes("session"));
    const nameIdx = headers.findIndex((h) => h === "name");

    if (accessKeyIdx === -1 || secretKeyIdx === -1) {
      throw new Error("CSV must include 'Access Key ID' and 'Secret Access Key' columns");
    }

    const credentials: Array<AWSCredentials & { name?: string }> = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map((c) => c.trim());
      if (cells.length < secretKeyIdx + 1 || !cells[accessKeyIdx] || !cells[secretKeyIdx]) continue;

      credentials.push({
        accessKeyId: cells[accessKeyIdx],
        secretAccessKey: cells[secretKeyIdx],
        sessionToken: sessionTokenIdx !== -1 ? cells[sessionTokenIdx] || undefined : undefined,
        name: nameIdx !== -1 ? cells[nameIdx] || undefined : undefined,
      });
    }

    if (credentials.length === 0) throw new Error("No valid credentials found in CSV");
    return credentials;
  }

  /**
   * Generate sample CSV template for bulk upload
   */
  static generateCSVTemplate(): string {
    return "Name,Access Key ID,Secret Access Key,Session Token\nProduction,AKIA...,wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY,\nStaging,AKIA...,wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY,";
  }
}

export default AWSValidatorService;
