import type { RelationalDatabase, SqlValue } from "@/modules/shared/infrastructure/database/sqlite-database";
import { Opportunity, type Deadline, type OpportunityProps, type OpportunityType, type TrustLevel } from "../domain/opportunity";
import type { OpportunityQuery, OpportunityRepository, Paginated } from "../application/opportunity-repository";
import { institutionalVisibility } from './catalog-visibility';

type OpportunityRow = {
  id: string;
  slug: string;
  type: OpportunityType;
  title: string;
  acronym: string | null;
  summary: string;
  description: string;
  attendance_mode: OpportunityProps["attendanceMode"];
  start_date: string | null;
  end_date: string | null;
  official_url: string;
  trust_level: TrustLevel;
  confidence_score: number;
  city: string | null;
  country: string | null;
  source_name: string;
  organizer_name: string | null;
  institution_id: string | null;
  apply_mode: 'platform' | 'external' | null;
  source_id: string;
  publisher_name: string | null;
  followed: number;
};

export class SqliteOpportunityRepository implements OpportunityRepository {
  constructor(private readonly database: RelationalDatabase) {}

  findById(id: string, userId?: string) {
    return this.findOne("o.id = ?", id, userId);
  }

  findBySlug(slug: string, userId?: string) {
    return this.findOne("o.slug = ?", slug, userId);
  }

  search(query: OpportunityQuery): Paginated<Opportunity> {
    const requestedPage = Number.isFinite(query.page) ? Math.max(1, Math.floor(query.page!)) : 1;
    const pageSize = Number.isFinite(query.pageSize) ? Math.min(50, Math.max(1, Math.floor(query.pageSize!))) : 12;
    const conditions = ["o.status = 'published'", institutionalVisibility];
    const params: SqlValue[] = [];

    if (query.search?.trim()) {
      conditions.push("(o.title LIKE ? OR o.acronym LIKE ? OR o.summary LIKE ? OR org.name LIKE ?)");
      const value = `%${query.search.trim()}%`;
      params.push(value, value, value, value);
    }
    this.addInFilter(conditions, params, "o.type", query.types);
    this.addInFilter(conditions, params, "o.trust_level", query.trustLevels);
    this.addInFilter(conditions, params, "o.attendance_mode", query.attendanceModes);

    if (query.countries?.length) {
      this.addInFilter(conditions, params, "l.country", query.countries);
    }
    if (query.topics?.length) {
      const placeholders = query.topics.map(() => "?").join(",");
      conditions.push(`EXISTS (
        SELECT 1 FROM opportunity_topics filter_ot
        JOIN topics filter_t ON filter_t.id = filter_ot.topic_id
        WHERE filter_ot.opportunity_id = o.id AND filter_t.slug IN (${placeholders})
      )`);
      params.push(...query.topics);
    }
    if (query.followedByUserId) {
      conditions.push("EXISTS (SELECT 1 FROM follows ff WHERE ff.opportunity_id = o.id AND ff.user_id = ?)");
      params.push(query.followedByUserId);
    }
    if (query.deadlineWithinDays) {
      conditions.push("EXISTS (SELECT 1 FROM deadlines fd WHERE fd.opportunity_id = o.id AND date(fd.due_at) BETWEEN date('now') AND date('now', ?))");
      params.push(`+${query.deadlineWithinDays} days`);
    }

    const from = `
      FROM opportunities o
      JOIN data_sources ds ON ds.id = o.source_id
      LEFT JOIN locations l ON l.id = o.location_id
      LEFT JOIN organizers org ON org.id = o.organizer_id
      LEFT JOIN opportunity_publications opub ON opub.opportunity_id = o.id
      LEFT JOIN publishers p ON p.id = opub.publisher_id
    `;
    const where = `WHERE ${conditions.join(" AND ")}`;
    const count = this.database.prepare(`SELECT COUNT(DISTINCT o.id) AS count ${from} ${where}`).get(...params) as { count: number };
    const page = Math.min(requestedPage, Math.max(1,Math.ceil(Number(count.count)/pageSize)));
    const orderBy = this.orderBy(query.sort);
    const userId = query.viewerUserId ?? query.followedByUserId ?? "";
    const rows = this.database.prepare(`
      SELECT o.*, l.city, l.country, ds.name AS source_name, org.name AS organizer_name,
             p.name AS publisher_name, org.institution_id,
             (SELECT apply_mode FROM institutional_listings il WHERE il.opportunity_id=o.id) AS apply_mode,
             EXISTS (SELECT 1 FROM follows f WHERE f.opportunity_id = o.id AND f.user_id = ?) AS followed
      ${from} ${where}
      ${orderBy}
      LIMIT ? OFFSET ?
    `).all(userId, ...params, pageSize, (page - 1) * pageSize) as OpportunityRow[];

    const items = rows.map((row) => this.hydrate(row));
    const total = Number(count.count);
    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  countByType() {
    return this.database.prepare(`
      SELECT type, COUNT(*) AS count
      FROM opportunities o
      WHERE status = 'published' AND ${institutionalVisibility}
      GROUP BY type
      ORDER BY count DESC
    `).all().map((row) => ({ type: String((row as Record<string, unknown>).type), count: Number((row as Record<string, unknown>).count) }));
  }

  private findOne(condition: string, value: string, userId = "") {
    const row = this.database.prepare(`
      SELECT o.*, l.city, l.country, ds.name AS source_name, org.name AS organizer_name,
             p.name AS publisher_name, org.institution_id,
             (SELECT apply_mode FROM institutional_listings il WHERE il.opportunity_id=o.id) AS apply_mode,
             EXISTS (SELECT 1 FROM follows f WHERE f.opportunity_id = o.id AND f.user_id = ?) AS followed
      FROM opportunities o
      JOIN data_sources ds ON ds.id = o.source_id
      LEFT JOIN locations l ON l.id = o.location_id
      LEFT JOIN organizers org ON org.id = o.organizer_id
      LEFT JOIN opportunity_publications opub ON opub.opportunity_id = o.id
      LEFT JOIN publishers p ON p.id = opub.publisher_id
      WHERE ${condition} AND o.status='published' AND ${institutionalVisibility}
    `).get(userId, value) as OpportunityRow | undefined;
    return row ? this.hydrate(row) : null;
  }

  private hydrate(row: OpportunityRow) {
    const topics = this.database.prepare(`
      SELECT t.name FROM opportunity_topics ot JOIN topics t ON t.id = ot.topic_id
      WHERE ot.opportunity_id = ? ORDER BY ot.relevance DESC, t.name
    `).all(row.id).map((topic) => String((topic as Record<string, unknown>).name));
    const deadlines = this.database.prepare(`
      SELECT id, kind, label, due_at, is_estimated FROM deadlines
      WHERE opportunity_id = ? ORDER BY due_at
    `).all(row.id).map((deadline) => {
      const item = deadline as Record<string, unknown>;
      return { id: String(item.id), kind: item.kind as Deadline["kind"], label: String(item.label), dueAt: String(item.due_at), isEstimated: Boolean(item.is_estimated) };
    });
    const indexes = this.database.prepare(`
      SELECT pi.name FROM opportunity_indexes oi JOIN publication_indexes pi ON pi.id = oi.index_id
      WHERE oi.opportunity_id = ? ORDER BY pi.name
    `).all(row.id).map((item) => String((item as Record<string, unknown>).name));

    return new Opportunity({
      id: row.id,
      slug: row.slug,
      type: row.type,
      title: row.title,
      acronym: row.acronym,
      summary: row.summary,
      description: row.description,
      attendanceMode: row.attendance_mode,
      startDate: row.start_date,
      endDate: row.end_date,
      officialUrl: row.official_url,
      trustLevel: row.trust_level,
      confidenceScore: Number(row.confidence_score),
      city: row.city,
      country: row.country,
      sourceName: row.source_name,
      organizerName: row.organizer_name,
      institutionId: row.institution_id,
      applyMode: row.apply_mode,
      sampleData: row.source_id === 'source-demo',
      topics,
      deadlines,
      publisher: row.publisher_name,
      indexes,
      followed: Boolean(row.followed),
    });
  }

  private addInFilter(conditions: string[], params: SqlValue[], column: string, values?: readonly string[]) {
    if (!values?.length) return;
    conditions.push(`${column} IN (${values.map(() => "?").join(",")})`);
    params.push(...values);
  }

  private orderBy(sort: OpportunityQuery["sort"]) {
    if (sort === "start_date") return "ORDER BY o.start_date IS NULL, o.start_date ASC";
    if (sort === "newest") return "ORDER BY o.first_seen_at DESC";
    if (sort === "confidence") return "ORDER BY o.confidence_score DESC, o.title ASC";
    return `ORDER BY
      (SELECT MIN(due_at) FROM deadlines d WHERE d.opportunity_id = o.id AND date(due_at) >= date('now')) IS NULL,
      (SELECT MIN(due_at) FROM deadlines d WHERE d.opportunity_id = o.id AND date(due_at) >= date('now')) ASC`;
  }
}

