"use server";

import { deleteUser, inviteUser } from "@/data/users";

import { AppError } from "@/lib/errors";
import { authenticatedActionClient } from "@/lib/safe-action";
import { z } from "zod";
import { zfd } from "zod-form-data";

export const inviteUserAction = authenticatedActionClient
.metadata({
    actionName: "inviteUserAction",
})
.inputSchema(zfd.formData({
    email: z.string().email(),
}))
.action(async ({ parsedInput: { email } }) => {
    const res = await inviteUser(email);
    if (res.status === "error") {
        throw new AppError({
            name: "InviteUserError",
            message: "Error inviting user",
            code: "INVITE_USER_ERROR",
        });
    }

    return {
        message: "User invited",
        status: "success",
    };
})

export const deleteUserAction = authenticatedActionClient
.metadata({
    actionName: "deleteUserAction"
})
.inputSchema(zfd.formData({
    id: z.string()
}))
.action(async ({ parsedInput: { id } }) => {
    const res = await deleteUser(id);
    if (res.status === "error") {
        throw new AppError({
            name: "DeleteUserError",
            message: "Error deleting user",
            code: "DELETE_USER_ERROR",
        });
    }

    return {
        message: "User deleted",
        status: "success",
    };
})

