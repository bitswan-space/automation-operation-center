import React from "react";

// Placeholder component for badge
export const Badge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>;
};