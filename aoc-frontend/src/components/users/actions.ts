// Temporarily simplified due to zod-form-data version issues
// All actions are commented out and replaced with simple exports

import { inviteUser, deleteUser } from "@/data/users";

export const inviteUserAction = async (data: { email: string }) => {
  return await inviteUser(data.email);
};

export const deleteUserAction = async (data: { id: string }) => {
  return await deleteUser(data.id);
};