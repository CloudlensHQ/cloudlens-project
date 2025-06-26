import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Server,
  Database,
  HardDrive,
  Cloud,
  Shield,
  Network,
  FunctionSquare,
  Container,
  Key,
  Mail,
  Search,
  Workflow,
  Cpu,
  BrainCircuit,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { loadServiceData } from '../service/scan-data.service';
import { Skeleton } from '@/components/ui/skeleton';

interface ServiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  region: string | null;
  timestamp: string;
  services: string[];
  isLoading?: boolean;
}

const serviceIcons: { [key: string]: any } = {
  EC2: Server,
  RDS: Database,
  S3: HardDrive,
  LAMBDA: Cloud,
  IAM: Shield,
  VPC: Network,
  ECS: Container,
  CLOUDFRONT: Cloud,
  WAF: Shield,
  KMS: Key,
  SES: Mail,
  CLOUDSEARCH: Search,
  STEPFUNCTIONS: Workflow,
  EKS: Cpu,
  SAGEMAKER: BrainCircuit,
  EBS: HardDrive,
  CLOUDTRAIL: Cloud,
  CONFIG: Shield,
  GUARDDUTY: Shield,
};

function ServiceCardSkeleton() {
  return (
    <div className="h-auto p-4 rounded-md border border-border">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <div className="flex justify-between items-center w-full">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-6 w-[120px]" />
        </div>
      </div>
    </div>
  );
}

export function ServiceDrawer({
  isOpen,
  onClose,
  region,
  timestamp,
  services,
  isLoading = false,
}: ServiceDrawerProps) {
  const [serviceData, setServiceData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (isOpen && region && timestamp && !isLoading) {
      // Load data for each service
      Promise.all(
        services.map(async (service) => {
          const data = await loadServiceData(timestamp, region, service);
          return { service, data };
        })
      ).then((results) => {
        const newData: { [key: string]: any } = {};
        results.forEach(({ service, data }) => {
          newData[service] = data;
        });
        setServiceData(newData);
      });
    }
  }, [isOpen, region, timestamp, services, isLoading]);

  const getResourceCount = (service: string, data: any) => {
    if (!data) return 0;

    // Service-specific data mapping
    const serviceDataMap: { [key: string]: string } = {
      EC2: 'EC2Instances',
      S3: 'Buckets',
      LAMBDA: 'Functions',
      IAM: 'Users',
      KMS: 'Keys',
      EBS: 'Volumes',
      CLOUDTRAIL: 'Trails',
      RDS: 'DBInstances',
      VPC: 'VPCs',
      GUARDDUTY: 'Findings',
      CONFIG: 'Rules',
    };

    // Try to get data using the service map
    const key = serviceDataMap[service] || Object.keys(data)[0];
    if (key && Array.isArray(data[key])) {
      return data[key].length;
    }

    // If not found in map, try to find the first array in the data
    const firstArrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
    if (firstArrayKey) {
      return data[firstArrayKey].length;
    }

    // If data itself is an array
    if (Array.isArray(data)) {
      return data.length;
    }

    // If it's an object with properties
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }

    return 0;
  };

  const getResourceLabel = (service: string, data: any) => {
    if (!data) return 'Resources';

    const serviceLabels: { [key: string]: string } = {
      EC2: 'Instances',
      S3: 'Buckets',
      LAMBDA: 'Functions',
      IAM: 'Users',
      KMS: 'Keys',
      EBS: 'Volumes',
      CLOUDTRAIL: 'Trails',
      RDS: 'DB Instances',
      VPC: 'VPCs',
      GUARDDUTY: 'Findings',
      CONFIG: 'Rules',
    };

    return serviceLabels[service] || 'Resources';
  };

  // Generate skeleton items for loading state
  const skeletonItems = Array.from({ length: 8 }, (_, i) => (
    <ServiceCardSkeleton key={i} />
  ));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-sm font-medium">
            {isLoading ? (
              <Skeleton className="h-5 w-[150px]" />
            ) : (
              `Services in ${region}`
            )}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-70px)]">
          <div className="grid grid-cols-1 gap-2">
            {isLoading
              ? skeletonItems
              : services.map((service) => {
                  const Icon = serviceIcons[service] || Cloud;
                  const resourceCount = getResourceCount(
                    service,
                    serviceData[service]
                  );
                  const resourceLabel = getResourceLabel(
                    service,
                    serviceData[service]
                  );

                  return (
                    <Button
                      key={service}
                      variant="outline"
                      className="h-auto p-4 justify-start"
                      asChild
                    >
                      <Link
                        href={`/scans/service/${service.toLowerCase()}?region=${region}&timestamp=${timestamp}`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <div className="text-left flex justify-between items-center w-full">
                          <div className="font-medium text-xs">{service}</div>
                          <div className="text-sm">
                            <Badge
                              variant="secondary"
                              className="mt-1 border-border bg-transparent"
                            >
                              {resourceLabel}: {resourceCount}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    </Button>
                  );
                })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
