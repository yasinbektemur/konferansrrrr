import type { Opportunity, OpportunityType, TrustLevel } from "../domain/opportunity";

export type OpportunityQuery = {
  search?: string;
  types?: OpportunityType[];
  topics?: string[];
  countries?: string[];
  trustLevels?: TrustLevel[];
  attendanceModes?: Array<"onsite" | "online" | "hybrid" | "not_applicable">;
  deadlineWithinDays?: number;
  viewerUserId?: string;
  followedByUserId?: string;
  sort?: "deadline" | "start_date" | "newest" | "confidence";
  page?: number;
  pageSize?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export interface OpportunityRepository {
  findById(id: string, userId?: string): Opportunity | null;
  findBySlug(slug: string, userId?: string): Opportunity | null;
  search(query: OpportunityQuery): Paginated<Opportunity>;
  countByType(): Array<{ type: string; count: number }>;
}
