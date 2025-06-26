import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DynamicServiceTableProps {
  data: any;
  serviceName: string;
}

export function DynamicServiceTable({
  data,
  serviceName,
}: DynamicServiceTableProps) {
  // Function to get the main data array based on service type
  const getServiceData = (data: any, serviceName: string): any[] => {
    if (!data) return [];

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
    const key = serviceDataMap[serviceName.toUpperCase()];
    if (key && Array.isArray(data[key])) {
      return data[key];
    }

    // If not found in map, try to find the first array in the data
    const firstArrayKey = Object.keys(data).find((key) =>
      Array.isArray(data[key])
    );
    if (firstArrayKey) {
      return data[firstArrayKey];
    }

    // If no array found, check if data itself is an array
    if (Array.isArray(data)) {
      return data;
    }

    // If data is an object, try to extract meaningful data
    if (typeof data === 'object' && data !== null) {
      // Check if any property is an array
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          return data[key];
        }
      }
      // If no arrays found, wrap the object itself
      return [data];
    }

    return [];
  };

  // Function to flatten nested objects for table display
  const flattenObject = (obj: any, prefix = ''): { [key: string]: string } => {
    return Object.keys(obj).reduce(
      (acc: { [key: string]: string }, key: string) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value === null || value === undefined) {
          acc[newKey] = 'N/A';
        } else if (
          typeof value === 'object' &&
          !Array.isArray(value) &&
          value !== null
        ) {
          // Check if the nested object is empty
          if (Object.keys(value).length === 0) {
            acc[newKey] = 'Empty';
          } else {
            Object.assign(acc, flattenObject(value, newKey));
          }
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            acc[newKey] = 'Empty';
          } else if (typeof value[0] === 'object') {
            // If array contains objects, stringify them properly
            acc[newKey] = value
              .map((item) => JSON.stringify(item, null, 2))
              .join(', ');
          } else {
            acc[newKey] = value.join(', ');
          }
        } else if (typeof value === 'boolean') {
          acc[newKey] = value.toString();
        } else {
          acc[newKey] = String(value);
        }

        return acc;
      },
      {}
    );
  };

  // Get the service data array
  const serviceData = getServiceData(data, serviceName);

  // If no data, show a message
  if (!serviceData.length) {
    return (
      <div className="text-center p-4">No data available for this service</div>
    );
  }

  // Get flattened data for the first row to determine columns
  const firstRow = flattenObject(serviceData[0]);
  const columns = Object.keys(firstRow);

  // Sort columns to group related fields together
  columns.sort((a, b) => {
    const aParts = a.split('.');
    const bParts = b.split('.');
    // Compare first parts first
    if (aParts[0] !== bParts[0]) {
      return aParts[0].localeCompare(bParts[0]);
    }
    // If first parts are same, compare full paths
    return a.localeCompare(b);
  });

  // Prepare all rows with flattened data
  const rows = serviceData.map((item) => flattenObject(item));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-secondary-background">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="px-3 whitespace-nowrap">
                {column.split('.').map((part, i, arr) => (
                  <span
                    key={i}
                    className={
                      i === arr.length - 1
                        ? 'font-semibold'
                        : 'text-muted-foreground'
                    }
                  >
                    {part}
                    {i < arr.length - 1 ? ' › ' : ''}
                  </span>
                ))}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell key={column} className="px-3">
                  {row[column]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
