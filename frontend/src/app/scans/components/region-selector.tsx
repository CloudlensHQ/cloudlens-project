'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const regions = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'ap-southeast-1',
  // Add more regions as needed
]

export function RegionSelector() {
  const [selectedRegion, setSelectedRegion] = useState(regions[0])

  return (
    <div>
      <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
        Select Region
      </label>
      <Select onValueChange={setSelectedRegion} defaultValue={selectedRegion}>
        <SelectTrigger id="region">
          <SelectValue>{selectedRegion}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {regions.map((region) => (
            <SelectItem key={region} value={region}>
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

