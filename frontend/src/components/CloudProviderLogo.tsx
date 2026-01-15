import React from "react";
import Image from "next/image";

interface CloudProviderLogoProps {
  provider: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function CloudProviderLogo({ 
  provider, 
  size = "md",
  showLabel = false 
}: CloudProviderLogoProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32
  };

  const getLogoPath = () => {
    switch (provider?.toUpperCase()) {
      case "AWS":
        return "/assets/aws.svg";
      case "AZURE":
        return "/assets/azure.svg";
      case "GCP":
      case "GOOGLE CLOUD":
        return "/assets/gcp-google-cloud.svg";
      default:
        return null;
    }
  };

  const logoPath = getLogoPath();
  const logoSize = sizeMap[size];

  if (!logoPath) {
    return (
      <div className={`h-${logoSize} w-${logoSize} flex items-center justify-center bg-muted rounded text-xs font-semibold`}>
        {provider?.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 transition-theme motion-safe:animate-fade-in-up">
      <Image
        src={logoPath}
        alt={`${provider} logo`}
        width={logoSize}
        height={logoSize}
        className="flex-shrink-0 transition-transform duration-200 hover:scale-105"
      />
      {showLabel && (
        <span className="font-medium">{provider}</span>
      )}
    </div>
  );
}
