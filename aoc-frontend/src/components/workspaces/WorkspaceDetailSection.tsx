import React from "react";

// Placeholder component for WorkspaceDetailSection
export const WorkspaceDetailSection: React.FC<{ workspace: any }> = ({ workspace }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Workspace Details</h2>
      {workspace ? (
        <div className="space-y-2">
          <p><strong>Name:</strong> {workspace.name}</p>
          <p><strong>ID:</strong> {workspace.id}</p>
        </div>
      ) : (
        <p>No workspace selected</p>
      )}
    </div>
  );
};
