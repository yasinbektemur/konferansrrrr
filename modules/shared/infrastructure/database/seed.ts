import conferencesData from "@/data/conferences.json";
import {seedStarterContent} from '@/modules/content/infrastructure/starter-content';
import type { RelationalDatabase } from "./sqlite-database";

type LegacyOpportunity = (typeof conferencesData)[number];

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function insertLegacyOpportunity(database: RelationalDatabase, item: LegacyOpportunity, sourceId: string) {
  const locationId = item.city || item.country ? `location-${slugify(`${item.city}-${item.country}`)}` : null;
  if (locationId) {
    database.prepare(`INSERT OR IGNORE INTO locations(id, city, country) VALUES (?, ?, ?)`)
      .run(locationId, item.city || null, item.country || null);
  }

  database.prepare(`
    INSERT OR IGNORE INTO opportunities(
      id, slug, external_id, source_id, location_id, type, title, acronym, summary, description,
      attendance_mode, start_date, end_date, official_url, trust_level, confidence_score,
      verification_note, last_verified_at, status, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)
  `).run(
    item.id, slugify(item.id), item.id, sourceId, locationId, item.type, item.name, item.acronym || null,
    item.description, item.description, item.mode, item.startDate || null, item.endDate || null, item.officialUrl,
    item.trustLevel, item.trustLevel === "verified" ? 92 : item.trustLevel === "suspicious" ? 25 : 58,
    item.trustNotes || null, item.lastVerified || null,
  );

  for (const topicName of item.topics) {
    const topicId = `topic-${slugify(topicName)}`;
    database.prepare(`INSERT OR IGNORE INTO topics(id, slug, name) VALUES (?, ?, ?)`)
      .run(topicId, slugify(topicName), topicName);
    database.prepare(`INSERT OR IGNORE INTO opportunity_topics(opportunity_id, topic_id, relevance) VALUES (?, ?, 100)`)
      .run(item.id, topicId);
  }

  const deadlineLabels: Record<string, string> = {
    abstract: "Özet gönderimi",
    fullPaper: "Tam metin gönderimi",
    registration: "Kayıt sonu",
    notification: "Kabul bildirimi",
    cameraReady: "Kamera hazır metin",
  };
  const deadlineKinds: Record<string, string> = {
    abstract: "abstract", fullPaper: "full_paper", registration: "registration", notification: "notification", cameraReady: "camera_ready",
  };
  for (const [key, dueAt] of Object.entries(item.deadlines)) {
    if (!dueAt) continue;
    database.prepare(`
      INSERT OR IGNORE INTO deadlines(id, opportunity_id, kind, label, due_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(`deadline-${item.id}-${deadlineKinds[key]}`, item.id, deadlineKinds[key], deadlineLabels[key], dueAt);
  }

  const publisherName = item.publication.publisher;
  if (publisherName && publisherName !== "Yok") {
    const publisherId = `publisher-${slugify(publisherName)}`;
    database.prepare(`INSERT OR IGNORE INTO publishers(id, name) VALUES (?, ?)`)
      .run(publisherId, publisherName);
    database.prepare(`INSERT OR IGNORE INTO opportunity_publications(opportunity_id, publisher_id) VALUES (?, ?)`)
      .run(item.id, publisherId);
  }
  for (const indexName of item.publication.indexing) {
    const indexId = `index-${slugify(indexName)}`;
    database.prepare(`INSERT OR IGNORE INTO publication_indexes(id, name) VALUES (?, ?)`)
      .run(indexId, indexName);
    database.prepare(`INSERT OR IGNORE INTO opportunity_indexes(opportunity_id, index_id) VALUES (?, ?)`)
      .run(item.id, indexId);
  }

  if (item.fees.amount || item.fees.notes) {
    database.prepare(`
      INSERT OR IGNORE INTO funding_details(opportunity_id, amount_min, amount_max, currency, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(item.id, item.fees.amount ?? null, item.fees.amount ?? null, item.fees.currency ?? null, item.fees.notes ?? null);
  }
}

export function seedDatabase(database: RelationalDatabase) {
  database.transaction(() => {
    database.prepare(`
      INSERT OR IGNORE INTO data_sources(id, name, kind, trust_level, status)
      VALUES ('source-demo', 'Başlangıç veri kataloğu', 'manual', 'verified', 'active')
    `).run();

    for (const item of conferencesData) insertLegacyOpportunity(database, item, "source-demo");
    seedStarterContent(database);
  });
}
