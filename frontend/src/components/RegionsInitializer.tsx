"use client";

import { useInitRegions } from "@/hooks/useInitRegions";

interface RegionsInitializerProps {
  cloudProvider?: string;
}

export const RegionsInitializer: React.FC<RegionsInitializerProps> = ({
  cloudProvider = "AWS",
}) => {
  // Initialize regions data on component mount
  useInitRegions(cloudProvider);

  // This component doesn't render anything, it just initializes data
  return null;
};

export default RegionsInitializer;
