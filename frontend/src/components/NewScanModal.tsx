"use client";

import { useState } from "react";
import { Cloud, Zap, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface NewScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanCreated?: () => void;
}

interface AWSCredentials {
  accessKey: string;
  secretKey: string;
  sessionToken: string;
}

interface ScanConfig {
  scanName: string;
}

const CloudProviders = [
  {
    id: "aws",
    name: "Amazon Web Services",
    icon: "☁️",
    available: true,
    description: "Comprehensive AWS security scanning",
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    icon: "🔷",
    available: false,
    description: "Azure security scanning (coming soon)",
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    icon: "🟡",
    available: false,
    description: "GCP security scanning (coming soon)",
  },
];

export default function NewScanModal({
  open,
  onOpenChange,
  onScanCreated,
}: NewScanModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [credentials, setCredentials] = useState<AWSCredentials>({
    accessKey: "",
    secretKey: "",
    sessionToken: "",
  });
  const [scanConfig, setScanConfig] = useState<ScanConfig>({
    scanName: "",
  });
  const [showSecrets, setShowSecrets] = useState({
    secretKey: false,
    sessionToken: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setError("");
  };

  const handleCredentialChange = (
    field: keyof AWSCredentials,
    value: string
  ) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleScanConfigChange = (field: keyof ScanConfig, value: string) => {
    setScanConfig((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const toggleSecretVisibility = (field: "secretKey" | "sessionToken") => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateCredentials = (): boolean => {
    if (!credentials.accessKey.trim()) {
      setError("AWS Access Key is required");
      return false;
    }
    if (!credentials.secretKey.trim()) {
      setError("AWS Secret Key is required");
      return false;
    }
    return true;
  };

  const handleStartScan = async () => {
    if (!validateCredentials()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/scans/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "cloudlens_access_token"
          )}`,
        },
        body: JSON.stringify({
          provider: selectedProvider,
          credentials: {
            aws_access_key: credentials.accessKey,
            aws_secret_key: credentials.secretKey,
            aws_session_token: credentials.sessionToken || undefined,
          },
          scan_name: scanConfig.scanName || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start scan");
      }

      const result = await response.json();

      // Reset form
      setSelectedProvider("");
      setCredentials({ accessKey: "", secretKey: "", sessionToken: "" });
      setScanConfig({ scanName: "" });
      onOpenChange(false);

      // Notify parent component
      if (onScanCreated) {
        onScanCreated();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedProvider("");
      setCredentials({ accessKey: "", secretKey: "", sessionToken: "" });
      setScanConfig({ scanName: "" });
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            New Cloud Security Scan
          </DialogTitle>
          <DialogDescription>
            Select a cloud provider and configure your credentials to start a
            comprehensive security scan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cloud Provider Selection */}
          <div>
            <Label className="text-base font-medium">
              Select Cloud Provider
            </Label>
            <div className="grid gap-3 mt-3">
              {CloudProviders.map((provider) => (
                <Card
                  key={provider.id}
                  className={`cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? "ring-2 ring-primary border-primary"
                      : provider.available
                      ? "hover:border-primary/50"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() =>
                    provider.available && handleProviderSelect(provider.id)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{provider.name}</h3>
                            {provider.available ? (
                              <Badge variant="default">Available</Badge>
                            ) : (
                              <Badge variant="secondary">Coming Soon</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {provider.description}
                          </p>
                        </div>
                      </div>
                      {selectedProvider === provider.id && (
                        <div className="h-4 w-4 rounded-full bg-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Scan Configuration */}
          {selectedProvider && (
            <div className="space-y-4">
              <Separator />

              <div>
                <Label className="text-base font-medium">
                  Scan Configuration
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure your scan settings and preferences.
                </p>
              </div>

              <div>
                <Label htmlFor="scanName">Scan Name (Optional)</Label>
                <Input
                  id="scanName"
                  placeholder="e.g., Production AWS Security Audit"
                  value={scanConfig.scanName}
                  onChange={(e) =>
                    handleScanConfigChange("scanName", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give your scan a meaningful name to help identify it later
                </p>
              </div>
            </div>
          )}

          {/* AWS Credentials Form */}
          {selectedProvider === "aws" && (
            <div className="space-y-4">
              <Separator />

              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  AWS Credentials
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Your credentials are encrypted and securely transmitted to our
                  servers.
                </p>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ensure your AWS credentials have the necessary permissions for
                  security scanning. We recommend using temporary credentials
                  with minimal required permissions.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="accessKey">AWS Access Key ID *</Label>
                  <Input
                    id="accessKey"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={credentials.accessKey}
                    onChange={(e) =>
                      handleCredentialChange("accessKey", e.target.value)
                    }
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="secretKey">AWS Secret Access Key *</Label>
                  <div className="relative">
                    <Input
                      id="secretKey"
                      type={showSecrets.secretKey ? "text" : "password"}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      value={credentials.secretKey}
                      onChange={(e) =>
                        handleCredentialChange("secretKey", e.target.value)
                      }
                      className="font-mono pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleSecretVisibility("secretKey")}
                    >
                      {showSecrets.secretKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sessionToken">Session Token (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="sessionToken"
                      type={showSecrets.sessionToken ? "text" : "password"}
                      placeholder="Temporary session token for assumed roles"
                      value={credentials.sessionToken}
                      onChange={(e) =>
                        handleCredentialChange("sessionToken", e.target.value)
                      }
                      className="font-mono pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleSecretVisibility("sessionToken")}
                    >
                      {showSecrets.sessionToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required only when using temporary credentials or assumed
                    roles
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleStartScan}
            disabled={
              !selectedProvider || selectedProvider !== "aws" || isLoading
            }
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Starting...
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 mr-2" />
                Start Scan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
