// Placeholder for safe-action
export const authenticatedActionClient = {
  metadata: (metadata: any) => ({
    inputSchema: (schema: any) => ({
      action: (fn: any) => fn,
    }),
  }),
};