import { z } from "zod";

export const CreateGitopsSchema = z.object({
  gitopsName: z.string().min(2, {
    message: "gitopsName must be at least 2 characters.",
  }),
});

export const UpdateGitopsSchema = CreateGitopsSchema;
