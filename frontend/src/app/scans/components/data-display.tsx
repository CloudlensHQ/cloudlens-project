'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Mock data - replace this with actual API calls in a real application
const mockData = [
  { id: 1, resource: 'instance-1', status: 'Compliant', lastChecked: '2023-06-01 12:00:00' },
  { id: 2, resource: 'instance-2', status: 'Non-Compliant', lastChecked: '2023-06-01 12:05:00' },
  { id: 3, resource: 'instance-3', status: 'Compliant', lastChecked: '2023-06-01 12:10:00' },
]

export function DataDisplay() {
  const [data, setData] = useState(mockData)

  // Simulating data fetch - replace with actual data fetching logic
  useEffect(() => {
    // Fetch data based on selected timestamp, region, and service
    // For now, we're just using the mock data
    setData(mockData)
  }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Resource Compliance Status</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Resource</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Checked</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.resource}</TableCell>
              <TableCell>{item.status}</TableCell>
              <TableCell>{item.lastChecked}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

