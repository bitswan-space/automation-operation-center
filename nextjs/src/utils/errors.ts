import * as Sentry from "@sentry/nextjs";

// utils/errorHandler.js
import { env } from "@/env.mjs";

/**
 * Custom error handler that logs the error or sends it to Sentry, with the
 * option to add additional context to the error message.
 *
 * @param {Error} error The error to handle
 * @param {string} [contextMessage] Optional message providing additional context about the error
 */
export function handleError(error: Error, contextMessage = "") {
  const errorMessage = contextMessage
    ? `${contextMessage}: ${error.message}`
    : error.message;

  const errorWithContext = new Error(errorMessage);

  errorWithContext.stack = error.stack;

  if (env.NEXT_PUBLIC_NODE_ENV === "development") {
    console.error(errorWithContext);
  } else {
    Sentry.withScope((scope) => {
      scope.setExtra("originalError", {
        message: error.message,
        stack: error.stack,
      });

      if (contextMessage) {
        scope.setExtra("contextMessage", contextMessage);
      }

      Sentry.captureException(errorWithContext);
    });
  }
}
