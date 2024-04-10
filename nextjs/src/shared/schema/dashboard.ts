import { z } from "zod";

export const CreateDashboardEntrySchema = z.object({
  dashboardName: z.string().min(2, {
    message: "Dashboard name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  url: z.string().url({
    message: "URL must be a valid URL.",
  }),
});

export const UpdateDashboardEntrySchema = CreateDashboardEntrySchema;
