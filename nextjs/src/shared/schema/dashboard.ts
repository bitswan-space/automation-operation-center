import { z } from "zod";

const MAX_UPLOAD_SIZE = 1024 * 1024 * 3; // 3MB
const ACCEPTED_FILE_TYPES = ["image/png"];

export const CreateDashboardEntrySchema = z.object({
  dashboardName: z.string().min(2, {
    message: "Dashboard name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  url: z.string().url({
    message: "URL must be a valid URL.",
  }),
  image: z
    .instanceof(File)
    .optional()
    .refine((file) => {
      return !file || file.size <= MAX_UPLOAD_SIZE;
    }, "File size must be less than 3MB")
    .refine((file) => {
      if (file === null || file === undefined) return true;

      return ACCEPTED_FILE_TYPES.includes(file?.type ?? "");
    }, "File must be a PNG"),
});

export const UpdateDashboardEntrySchema = CreateDashboardEntrySchema;
