import { z } from "zod";

export const CreateMQTTBrokerSchema = z.object({
  name: z.string().min(2, {
    message: "MQTTBroker name must be at least 2 characters.",
  }),
  url: z.string().url({
    message: "URL must be a valid URL.",
  }),
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(2, {
    message: "Password must be at least 2 characters.",
  }),
});

export const UpdateMQTTBrokerSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "MQTTBroker name must be at least 2 characters.",
    })
    .optional(),
  url: z
    .string()
    .url({
      message: "URL must be a valid URL.",
    })
    .optional(),
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .optional(),
  password: z
    .string()
    .min(2, {
      message: "Password must be at least 2 characters.",
    })
    .optional(),
  active: z.boolean().optional(),
  id: z.string(),
});
