'use client';

import { useSearchParams } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { loadServiceData } from '../../service/scan-data.service';
import { DynamicServiceTable } from '../../components/dynamic-service-table';
import { TableSkeleton } from '../../components/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

interface ServicePageProps {
  params: Promise<{ name: string }>;
}

export default function ServicePage({ params }: ServicePageProps) {
  const { name } = use(params);
  const searchParams = useSearchParams();
  const region = searchParams.get('region');
  const timestamp = searchParams.get('timestamp');
  const [serviceData, setServiceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (region && timestamp) {
      setIsLoading(true);
      loadServiceData(timestamp, region, name)
        .then((data) => {
          setServiceData(data);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [region, timestamp, name]);

  return (
    <div className="space-y-4 w-full">
      <Breadcrumb className="px-3 py-3 border-b border-border">
        <BreadcrumbItem>
          <BreadcrumbLink href="/scans">Scans</BreadcrumbLink>/
          <BreadcrumbPage className="text-sm font-medium text-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-[100px] inline-block" />
            ) : (
              `${name.toUpperCase()} Resources`
            )}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>
      <div className="text-sm flex justify-start gap-2 items-center px-3">
        <div className="flex justify-start gap-2 items-center">
          <Badge variant="outline" className="text-xs px-2 py-1">
            {isLoading ? (
              <Skeleton className="h-4 w-[80px]" />
            ) : (
              `Region: ${region}`
            )}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-1">
            {isLoading ? (
              <Skeleton className="h-4 w-[120px]" />
            ) : (
              `Timestamp: ${timestamp}`
            )}
          </Badge>
        </div>
      </div>

      <div className="px-3">
        {isLoading ? (
          <TableSkeleton />
        ) : serviceData ? (
          <DynamicServiceTable data={serviceData} serviceName={name} />
        ) : (
          <div className="text-center p-4">
            No data available for this service
          </div>
        )}
      </div>
    </div>
  );
}
