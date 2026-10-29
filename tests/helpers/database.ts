import { SqliteDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";

export function createTestDatabase() {
  const database = new SqliteDatabase(":memory:");
  database.migrate();
  return database;
}

export function seedOpportunityFixture(database: SqliteDatabase) {
  database.exec(`
    INSERT INTO data_sources(id, name, kind, base_url, trust_level) VALUES
      ('source-official', 'Resmî kaynak', 'official_site', 'https://example.org', 'verified');
    INSERT INTO locations(id, city, country, country_code) VALUES
      ('location-istanbul', 'İstanbul', 'Türkiye', 'TR');
    INSERT INTO topics(id, slug, name) VALUES
      ('topic-ai', 'yapay-zeka', 'Yapay zekâ'),
      ('topic-imaging', 'tibbi-goruntuleme', 'Tıbbi görüntüleme');
    INSERT INTO opportunities(
      id, slug, source_id, type, title, acronym, summary, description, attendance_mode,
      start_date, end_date, official_url, trust_level, confidence_score, location_id, status
    ) VALUES
      ('opp-1', 'biyomedikal-ai-2027', 'source-official', 'conference', 'Biyomedikal Yapay Zekâ Kongresi', 'BYZK',
       'Klinik yapay zekâ ve görüntüleme.', 'Ayrıntılı açıklama', 'hybrid', '2027-05-10', '2027-05-12',
       'https://example.org/event', 'verified', 94, 'location-istanbul', 'published'),
      ('opp-2', 'ar-ge-hibesi-2027', 'source-official', 'grant', 'Sağlık Teknolojileri AR-GE Hibesi', NULL,
       'Tıbbi cihaz projelerine hibe.', 'Hibe açıklaması', 'not_applicable', NULL, NULL,
       'https://example.org/grant', 'verified', 88, NULL, 'published');
    INSERT INTO opportunity_topics(opportunity_id, topic_id, relevance) VALUES
      ('opp-1', 'topic-ai', 100), ('opp-1', 'topic-imaging', 90), ('opp-2', 'topic-ai', 70);
    INSERT INTO deadlines(id, opportunity_id, kind, label, due_at) VALUES
      ('deadline-1', 'opp-1', 'abstract', 'Özet gönderimi', '2027-02-10'),
      ('deadline-2', 'opp-1', 'registration', 'Erken kayıt', '2027-04-01'),
      ('deadline-3', 'opp-2', 'application', 'Başvuru sonu', '2027-03-15');
  `);
}
