import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function TableSkeleton() {
  // Generate 5 columns and 5 rows for the skeleton
  const columns = Array.from({ length: 5 }, (_, i) => i);
  const rows = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-[250px]" />
        </div>

        {/* Table Skeleton */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row}>
                  {columns.map((column) => (
                    <TableCell key={`${row}-${column}`}>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
