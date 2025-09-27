import React from "react";

// Placeholder component for skeleton
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
};