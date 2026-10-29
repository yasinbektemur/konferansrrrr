import { ValidationError } from "@/modules/shared/domain/errors";

export const opportunityTypes = ["conference", "workshop", "grant", "fellowship", "competition", "fair", "special_issue", "award"] as const;
export type OpportunityType = (typeof opportunityTypes)[number];
export type TrustLevel = "verified" | "unknown" | "suspicious";
export type AttendanceMode = "onsite" | "online" | "hybrid" | "not_applicable";

export type Deadline = {
  id: string;
  kind: "abstract" | "full_paper" | "registration" | "notification" | "camera_ready" | "application" | "internal" | "other";
  label: string;
  dueAt: string;
  isEstimated: boolean;
};

export type OpportunityProps = {
  id: string;
  slug: string;
  type: OpportunityType;
  title: string;
  acronym?: string | null;
  summary: string;
  description: string;
  attendanceMode: AttendanceMode;
  startDate?: string | null;
  endDate?: string | null;
  officialUrl: string;
  trustLevel: TrustLevel;
  confidenceScore: number;
  city?: string | null;
  country?: string | null;
  sourceName: string;
  organizerName?: string | null;
  institutionId?: string | null;
  applyMode?: 'platform' | 'external' | null;
  sampleData?: boolean;
  topics: string[];
  deadlines: Deadline[];
  publisher?: string | null;
  indexes: string[];
  followed?: boolean;
};

export class Opportunity {
  constructor(readonly props: OpportunityProps) {
    if (!props.id || !props.title.trim() || !props.slug) {
      throw new ValidationError("Fırsat kimliği, slug ve başlık zorunludur.");
    }
    if (props.confidenceScore < 0 || props.confidenceScore > 100) {
      throw new ValidationError("Güven puanı 0 ile 100 arasında olmalıdır.");
    }
    if (props.startDate && props.endDate && props.endDate < props.startDate) {
      throw new ValidationError("Bitiş tarihi başlangıç tarihinden önce olamaz.");
    }
  }

  get id() {
    return this.props.id;
  }

  nearestDeadline(referenceDate = new Date()): (Deadline & { daysLeft: number }) | null {
    return this.props.deadlines
      .map((deadline) => {
        return { ...deadline, daysLeft: daysUntilDeadline(deadline.dueAt, referenceDate) };
      })
      .filter((deadline) => Number.isFinite(deadline.daysLeft) && deadline.daysLeft >= 0)
      .sort((left, right) => left.daysLeft - right.daysLeft)[0] ?? null;
  }

  urgency(referenceDate = new Date()): "overdue" | "critical" | "soon" | "normal" | "none" {
    const nearest = this.nearestDeadline(referenceDate);
    if (!nearest) return "none";
    if (nearest.daysLeft <= 7) return "critical";
    if (nearest.daysLeft <= 30) return "soon";
    return "normal";
  }
}

/** Date-only deadlines close at the end of their UTC calendar day. */
export function daysUntilDeadline(value:string,reference=new Date()){
  const due=Date.parse(`${value.slice(0,10)}T00:00:00Z`);
  const today=Date.UTC(reference.getUTCFullYear(),reference.getUTCMonth(),reference.getUTCDate());
  return Math.round((due-today)/86_400_000);
}
