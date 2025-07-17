export type ApiListResponse<T> = {
  status: "success" | "error";
  message?: string;
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiResponse<T = unknown> = {
  status: "success" | "error";
  message?: string;
  data: T | null;
};
