'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const services = [
  'EC2',
  'S3',
  'RDS',
  'Lambda',
  'IVM',
  // Add more services as needed
]

export function ServiceSelector() {
  const [selectedService, setSelectedService] = useState(services[0])

  return (
    <div>
      <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
        Select Service
      </label>
      <Select onValueChange={setSelectedService} defaultValue={selectedService}>
        <SelectTrigger id="service">
          <SelectValue>{selectedService}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service} value={service}>
              {service}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

