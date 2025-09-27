import React from "react";

// Placeholder component for AutomationServerDetailSection
export const AutomationServerDetailSection: React.FC<{ server: any; groupsList: any[] }> = ({ server, groupsList }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Automation Server Details</h2>
      {server ? (
        <div className="space-y-2">
          <p><strong>Name:</strong> {server.name}</p>
          <p><strong>ID:</strong> {server.automation_server_id}</p>
          <p><strong>Workspaces:</strong> {server.workspaces?.length ?? 0}</p>
        </div>
      ) : (
        <p>No server selected</p>
      )}
    </div>
  );
};