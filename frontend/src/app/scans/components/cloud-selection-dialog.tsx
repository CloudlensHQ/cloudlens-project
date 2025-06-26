'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CloudSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (credentials: {
    cloudProvider: string;
    accessKey: string;
    secretKey: string;
    scanName: string;
  }) => void;
}

export function CloudSelectionDialog({
  isOpen,
  onClose,
  onSubmit,
}: CloudSelectionDialogProps) {
  const [cloudProvider, setCloudProvider] = useState('aws');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [scanName, setScanName] = useState('');

  const handleSubmit = () => {
    onSubmit({
      cloudProvider,
      accessKey,
      secretKey,
      scanName,
    });
    setAccessKey('');
    setSecretKey('');
    setScanName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cloud Provider Selection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Scan Name</label>
            <Input
              type="text"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
              placeholder="Enter scan name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Cloud Provider</label>
            <Select value={cloudProvider} onValueChange={setCloudProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aws">AWS</SelectItem>
                <SelectItem value="gcp" disabled>
                  GCP (Coming Soon)
                </SelectItem>
                <SelectItem value="azure" disabled>
                  Azure (Coming Soon)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {cloudProvider === 'aws' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">AWS Access Key</label>
                <Input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter AWS Access Key"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">AWS Secret Key</label>
                <Input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter AWS Secret Key"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-white font-medium w-[100px]"
            onClick={handleSubmit}
            disabled={!accessKey || !secretKey || !scanName}
          >
            Start Scan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
