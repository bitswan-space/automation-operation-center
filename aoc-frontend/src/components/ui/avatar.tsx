import React from "react";

// Placeholder component for avatar
export const Avatar: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  return <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>{children}</div>;
};

export const AvatarImage: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  return <img className="aspect-square h-full w-full" src={src} alt={alt} />;
};

export const AvatarFallback: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => {
  return <div className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className}`}>{children}</div>;
};