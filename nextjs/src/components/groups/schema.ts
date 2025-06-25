import z from "zod";
import { zfd } from "zod-form-data";

export const CreateOrUpdateOrgGroupFormDataSchema = zfd.formData({
  id: zfd.text(z.string().optional()),
  name: zfd.text(),
  description: zfd.text(z.string().optional()),
  tag_color: zfd.text(z.string().optional()),
  nav_items: zfd.text(z.string().optional()),
});
