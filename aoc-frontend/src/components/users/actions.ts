// Temporarily simplified due to zod-form-data version issues
// All actions are commented out and replaced with simple exports

import { inviteUser } from "@/data/users";

export const inviteUserAction = async (data: { email: string }) => {
  return await inviteUser(data.email);
};

export const deleteUserAction = async (data: { id: string }) => {
  // This would need to be implemented in users.ts
  throw new Error("Delete user action not implemented yet");
};