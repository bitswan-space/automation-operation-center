import z from "zod";

// Temporarily simplified due to zod-form-data version issues
export const CreateOrUpdateOrgGroupFormDataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  tag_color: z.string().optional(),
  nav_items: z.string().optional(),
});