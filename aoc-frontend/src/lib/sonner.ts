import React from "react";

// Placeholder component for sonner toast
export const toast = {
  loading: (message: string) => console.log(`Loading: ${message}`),
  success: (message: string) => console.log(`Success: ${message}`),
  error: (message: string) => console.log(`Error: ${message}`),
};
