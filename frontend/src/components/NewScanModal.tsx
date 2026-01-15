/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useMemo, useState } from "react";
import { Cloud, Zap, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import { CloudProviderLogo } from "@/components/CloudProviderLogo";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
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
    provider: "AWS",
    available: true,
    description: "Comprehensive AWS security scanning",
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    provider: "AZURE",
    available: false,
    description: "Azure security scanning (coming soon)",
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    provider: "GCP",
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
  const [step, setStep] = useState<1 | 2>(1);
  const [showSecrets, setShowSecrets] = useState({
    secretKey: false,
    sessionToken: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setStep(2); // move forward once provider is chosen
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
      setStep(1);
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
      setStep(1);
      onOpenChange(false);
    }
  };

  const isNextDisabled = useMemo(
    () => !selectedProvider,
    [selectedProvider]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            New Scan
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 1 ? "Select cloud provider" : "Enter credentials"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs">
            {["Provider", "Credentials"].map((label, idx) => {
              const current = idx + 1;
              const active = step === current;
              const done = step > current;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center border text-xs ${
                      done
                        ? "bg-primary text-white border-primary"
                        : active
                        ? "border-primary text-primary"
                        : "border-muted-foreground/40 text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle className="h-3 w-3" /> : current}
                  </div>
                  <span className="hidden sm:inline text-xs">{label}</span>
                  {idx === 0 && <div className="w-3 h-px bg-muted hidden sm:block" />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Provider selection */}
          {step === 1 && (
            <div className="space-y-2">
              <div className="grid gap-2">
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
                    <CardContent className="p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CloudProviderLogo provider={provider.provider} size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-medium">{provider.name}</h3>
                              {!provider.available && (
                                <Badge variant="secondary" className="text-xs">Soon</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedProvider === provider.id && (
                          <div className="h-3 w-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Credentials & details */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="scanName" className="text-xs">Scan Name (Optional)</Label>
                <Input
                  id="scanName"
                  placeholder="e.g., Prod Audit"
                  value={scanConfig.scanName}
                  onChange={(e) => handleScanConfigChange("scanName", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {selectedProvider === "aws" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <Label className="text-xs font-medium">AWS Credentials</Label>
                  </div>

                  <Alert className="p-2.5">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs mt-1">
                      Use temporary, least-privilege credentials.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-2.5">
                    <div>
                      <Label htmlFor="accessKey" className="text-xs">Access Key *</Label>
                      <Input
                        id="accessKey"
                        placeholder="AKIA..."
                        value={credentials.accessKey}
                        onChange={(e) => handleCredentialChange("accessKey", e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <Label htmlFor="secretKey" className="text-xs">Secret Key *</Label>
                      <div className="relative">
                        <Input
                          id="secretKey"
                          type={showSecrets.secretKey ? "text" : "password"}
                          placeholder="••••••••••••••••"
                          value={credentials.secretKey}
                          onChange={(e) => handleCredentialChange("secretKey", e.target.value)}
                          className="h-8 text-xs font-mono pr-8"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-2"
                          onClick={() => toggleSecretVisibility("secretKey")}
                        >
                          {showSecrets.secretKey ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="sessionToken" className="text-xs">Session Token (Optional)</Label>
                      <div className="relative">
                        <Input
                          id="sessionToken"
                          type={showSecrets.sessionToken ? "text" : "password"}
                          placeholder="••••••••••••••••"
                          value={credentials.sessionToken}
                          onChange={(e) => handleCredentialChange("sessionToken", e.target.value)}
                          className="h-8 text-xs font-mono pr-8"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-2"
                          onClick={() => toggleSecretVisibility("sessionToken")}
                        >
                          {showSecrets.sessionToken ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

        <DialogFooter className="gap-2 pt-2">
          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isLoading}
              size="sm"
            >
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={isLoading} size="sm">
            Cancel
          </Button>
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={isNextDisabled || isLoading}
              size="sm"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleStartScan}
              disabled={selectedProvider !== "aws" || isLoading}
              size="sm"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5" />
                  Starting
                </>
              ) : (
                <>
                  <Cloud className="h-3 w-3 mr-1.5" />
                  Start
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
