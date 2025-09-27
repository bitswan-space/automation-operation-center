import React from "react";

// Placeholder component for dropdown menu
export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

export const DropdownMenuTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

export const DropdownMenuContent: React.FC<{ className?: string; side?: string; align?: string; sideOffset?: number; children: React.ReactNode }> = ({ children }) => {
  return <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">{children}</div>;
};

export const DropdownMenuItem: React.FC<{ className?: string; onClick?: () => void; children: React.ReactNode }> = ({ children, onClick }) => {
  return <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={onClick}>{children}</div>;
};

export const DropdownMenuLabel: React.FC<{ className?: string; children: React.ReactNode }> = ({ children }) => {
  return <div className="block px-4 py-2 text-sm font-medium text-gray-900">{children}</div>;
};

export const DropdownMenuSeparator: React.FC = () => {
  return <div className="border-t border-gray-100" />;
};

export const DropdownMenuGroup: React.FC<{ className?: string; children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};