// Temporarily simplified due to zod-form-data version issues
// All actions are commented out and replaced with simple exports

import { 
  addWorkspaceToGroup,
  removeWorkspaceFromGroup,
} from "@/data/groups";

// These actions are kept for potential future use in WorkspaceDetailSection
// Currently commented out but may be needed when workspace groups are implemented
export const addWorkspaceToGroupAction = async (data: { id: string; groupId: string }) => {
  return await addWorkspaceToGroup(data.id, data.groupId);
};

export const removeWorkspaceFromGroupAction = async (data: { id: string; groupId: string }) => {
  return await removeWorkspaceFromGroup(data.id, data.groupId);
};