"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Play,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  History,
  Download,
  Upload,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import AWSValidatorService from "@/services/aws-validator";
import { toast } from "sonner";

interface LoadedCredential {
  id: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}

interface ValidationResult extends LoadedCredential {
  status: "VALID" | "INVALID";
  arn?: string;
  account?: string;
  userId?: string;
  errorMessage?: string | null;
  responseTime: number;
}

const AWS_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "ap-south-1",
];

export default function ValidatorPage() {
  const [activeTab, setActiveTab] = useState<"bulk" | "manual" | "upload">("bulk");
  const [bulkInput, setBulkInput] = useState("");
  const [manualForm, setManualForm] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    sessionToken: "",
    region: "us-east-1",
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [credentials, setCredentials] = useState<LoadedCredential[]>([]);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "invalid">("all");
  const [sortBy, setSortBy] = useState<"status" | "responseTime">("status");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Tab: Bulk Input
  const handleBulkInput = () => {
    try {
      const lines = bulkInput.trim().split("\n").filter((line) => line.trim());
      const newCredentials: LoadedCredential[] = [];

      lines.forEach((line) => {
        const parts = line.split(",").map((part) => part.trim());
        if (parts.length >= 2) {
          newCredentials.push({
            id: generateId(),
            accessKeyId: parts[0],
            secretAccessKey: parts[1],
            sessionToken: parts[2] || undefined,
            region: parts[3] || "us-east-1",
          });
        }
      });

      if (newCredentials.length === 0) {
        toast.error("No valid credentials found in bulk input");
        return;
      }

      setCredentials([...credentials, ...newCredentials]);
      setBulkInput("");
      toast.success(`✓ Added ${newCredentials.length} credentials`);
    } catch {
      toast.error("Error parsing bulk input");
    }
  };

  // Tab: Manual Entry
  const handleManualAdd = () => {
    if (!manualForm.accessKeyId || !manualForm.secretAccessKey) {
      toast.error("Access Key ID and Secret Access Key are required");
      return;
    }

    const newCredential: LoadedCredential = {
      id: generateId(),
      accessKeyId: manualForm.accessKeyId,
      secretAccessKey: manualForm.secretAccessKey,
      sessionToken: manualForm.sessionToken || undefined,
      region: manualForm.region,
    };

    setCredentials([...credentials, newCredential]);
    setManualForm({ accessKeyId: "", secretAccessKey: "", sessionToken: "", region: "us-east-1" });
    toast.success("✓ Credential added");
  };

  // Tab: CSV Upload
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedCreds = AWSValidatorService.parseCSV(text);

      const newCredentials: LoadedCredential[] = parsedCreds.map((cred) => ({
        id: generateId(),
        accessKeyId: cred.accessKeyId,
        secretAccessKey: cred.secretAccessKey,
        sessionToken: cred.sessionToken,
        region: cred.region || "us-east-1",
      }));

      setCredentials([...credentials, ...newCredentials]);
      toast.success(`✓ Imported ${newCredentials.length} credentials`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse CSV";
      toast.error(msg);
    } finally {
      event.target.value = "";
    }
  };

  // Validate individual credential
  const handleValidateIndividual = async (credential: LoadedCredential) => {
    setValidatingId(credential.id);
    try {
      const response = await AWSValidatorService.validateCredentials({
        accessKeyId: credential.accessKeyId,
        secretAccessKey: credential.secretAccessKey,
        sessionToken: credential.sessionToken,
        region: credential.region,
      });

      const result: ValidationResult = {
        ...credential,
        status: response.isValid ? "VALID" : "INVALID",
        arn: response.arn,
        account: response.account,
        userId: response.userId,
        errorMessage: response.errorMessage,
        responseTime: response.totalResponseTime,
      };

      setResults([...results.filter((r) => r.id !== credential.id), result]);
      toast.success(`✓ ${credential.accessKeyId.substring(0, 10)}... validated`);
    } catch (err) {
      toast.error("Validation failed");
    } finally {
      setValidatingId(null);
    }
  };

  // Delete credential
  const handleDeleteCredential = (id: string) => {
    setCredentials(credentials.filter((c) => c.id !== id));
    setResults(results.filter((r) => r.id !== id));
  };

  // Clear all credentials
  const handleClearAll = () => {
    setCredentials([]);
    setResults([]);
    setSearchTerm("");
  };

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
    const filtered = results.filter((result) => {
      const matchesSearch =
        result.accessKeyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.arn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.account?.includes(searchTerm) ||
        result.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "valid" && result.status === "VALID") ||
        (filterStatus === "invalid" && result.status === "INVALID");

      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "status") {
        if (a.status === b.status) return 0;
        return a.status === "VALID" ? -1 : 1;
      } else if (sortBy === "responseTime") {
        return a.responseTime - b.responseTime;
      }
      return 0;
    });
  }, [results, searchTerm, filterStatus, sortBy]);

  // Export results
  const handleExportResults = () => {
    if (results.length === 0) {
      toast.error("No results to export");
      return;
    }

    const csv = AWSValidatorService.exportToCSV(
      results.map((r) => ({
        accessKeyId: r.accessKeyId,
        secretAccessKey: r.secretAccessKey,
        status: r.status,
        arn: r.arn,
        account: r.account,
        userId: r.userId,
        region: r.region,
        errorMessage: r.errorMessage,
        responseTime: r.responseTime,
      }))
    );

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aws-validation-results-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("✓ Results exported");
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const maskSecret = (secret: string) => {
    if (showSecrets) return secret;
    return secret.substring(0, 8) + "•".repeat(Math.max(0, secret.length - 8));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-scale-in">
        <div>
          <h1 className="text-3xl font-bold">AWS Credentials Validator</h1>
          <p className="text-muted-foreground">
            Validate AWS credentials locally in your browser. Single or bulk validation.
          </p>
        </div>
        {credentials.length > 0 && (
          <Button onClick={handleClearAll} variant="destructive" size="sm">
            Clear All ({credentials.length})
          </Button>
        )}
      </div>

      {/* Input Section */}
      <Card className="transition-theme animate-scale-in hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AWS Credentials Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "bulk"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📋 Bulk Input
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "manual"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ✏️ Manual Entry
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "upload"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📤 CSV Upload
            </button>
          </div>

          {/* Bulk Input Tab */}
          {activeTab === "bulk" && (
            <div className="space-y-3">
              <div>
                <Label>Bulk Credentials Input</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Format: ACCESS_KEY_ID,SECRET_ACCESS_KEY,SESSION_TOKEN(optional),REGION(optional)
                </p>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="AKIA...,wJalrXUtnFEMI/K7MDENG...,optional_token,us-east-1&#10;AKIA...,wJalrXUtnFEMI/K7MDENG...,,"
                  className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
                />
              </div>
              <Button onClick={handleBulkInput} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Add Credentials to Get Started
              </Button>
            </div>
          )}

          {/* Manual Entry Tab */}
          {activeTab === "manual" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="accessKeyId">Access Key ID *</Label>
                  <Input
                    id="accessKeyId"
                    placeholder="AKIA..."
                    value={manualForm.accessKeyId}
                    onChange={(e) => setManualForm({ ...manualForm, accessKeyId: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <select
                    id="region"
                    value={manualForm.region}
                    onChange={(e) => setManualForm({ ...manualForm, region: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    {AWS_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="secretAccessKey">Secret Access Key *</Label>
                <div className="relative">
                  <Input
                    id="secretAccessKey"
                    type={showSecrets ? "text" : "password"}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    value={manualForm.secretAccessKey}
                    onChange={(e) => setManualForm({ ...manualForm, secretAccessKey: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-2.5"
                  >
                    {showSecrets ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="sessionToken">Session Token (Optional)</Label>
                <Input
                  id="sessionToken"
                  type={showSecrets ? "text" : "password"}
                  placeholder="IQoJb3JpZ2luX2VjELH/..."
                  value={manualForm.sessionToken}
                  onChange={(e) => setManualForm({ ...manualForm, sessionToken: e.target.value })}
                />
              </div>
              <Button onClick={handleManualAdd} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Add Single Credential
              </Button>
            </div>
          )}

          {/* CSV Upload Tab */}
          {activeTab === "upload" && (
            <div className="space-y-3">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/40 transition">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Choose CSV File</p>
                    <p className="text-xs text-muted-foreground">
                      CSV with: accessKeyId, secretAccessKey, sessionToken (optional), region (optional)
                    </p>
                  </div>
                </label>
              </div>
              <Button
                onClick={() => {
                  const template = AWSValidatorService.generateCSVTemplate();
                  const blob = new Blob([template], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "aws-credentials-template.csv";
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loaded Credentials */}
      {credentials.length > 0 && (
        <Card className="transition-theme animate-scale-in hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🟢 Loaded Credentials ({credentials.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {credentials.map((cred) => {
                const result = results.find((r) => r.id === cred.id);
                return (
                  <div key={cred.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-3 w-3 rounded-full bg-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm truncate">{cred.accessKeyId}</p>
                      <p className="text-xs text-muted-foreground">{cred.region}</p>
                    </div>
                    {result && (
                      <Badge variant={result.status === "VALID" ? "default" : "destructive"}>
                        {result.status}
                      </Badge>
                    )}
                    <Button
                      onClick={() => handleValidateIndividual(cred)}
                      disabled={validatingId === cred.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {validatingId === cred.id ? "..." : "Validate"}
                    </Button>
                    <Button
                      onClick={() => handleDeleteCredential(cred.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {results.length > 0 && (
        <Card className="transition-theme animate-scale-in hover:shadow-md">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Validation Results</h3>
                  <p className="text-xs text-muted-foreground">
                    {results.filter((r) => r.status === "VALID").length} Valid • {results.filter((r) => r.status === "INVALID").length} Invalid
                  </p>
                </div>
              </div>
              <Button onClick={handleExportResults} size="sm" className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Controls */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by key, ARN, account..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "status" | "responseTime")}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="status">Sort by Status</option>
                  <option value="responseTime">Sort by Response Time</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | "valid" | "invalid")}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Results</option>
                  <option value="valid">Valid Only</option>
                  <option value="invalid">Invalid Only</option>
                </select>
                <Button
                  onClick={() => setShowSecrets(!showSecrets)}
                  variant="outline"
                  size="sm"
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredResults.map((result) => (
                <div key={result.id} className="border rounded-lg overflow-hidden">
                  <div
                    onClick={() => toggleRowExpansion(result.id)}
                    className="p-3 hover:bg-muted/40 cursor-pointer flex items-center gap-3"
                  >
                    {result.status === "VALID" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm truncate">{result.accessKeyId}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.region} • {result.responseTime}ms
                      </p>
                    </div>
                    <Badge variant={result.status === "VALID" ? "default" : "destructive"}>
                      {result.status}
                    </Badge>
                    {expandedRows.has(result.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedRows.has(result.id) && (
                    <div className="p-3 bg-muted/30 border-t space-y-2 text-sm">
                      {result.account && (
                        <div>
                          <span className="font-medium">Account ID:</span>
                          <p className="font-mono text-xs">{result.account}</p>
                        </div>
                      )}
                      {result.userId && (
                        <div>
                          <span className="font-medium">User ID:</span>
                          <p className="font-mono text-xs truncate">{result.userId}</p>
                        </div>
                      )}
                      {result.arn && (
                        <div>
                          <span className="font-medium">ARN:</span>
                          <p className="font-mono text-xs truncate">{result.arn}</p>
                        </div>
                      )}
                      {result.errorMessage && (
                        <div>
                          <span className="font-medium text-red-600">Error:</span>
                          <p className="text-xs text-red-600">{result.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="transition-theme animate-scale-in hover:shadow-md border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">Security & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            ✓ All validation happens entirely in your browser
          </p>
          <p className="text-sm text-muted-foreground">
            ✓ No credentials are stored or sent to our servers
          </p>
          <p className="text-sm text-muted-foreground">
            ✓ Results can be downloaded and used offline
          </p>
          <p className="text-sm text-muted-foreground">
            ✓ Never share your AWS Secret Access Key with anyone
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
