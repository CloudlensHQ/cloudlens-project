"use client";

import { useState } from "react";
import {
  Shield,
  Server,
  Database,
  Key,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Tag,
  Lock,
  Unlock,
  RotateCw,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  ServiceScanResult,
  SecurityGroup,
  EC2Instance,
  EBSVolume,
  S3Bucket,
  KMSKey,
} from "@/hooks/queries/useScanDetails";

interface ScanServiceResultsProps {
  serviceScanResults: ServiceScanResult[];
  cloudProvider: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SecurityGroupsResults = ({
  data,
  region,
}: {
  data: SecurityGroup[];
  region: string;
}) => {
  if (!data || data.length === 0) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          No security groups found in {region}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((sg) => (
        <Card key={sg.GroupId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {sg.GroupName}
                </CardTitle>
                <CardDescription>{sg.Description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{sg.GroupId}</Badge>
                {sg.RiskyInboundRules.length > 0 && (
                  <Badge variant="destructive">
                    {sg.RiskyInboundRules.length} Risky Rules
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {sg.InboundRuleCount}
                </p>
                <p className="text-sm text-muted-foreground">Inbound Rules</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {sg.OutboundRuleCount}
                </p>
                <p className="text-sm text-muted-foreground">Outbound Rules</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">VPC</p>
                <p className="font-mono text-sm">{sg.VpcId}</p>
              </div>
            </div>

            {sg.RiskyInboundRules.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risky Inbound Rules
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Port Range</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sg.RiskyInboundRules.map((rule, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {rule.source}
                        </TableCell>
                        <TableCell>{rule.protocol.toUpperCase()}</TableCell>
                        <TableCell>{rule.port_range}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const EC2Results = ({
  data,
  region,
}: {
  data: EC2Instance[];
  region: string;
}) => {
  if (!data || data.length === 0) {
    return (
      <Alert>
        <Server className="h-4 w-4" />
        <AlertDescription>No EC2 instances found in {region}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((instance) => (
        <Card key={instance.InstanceId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {instance.InstanceName}
                </CardTitle>
                <CardDescription className="font-mono">
                  {instance.InstanceId}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={
                    instance.State === "running" ? "default" : "secondary"
                  }
                >
                  {instance.State}
                </Badge>
                <Badge
                  variant={
                    instance.IMDSVersion === "IMDSv2"
                      ? "default"
                      : "destructive"
                  }
                >
                  {instance.IMDSVersion}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Public IP</p>
                <p className="font-mono">{instance.PublicIpAddress}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Private IP</p>
                <p className="font-mono">{instance.PrivateIpAddress}</p>
              </div>
            </div>
            {instance.IMDSVersion === "IMDSv1" && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This instance is using IMDSv1, which is less secure. Consider
                  upgrading to IMDSv2.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const EBSResults = ({
  data,
  region,
}: {
  data: EBSVolume[];
  region: string;
}) => {
  if (!data || data.length === 0) {
    return (
      <Alert>
        <HardDrive className="h-4 w-4" />
        <AlertDescription>No EBS volumes found in {region}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((volume) => (
        <Card key={volume.VolumeId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  {volume.VolumeName}
                </CardTitle>
                <CardDescription className="font-mono">
                  {volume.VolumeId}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={volume.State === "in-use" ? "default" : "secondary"}
                >
                  {volume.State}
                </Badge>
                <Badge variant={volume.Encrypted ? "default" : "destructive"}>
                  {volume.Encrypted ? (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Encrypted
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3 mr-1" />
                      Unencrypted
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-semibold">{volume.Size} GB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(volume.CreateTime)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attached To</p>
                <p className="font-mono text-sm">
                  {volume.AttachedInstanceId || "Not attached"}
                </p>
              </div>
            </div>
            {!volume.Encrypted && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This EBS volume is not encrypted. Consider enabling encryption
                  for better security.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const S3Results = ({ data, region }: { data: S3Bucket[]; region: string }) => {
  if (!data || data.length === 0) {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>No S3 buckets found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((bucket) => (
        <Card key={bucket.BucketName}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {bucket.BucketName}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {bucket.Region}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={bucket.EncryptionEnabled ? "default" : "destructive"}
                >
                  {bucket.EncryptionEnabled ? "Encrypted" : "Unencrypted"}
                </Badge>
                <Badge
                  variant={bucket.VersioningEnabled ? "default" : "secondary"}
                >
                  {bucket.VersioningEnabled ? "Versioned" : "No Versioning"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(bucket.CreationDate)}</p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">
                  Public Access Block Configuration
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    {bucket.PublicAccessBlockConfiguration.BlockPublicAcls ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Block Public ACLs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {bucket.PublicAccessBlockConfiguration.IgnorePublicAcls ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Ignore Public ACLs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {bucket.PublicAccessBlockConfiguration.BlockPublicPolicy ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Block Public Policy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {bucket.PublicAccessBlockConfiguration
                      .RestrictPublicBuckets ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">Restrict Public Buckets</span>
                  </div>
                </div>
              </div>

              {(!bucket.PublicAccessBlockConfiguration.BlockPublicAcls ||
                !bucket.PublicAccessBlockConfiguration.IgnorePublicAcls ||
                !bucket.PublicAccessBlockConfiguration.BlockPublicPolicy ||
                !bucket.PublicAccessBlockConfiguration
                  .RestrictPublicBuckets) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This S3 bucket may allow public access. Review the public
                    access block configuration.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const KMSResults = ({ data, region }: { data: KMSKey[]; region: string }) => {
  if (!data || data.length === 0) {
    return (
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>No KMS keys found in {region}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((key) => (
        <Card key={key.KeyId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  KMS Key
                </CardTitle>
                <CardDescription className="font-mono">
                  {key.KeyId}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={key.KeyState === "Enabled" ? "default" : "secondary"}
                >
                  {key.KeyState}
                </Badge>
                <Badge
                  variant={key.RotationEnabled ? "default" : "destructive"}
                >
                  {key.RotationEnabled ? (
                    <>
                      <RotateCw className="h-3 w-3 mr-1" />
                      Rotation Enabled
                    </>
                  ) : (
                    <>Rotation Disabled</>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Key ARN</p>
                <p className="font-mono text-sm break-all">{key.KeyArn}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Origin</p>
                  <p className="text-sm">{key.Origin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usage</p>
                  <p className="text-sm">{key.KeyUsage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(key.CreationDate)}</p>
                </div>
              </div>
              {!key.RotationEnabled && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Key rotation is disabled. Consider enabling automatic key
                    rotation for better security.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Analytics calculation helper functions
const calculateServiceAnalytics = (serviceScanResults: ServiceScanResult[]) => {
  const analytics = {
    totalServices: serviceScanResults.length,
    ec2: { total: 0, running: 0, stopped: 0, imdsv1: 0, imdsv2: 0 },
    ebs: { total: 0, encrypted: 0, unencrypted: 0, inUse: 0, available: 0 },
    s3: { total: 0, encrypted: 0, versioned: 0, publicAccess: 0 },
    securityGroups: { total: 0, withRiskyRules: 0, totalRiskyRules: 0 },
    kms: { total: 0, enabled: 0, rotationEnabled: 0, rotationDisabled: 0 },
    rds: { total: 0 },
  };

  serviceScanResults.forEach((result) => {
    const data = result.service_scan_data;

    if (data.EC2Instances) {
      analytics.ec2.total += data.EC2Instances.length;
      data.EC2Instances.forEach((instance) => {
        if (instance.State === "running") analytics.ec2.running++;
        if (instance.State === "stopped") analytics.ec2.stopped++;
        if (instance.IMDSVersion === "IMDSv1") analytics.ec2.imdsv1++;
        if (instance.IMDSVersion === "IMDSv2") analytics.ec2.imdsv2++;
      });
    }

    if (data.EBSVolumes) {
      analytics.ebs.total += data.EBSVolumes.length;
      data.EBSVolumes.forEach((volume) => {
        if (volume.Encrypted) analytics.ebs.encrypted++;
        else analytics.ebs.unencrypted++;
        if (volume.State === "in-use") analytics.ebs.inUse++;
        if (volume.State === "available") analytics.ebs.available++;
      });
    }

    if (data.S3Buckets) {
      analytics.s3.total += data.S3Buckets.length;
      data.S3Buckets.forEach((bucket) => {
        if (bucket.EncryptionEnabled) analytics.s3.encrypted++;
        if (bucket.VersioningEnabled) analytics.s3.versioned++;
        if (
          !bucket.PublicAccessBlockConfiguration.BlockPublicAcls ||
          !bucket.PublicAccessBlockConfiguration.IgnorePublicAcls ||
          !bucket.PublicAccessBlockConfiguration.BlockPublicPolicy ||
          !bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets
        ) {
          analytics.s3.publicAccess++;
        }
      });
    }

    if (data.SecurityGroups) {
      analytics.securityGroups.total += data.SecurityGroups.length;
      data.SecurityGroups.forEach((sg) => {
        if (sg.RiskyInboundRules.length > 0) {
          analytics.securityGroups.withRiskyRules++;
          analytics.securityGroups.totalRiskyRules +=
            sg.RiskyInboundRules.length;
        }
      });
    }

    if (data.KMSKeys) {
      analytics.kms.total += data.KMSKeys.length;
      data.KMSKeys.forEach((key) => {
        if (key.KeyState === "Enabled") analytics.kms.enabled++;
        if (key.RotationEnabled) analytics.kms.rotationEnabled++;
        else analytics.kms.rotationDisabled++;
      });
    }

    if (data.RDSDatabases) {
      analytics.rds.total += data.RDSDatabases.length;
    }
  });

  return analytics;
};

const ProgressBar = ({
  value,
  max,
  color = "bg-blue-500",
}: {
  value: number;
  max: number;
  color?: string;
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const ServiceAnalyticsCards = ({
  analytics,
}: {
  analytics: ReturnType<typeof calculateServiceAnalytics>;
}) => (
  <div className="space-y-4">
    {/* Summary Analytics */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Security Analytics
        </CardTitle>
        <CardDescription>
          Overview of security posture across all services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Encryption Status */}
          <div>
            <h4 className="text-sm font-medium mb-3">Encryption Status</h4>
            <div className="space-y-3">
              {analytics.ebs.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm">
                    <span>EBS Volumes</span>
                    <span>
                      {analytics.ebs.encrypted}/{analytics.ebs.total} encrypted
                    </span>
                  </div>
                  <ProgressBar
                    value={analytics.ebs.encrypted}
                    max={analytics.ebs.total}
                    color={
                      analytics.ebs.encrypted === analytics.ebs.total
                        ? "bg-green-500"
                        : "bg-red-500"
                    }
                  />
                </div>
              )}
              {analytics.s3.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm">
                    <span>S3 Buckets</span>
                    <span>
                      {analytics.s3.encrypted}/{analytics.s3.total} encrypted
                    </span>
                  </div>
                  <ProgressBar
                    value={analytics.s3.encrypted}
                    max={analytics.s3.total}
                    color={
                      analytics.s3.encrypted === analytics.s3.total
                        ? "bg-green-500"
                        : "bg-red-500"
                    }
                  />
                </div>
              )}
              {analytics.kms.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm">
                    <span>KMS Key Rotation</span>
                    <span>
                      {analytics.kms.rotationEnabled}/{analytics.kms.total}{" "}
                      enabled
                    </span>
                  </div>
                  <ProgressBar
                    value={analytics.kms.rotationEnabled}
                    max={analytics.kms.total}
                    color={
                      analytics.kms.rotationEnabled === analytics.kms.total
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Security Risks */}
          <div>
            <h4 className="text-sm font-medium mb-3">Security Risks</h4>
            <div className="space-y-3">
              {analytics.securityGroups.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Security Groups</span>
                    <span>
                      {analytics.securityGroups.totalRiskyRules} risky rules
                    </span>
                  </div>
                  <ProgressBar
                    value={analytics.securityGroups.totalRiskyRules}
                    max={analytics.securityGroups.total * 2}
                    color="bg-red-500"
                  />
                </div>
              )}
              {analytics.ec2.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm">
                    <span>IMDSv1 Instances</span>
                    <span>
                      {analytics.ec2.imdsv1}/{analytics.ec2.total} instances
                    </span>
                  </div>
                  <ProgressBar
                    value={analytics.ec2.imdsv1}
                    max={analytics.ec2.total}
                    color="bg-red-500"
                  />
                </div>
              )}
              {analytics.s3.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm">
                    <span>S3 Public Access</span>
                    <span>
                      {analytics.s3.publicAccess}/{analytics.s3.total} buckets
                    </span>
                  </div>
                  <ProgressBar
                    value={analytics.s3.publicAccess}
                    max={analytics.s3.total}
                    color="bg-red-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Service Breakdown Cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {analytics.ec2.total > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EC2 Instances</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.ec2.total}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                {analytics.ec2.running} Running
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {analytics.ec2.stopped} Stopped
              </Badge>
            </div>
            {analytics.ec2.imdsv1 > 0 && (
              <Badge variant="destructive" className="text-xs mt-1">
                {analytics.ec2.imdsv1} IMDSv1
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {analytics.ebs.total > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EBS Volumes</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.ebs.total}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                {analytics.ebs.encrypted} Encrypted
              </Badge>
              <Badge variant="destructive" className="text-xs">
                {analytics.ebs.unencrypted} Unencrypted
              </Badge>
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {analytics.ebs.inUse} In Use
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.s3.total > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">S3 Buckets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.s3.total}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                {analytics.s3.encrypted} Encrypted
              </Badge>
              <Badge variant="outline" className="text-xs">
                {analytics.s3.versioned} Versioned
              </Badge>
            </div>
            {analytics.s3.publicAccess > 0 && (
              <Badge variant="destructive" className="text-xs mt-1">
                {analytics.s3.publicAccess} Public Access
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {analytics.securityGroups.total > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Security Groups
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.securityGroups.total}
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {analytics.securityGroups.total -
                  analytics.securityGroups.withRiskyRules}{" "}
                Secure
              </Badge>
            </div>
            {analytics.securityGroups.withRiskyRules > 0 && (
              <Badge variant="destructive" className="text-xs mt-1">
                {analytics.securityGroups.totalRiskyRules} Risky Rules
              </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  </div>
);

export default function ScanServiceResults({
  serviceScanResults,
  cloudProvider,
}: ScanServiceResultsProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  // Calculate analytics
  const analytics = calculateServiceAnalytics(serviceScanResults);

  // Group results by service type across all regions
  const resultsByService = serviceScanResults.reduce((acc, result) => {
    if (!acc[result.service_name]) {
      acc[result.service_name] = [];
    }
    acc[result.service_name].push(result);
    return acc;
  }, {} as Record<string, ServiceScanResult[]>);

  const services = Object.keys(resultsByService);

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case "security_groups":
        return <Shield className="h-4 w-4" />;
      case "ec2":
        return <Server className="h-4 w-4" />;
      case "ebs":
        return <HardDrive className="h-4 w-4" />;
      case "s3":
        return <Database className="h-4 w-4" />;
      case "kms":
        return <Key className="h-4 w-4" />;
      case "rds":
        return <Database className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const getServiceStatusCounts = (result: ServiceScanResult) => {
    const data = result.service_scan_data;
    let statusText = "";

    if (data.EC2Instances && data.EC2Instances.length > 0) {
      const running = data.EC2Instances.filter(
        (i) => i.State === "running"
      ).length;
      const stopped = data.EC2Instances.filter(
        (i) => i.State === "stopped"
      ).length;
      statusText = `${data.EC2Instances.length} instances (${running} running, ${stopped} stopped)`;
    }

    if (data.EBSVolumes && data.EBSVolumes.length > 0) {
      const encrypted = data.EBSVolumes.filter((v) => v.Encrypted).length;
      const unencrypted = data.EBSVolumes.filter((v) => !v.Encrypted).length;
      statusText = `${data.EBSVolumes.length} volumes (${encrypted} encrypted, ${unencrypted} unencrypted)`;
    }

    if (data.S3Buckets && data.S3Buckets.length > 0) {
      const encrypted = data.S3Buckets.filter(
        (b) => b.EncryptionEnabled
      ).length;
      statusText = `${data.S3Buckets.length} buckets (${encrypted} encrypted)`;
    }

    if (data.SecurityGroups && data.SecurityGroups.length > 0) {
      const risky = data.SecurityGroups.filter(
        (sg) => sg.RiskyInboundRules.length > 0
      ).length;
      const totalRiskyRules = data.SecurityGroups.reduce(
        (sum, sg) => sum + sg.RiskyInboundRules.length,
        0
      );
      statusText = `${data.SecurityGroups.length} groups (${totalRiskyRules} risky rules)`;
    }

    if (data.KMSKeys && data.KMSKeys.length > 0) {
      const rotationEnabled = data.KMSKeys.filter(
        (k) => k.RotationEnabled
      ).length;
      statusText = `${data.KMSKeys.length} keys (${rotationEnabled} with rotation)`;
    }

    if (data.RDSDatabases) {
      statusText = `${data.RDSDatabases.length} databases`;
    }

    return statusText;
  };

  const renderServiceResults = (results: ServiceScanResult[]) => {
    if (results.length === 0) return null;

    return (
      <Accordion type="single" collapsible className="w-full">
        {results.map((result) => {
          const hasData =
            result.service_scan_data &&
            Object.keys(result.service_scan_data).some((key) => {
              const data =
                result.service_scan_data[
                  key as keyof typeof result.service_scan_data
                ];
              return Array.isArray(data) ? data.length > 0 : data;
            });

          const statusCounts = getServiceStatusCounts(result);

          return (
            <AccordionItem key={result.id} value={result.id}>
              <AccordionTrigger className="flex items-center gap-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(result.service_name)}
                    <span className="capitalize">
                      {result.service_name.replace("_", " ")}
                    </span>
                    <Badge variant="outline">{result.region}</Badge>
                    {!hasData && <Badge variant="secondary">No Data</Badge>}
                  </div>
                  {statusCounts && (
                    <span className="text-sm text-muted-foreground mr-4">
                      {statusCounts}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {result.service_scan_data.note ? (
                  <Alert>
                    <AlertDescription>
                      {result.service_scan_data.note}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {result.service_scan_data.SecurityGroups && (
                      <SecurityGroupsResults
                        data={result.service_scan_data.SecurityGroups}
                        region={result.region}
                      />
                    )}
                    {result.service_scan_data.EC2Instances && (
                      <EC2Results
                        data={result.service_scan_data.EC2Instances}
                        region={result.region}
                      />
                    )}
                    {result.service_scan_data.EBSVolumes && (
                      <EBSResults
                        data={result.service_scan_data.EBSVolumes}
                        region={result.region}
                      />
                    )}
                    {result.service_scan_data.S3Buckets && (
                      <S3Results
                        data={result.service_scan_data.S3Buckets}
                        region={result.region}
                      />
                    )}
                    {result.service_scan_data.KMSKeys && (
                      <KMSResults
                        data={result.service_scan_data.KMSKeys}
                        region={result.region}
                      />
                    )}
                    {result.service_scan_data.RDSDatabases &&
                      result.service_scan_data.RDSDatabases.length === 0 && (
                        <Alert>
                          <Database className="h-4 w-4" />
                          <AlertDescription>
                            No RDS databases found in {result.region}
                          </AlertDescription>
                        </Alert>
                      )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <ServiceAnalyticsCards analytics={analytics} />

      {/* Service Results */}
      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getServiceIcon(service)}
                {service
                  .replace("_", " ")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </CardTitle>
              <CardDescription>
                {resultsByService[service].length} result(s) in this region
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderServiceResults(resultsByService[service])}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
