"use client";

import * as Sentry from "@sentry/nextjs";

import type Error from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen w-screen items-center justify-center">
          <h1 className="py-2 text-2xl font-bold text-neutral-950">
            Oops, something went wrong!
          </h1>
          <p className="text-neutral-500">
            We&apos;re sorry, but an unexpected error occurred. Please try again
            later.
          </p>
        </div>
      </body>
    </html>
  );
}
