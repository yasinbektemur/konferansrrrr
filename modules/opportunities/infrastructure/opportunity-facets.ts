import type { RelationalDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";
import { SqliteJsonCache } from "@/modules/shared/infrastructure/cache/sqlite-json-cache";
import { institutionalVisibility } from './catalog-visibility';

export class OpportunityFacets {
  constructor(private readonly database: RelationalDatabase) {}
  getAll() {
    return new SqliteJsonCache(this.database).remember("opportunity-facets", "all", 300, () => ({
      topics: this.database.prepare(`SELECT t.slug, t.name, COUNT(ot.opportunity_id) AS count FROM topics t JOIN opportunity_topics ot ON ot.topic_id = t.id JOIN opportunities o ON o.id = ot.opportunity_id AND o.status = 'published' WHERE ${institutionalVisibility} GROUP BY t.id ORDER BY count DESC, t.name`).all().map((row) => ({ slug: String((row as Record<string, unknown>).slug), name: String((row as Record<string, unknown>).name), count: Number((row as Record<string, unknown>).count) })),
      countries: this.database.prepare(`SELECT l.country AS name, COUNT(o.id) AS count FROM locations l JOIN opportunities o ON o.location_id = l.id AND o.status = 'published' WHERE l.country IS NOT NULL AND ${institutionalVisibility} GROUP BY l.country ORDER BY count DESC, l.country`).all().map((row) => ({ name: String((row as Record<string, unknown>).name), count: Number((row as Record<string, unknown>).count) })),
      types: this.database.prepare(`SELECT type AS name, COUNT(*) AS count FROM opportunities o WHERE status = 'published' AND ${institutionalVisibility} GROUP BY type ORDER BY count DESC`).all().map((row) => ({ name: String((row as Record<string, unknown>).name), count: Number((row as Record<string, unknown>).count) })),
    }));
  }
}
