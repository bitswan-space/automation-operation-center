export type DashboardEntry = {
  id: string;
  name: string;
  description?: string;
  url: string;
};

export type DashboardEntryCreateResponse = {
  id: string;
  name: string;
  url: string;
  description: string;
};

export type DashboardEntryCreateRequest = Omit<DashboardEntry, "id">;
export type DashboardEntryUpdateRequest = Omit<DashboardEntry, "id">;

export type DashboardEntryListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DashboardEntry[];
};
