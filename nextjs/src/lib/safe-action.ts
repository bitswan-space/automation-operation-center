import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";

import { AppError } from "./errors";
import { auth } from "@/server/auth";
import { z } from "zod";

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  handleServerError(error, { clientInput }) {
    // Log to console.
    console.error("[Action error: ]", error.message);
    console.error("[Cause: ]", error.cause);

    if (error instanceof AppError) {
      return {
        message: error.message,
        input: clientInput,
        name: error.name,
        code: error.code,
      };
    }

    return {
      message: DEFAULT_SERVER_ERROR_MESSAGE,
      input: clientInput,
      name: "InternalError",
      code: "INTERNAL_ERROR",
    };
  },
}).use(async ({ next, clientInput, metadata }) => {
  console.log("LOGGING MIDDLEWARE");

  const startTime = performance.now();

  // Here we await the action execution.
  const result = await next();

  const endTime = performance.now();

  console.log("Result ->", result);
  console.log("Client input ->", clientInput);
  console.log("Metadata ->", metadata);
  console.log("Action execution took", endTime - startTime, "ms");

  return result;
});

export const authenticatedActionClient = actionClient.use(async ({ next }) => {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  return next({ ctx: { session } });
});
