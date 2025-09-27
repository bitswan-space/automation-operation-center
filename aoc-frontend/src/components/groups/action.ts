// Temporarily simplified due to zod-form-data version issues
// All actions are commented out and replaced with simple exports

import { 
  deleteOrgGroup, 
  addUserToGroup, 
  removeUserFromGroup,
  addWorkspaceToGroup,
  removeWorkspaceFromGroup,
  addAutomationServerToGroup,
  removeAutomationServerFromGroup,
  createOrgGroup,
  updateOrgGroup
} from "@/data/groups";

export const deleteOrgGroupAction = async (data: { id: string }) => {
  return await deleteOrgGroup(data.id);
};

export const addUserToGroupAction = async (data: { id: string; groupId: string }) => {
  return await addUserToGroup(data.id, data.groupId);
};

export const removeUserFromGroupAction = async (data: { id: string; groupId: string }) => {
  return await removeUserFromGroup(data.id, data.groupId);
};

export const addWorkspaceToGroupAction = async (data: { id: string; groupId: string }) => {
  return await addWorkspaceToGroup(data.id, data.groupId);
};

export const removeWorkspaceFromGroupAction = async (data: { id: string; groupId: string }) => {
  return await removeWorkspaceFromGroup(data.id, data.groupId);
};

export const addAutomationServerToGroupAction = async (data: { id: string; groupId: string }) => {
  return await addAutomationServerToGroup(data.id, data.groupId);
};

export const removeAutomationServerFromGroupAction = async (data: { id: string; groupId: string }) => {
  return await removeAutomationServerFromGroup(data.id, data.groupId);
};

export const createOrUpdateOrgGroupAction = async (data: any) => {
  if (data.id) {
    return await updateOrgGroup(data);
  } else {
    return await createOrgGroup(data);
  }
};

export type AddUserToGroupActionType = any;
export type RemoveUserFromGroupActionType = any;
export type AddWorkspaceToGroupActionType = any;
export type RemoveWorkspaceFromGroupActionType = any;
export type AddAutomationServerToGroupActionType = any;
export type RemoveAutomationServerFromGroupActionType = any;