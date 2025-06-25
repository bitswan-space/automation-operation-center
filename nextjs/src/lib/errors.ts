export function tryCatch<T, E = Error>(fn: () => T) {
  type Result<TResult, EResult> =
    | { data: TResult; error: null }
    | { data: null; error: EResult };
  type ReturnType =
    T extends Promise<infer P> ? Promise<Result<P, E>> : Result<T, E>;

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then((data: Promise<unknown>) => ({ data, error: null }))
        .catch((e: unknown) => {
          return { data: null, error: e as E };
        }) as ReturnType;
    }
    return { data: result, error: null } as ReturnType;
  } catch (e: unknown) {
    return { data: null, error: e as E } as ReturnType;
  }
}

export class AppError extends Error {
  public readonly name: string;
  public readonly code: string;
  public readonly message: string;
  public readonly cause?: unknown;

  constructor(options: {
    name: string;
    code: string;
    message: string;
    cause?: unknown;
  }) {
    super(options.message);

    this.name = options.name;
    this.code = options.code;
    this.message = options.message;
    this.cause = options.cause;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
