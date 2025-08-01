"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Region {
  id: string;
  name: string;
  cloud_provider: string;
  created_at: string;
  updated_at: string;
}

interface RegionsContextType {
  regions: Region[];
  setRegions: (regions: Region[]) => void;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  getRegionsByProvider: (provider: string) => Region[];
  getRegionById: (id: string) => Region | undefined;
  getRegionByName: (name: string, provider?: string) => Region | undefined;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const RegionsContext = createContext<RegionsContextType | undefined>(undefined);

export const useRegions = () => {
  const context = useContext(RegionsContext);
  if (!context) {
    throw new Error("useRegions must be used within a RegionsProvider");
  }
  return context;
};

interface RegionsProviderProps {
  children: React.ReactNode;
  initialProvider?: string;
}

export const RegionsProvider: React.FC<RegionsProviderProps> = ({
  children,
  initialProvider = "AWS",
}) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<string>(initialProvider);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getRegionsByProvider = useCallback(
    (provider: string): Region[] => {
      return regions.filter(
        (region) =>
          region.cloud_provider.toLowerCase() === provider.toLowerCase()
      );
    },
    [regions]
  );

  const getRegionById = useCallback(
    (id: string): Region | undefined => {
      return regions.find((region) => region.id === id);
    },
    [regions]
  );

  const getRegionByName = useCallback(
    (name: string, provider?: string): Region | undefined => {
      return regions.find((region) => {
        const nameMatch = region.name.toLowerCase() === name.toLowerCase();
        if (provider) {
          return (
            nameMatch &&
            region.cloud_provider.toLowerCase() === provider.toLowerCase()
          );
        }
        return nameMatch;
      });
    },
    [regions]
  );

  const value: RegionsContextType = {
    regions,
    setRegions,
    selectedProvider,
    setSelectedProvider,
    getRegionsByProvider,
    getRegionById,
    getRegionByName,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return (
    <RegionsContext.Provider value={value}>{children}</RegionsContext.Provider>
  );
};

export default RegionsProvider;
