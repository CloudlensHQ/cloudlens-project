// AWS Credentials and Validation types for CloudLens
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region?: string;
}

export interface ValidationResultItem {
  service: string;
  status: "success" | "failed" | "pending";
  message: string;
  timestamp?: string;
  details?: Record<string, unknown>;
  responseTime?: number;
}

export interface ValidationResponse {
  isValid: boolean;
  arn?: string;
  userId?: string;
  account?: string;
  errorMessage?: string;
  results: ValidationResultItem[];
  totalResponseTime: number;
  validatedAt: string;
}

export interface ValidationStats {
  total: number;
  successful: number;
  failed: number;
  averageResponseTime: number;
}
