export type Migration = {
  version: number;
  name: string;
  sql: string;
};

export const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_relational_model",
    sql: `
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'curator', 'admin', 'owner')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
        email_verified_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
      );

      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        user_agent TEXT,
        ip_hash TEXT,
        expires_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        revoked_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        owner_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT
      );

      CREATE TABLE workspace_members (
        workspace_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('viewer', 'member', 'manager', 'owner')),
        joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (workspace_id, user_id),
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) WITHOUT ROWID;

      CREATE TABLE institutions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        country_code TEXT,
        ror_id TEXT UNIQUE,
        website_url TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE researcher_profiles (
        user_id TEXT PRIMARY KEY,
        institution_id TEXT,
        orcid_id TEXT UNIQUE,
        title TEXT,
        biography TEXT,
        keywords_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(keywords_json)),
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
      );

      CREATE TABLE data_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('official_api', 'official_site', 'aggregator', 'manual', 'import')),
        base_url TEXT,
        trust_level TEXT NOT NULL DEFAULT 'unknown' CHECK (trust_level IN ('verified', 'unknown', 'suspicious')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failing')),
        last_synced_at TEXT,
        last_error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE locations (
        id TEXT PRIMARY KEY,
        city TEXT,
        country TEXT,
        country_code TEXT,
        latitude REAL CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
        longitude REAL CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
        timezone TEXT,
        UNIQUE (city, country)
      );

      CREATE TABLE organizers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        institution_id TEXT,
        website_url TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
      );

      CREATE TABLE opportunities (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        external_id TEXT,
        source_id TEXT NOT NULL,
        organizer_id TEXT,
        location_id TEXT,
        type TEXT NOT NULL CHECK (type IN ('conference', 'workshop', 'grant', 'fellowship', 'competition', 'fair', 'special_issue', 'award')),
        title TEXT NOT NULL,
        acronym TEXT,
        summary TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'archived', 'rejected')),
        attendance_mode TEXT NOT NULL DEFAULT 'onsite' CHECK (attendance_mode IN ('onsite', 'online', 'hybrid', 'not_applicable')),
        start_date TEXT,
        end_date TEXT,
        official_url TEXT NOT NULL,
        language_codes_json TEXT NOT NULL DEFAULT '["en"]' CHECK (json_valid(language_codes_json)),
        trust_level TEXT NOT NULL DEFAULT 'unknown' CHECK (trust_level IN ('verified', 'unknown', 'suspicious')),
        confidence_score INTEGER NOT NULL DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
        verification_note TEXT,
        last_verified_at TEXT,
        first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        published_at TEXT,
        archived_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
        UNIQUE (source_id, external_id),
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
        FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE RESTRICT,
        FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE SET NULL,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
      );

      CREATE TABLE topics (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL UNIQUE,
        parent_id TEXT,
        FOREIGN KEY (parent_id) REFERENCES topics(id) ON DELETE SET NULL
      );

      CREATE TABLE opportunity_topics (
        opportunity_id TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        relevance INTEGER NOT NULL DEFAULT 100 CHECK (relevance BETWEEN 0 AND 100),
        PRIMARY KEY (opportunity_id, topic_id),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE RESTRICT
      ) WITHOUT ROWID;

      CREATE TABLE deadlines (
        id TEXT PRIMARY KEY,
        opportunity_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('abstract', 'full_paper', 'registration', 'notification', 'camera_ready', 'application', 'internal', 'other')),
        label TEXT NOT NULL,
        due_at TEXT NOT NULL,
        timezone TEXT,
        is_estimated INTEGER NOT NULL DEFAULT 0 CHECK (is_estimated IN (0, 1)),
        source_url TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (opportunity_id, kind, label, due_at),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      );

      CREATE TABLE publishers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        website_url TEXT
      );

      CREATE TABLE publication_indexes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        website_url TEXT
      );

      CREATE TABLE opportunity_publications (
        opportunity_id TEXT PRIMARY KEY,
        publisher_id TEXT,
        proceedings_note TEXT,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL
      );

      CREATE TABLE opportunity_indexes (
        opportunity_id TEXT NOT NULL,
        index_id TEXT NOT NULL,
        PRIMARY KEY (opportunity_id, index_id),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY (index_id) REFERENCES publication_indexes(id) ON DELETE RESTRICT
      ) WITHOUT ROWID;

      CREATE TABLE funding_details (
        opportunity_id TEXT PRIMARY KEY,
        funder_name TEXT,
        amount_min REAL CHECK (amount_min IS NULL OR amount_min >= 0),
        amount_max REAL CHECK (amount_max IS NULL OR amount_max >= 0),
        currency TEXT,
        cost_share_required INTEGER NOT NULL DEFAULT 0 CHECK (cost_share_required IN (0, 1)),
        notes TEXT,
        CHECK (amount_max IS NULL OR amount_min IS NULL OR amount_max >= amount_min),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      );

      CREATE TABLE eligibility_rules (
        id TEXT PRIMARY KEY,
        opportunity_id TEXT NOT NULL,
        dimension TEXT NOT NULL CHECK (dimension IN ('country', 'career_stage', 'organization_type', 'discipline', 'citizenship', 'other')),
        operator TEXT NOT NULL CHECK (operator IN ('include', 'exclude', 'require')),
        value TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      );

      CREATE TABLE follows (
        user_id TEXT NOT NULL,
        opportunity_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, opportunity_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      ) WITHOUT ROWID;

      CREATE TABLE collections (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL,
        workspace_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'workspace')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
      );

      CREATE TABLE collection_items (
        collection_id TEXT NOT NULL,
        opportunity_id TEXT NOT NULL,
        added_by_user_id TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (collection_id, opportunity_id),
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
      ) WITHOUT ROWID;

      CREATE TABLE saved_searches (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        workspace_id TEXT,
        name TEXT NOT NULL,
        query_json TEXT NOT NULL CHECK (json_valid(query_json)),
        alerts_enabled INTEGER NOT NULL DEFAULT 0 CHECK (alerts_enabled IN (0, 1)),
        frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('instant', 'daily', 'weekly')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
      );

      CREATE TABLE application_workspaces (
        id TEXT PRIMARY KEY,
        opportunity_id TEXT NOT NULL,
        workspace_id TEXT,
        owner_user_id TEXT NOT NULL,
        stage TEXT NOT NULL DEFAULT 'considering' CHECK (stage IN ('considering', 'planning', 'writing', 'review', 'submitted', 'accepted', 'rejected', 'withdrawn')),
        internal_deadline TEXT,
        decision_note TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        version INTEGER NOT NULL DEFAULT 1,
        UNIQUE (owner_user_id, opportunity_id, workspace_id),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE RESTRICT
      );

      CREATE TABLE application_members (
        application_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('lead', 'contributor', 'reviewer')),
        PRIMARY KEY (application_id, user_id),
        FOREIGN KEY (application_id) REFERENCES application_workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) WITHOUT ROWID;

      CREATE TABLE application_tasks (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL,
        assignee_user_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'review', 'done')),
        priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        due_at TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES application_workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE application_comments (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL,
        task_id TEXT,
        author_user_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        edited_at TEXT,
        FOREIGN KEY (application_id) REFERENCES application_workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES application_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
      );

      CREATE TABLE notification_preferences (
        user_id TEXT PRIMARY KEY,
        email_enabled INTEGER NOT NULL DEFAULT 1 CHECK (email_enabled IN (0, 1)),
        telegram_enabled INTEGER NOT NULL DEFAULT 0 CHECK (telegram_enabled IN (0, 1)),
        in_app_enabled INTEGER NOT NULL DEFAULT 1 CHECK (in_app_enabled IN (0, 1)),
        telegram_chat_id TEXT,
        digest_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (digest_frequency IN ('off', 'daily', 'weekly')),
        quiet_hours_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(quiet_hours_json)),
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        opportunity_id TEXT,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        deduplication_key TEXT NOT NULL UNIQUE,
        read_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      );

      CREATE TABLE notification_deliveries (
        id TEXT PRIMARY KEY,
        notification_id TEXT NOT NULL,
        channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram', 'in_app')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
        provider_message_id TEXT,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        sent_at TEXT,
        UNIQUE (notification_id, channel),
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
      );

      CREATE TABLE moderation_items (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        external_id TEXT,
        payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
        matched_opportunity_id TEXT,
        reviewed_by_user_id TEXT,
        review_note TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TEXT,
        UNIQUE (source_id, external_id),
        FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE RESTRICT,
        FOREIGN KEY (matched_opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL,
        FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE opportunity_versions (
        id TEXT PRIMARY KEY,
        opportunity_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json)),
        changed_by_user_id TEXT,
        change_reason TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (opportunity_id, version),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE idempotency_keys (
        key TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        response_json TEXT,
        status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE outbox_events (
        id TEXT PRIMARY KEY,
        aggregate_type TEXT NOT NULL,
        aggregate_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'published', 'dead_letter')),
        attempt_count INTEGER NOT NULL DEFAULT 0,
        available_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        processed_at TEXT,
        last_error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE audit_logs (
        id TEXT PRIMARY KEY,
        actor_user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        request_id TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE integration_runs (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'succeeded', 'failed', 'partial')),
        cursor TEXT,
        records_seen INTEGER NOT NULL DEFAULT 0,
        records_created INTEGER NOT NULL DEFAULT 0,
        records_updated INTEGER NOT NULL DEFAULT 0,
        error_summary TEXT,
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at TEXT,
        FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE RESTRICT
      );

      CREATE TABLE cache_entries (
        key TEXT PRIMARY KEY,
        namespace TEXT NOT NULL,
        value_json TEXT NOT NULL CHECK (json_valid(value_json)),
        etag TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_sessions_user_expiry ON sessions(user_id, expires_at);
      CREATE INDEX idx_opportunities_status_type ON opportunities(status, type);
      CREATE INDEX idx_opportunities_dates ON opportunities(start_date, end_date);
      CREATE INDEX idx_opportunities_source ON opportunities(source_id, external_id);
      CREATE INDEX idx_deadlines_due ON deadlines(due_at, opportunity_id);
      CREATE INDEX idx_opportunity_topics_topic ON opportunity_topics(topic_id, opportunity_id);
      CREATE INDEX idx_applications_stage ON application_workspaces(stage, internal_deadline);
      CREATE INDEX idx_tasks_application_status ON application_tasks(application_id, status, position);
      CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at, created_at);
      CREATE INDEX idx_moderation_status_created ON moderation_items(status, created_at);
      CREATE INDEX idx_outbox_ready ON outbox_events(status, available_at);
      CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at);
      CREATE INDEX idx_cache_expiry ON cache_entries(namespace, expires_at);
    `,
  },
  {
    version: 2,
    name: "relational_invariants_and_search",
    sql: `
      CREATE UNIQUE INDEX idx_personal_application_unique
        ON application_workspaces(owner_user_id, opportunity_id)
        WHERE workspace_id IS NULL;

      CREATE UNIQUE INDEX idx_workspace_application_unique
        ON application_workspaces(workspace_id, opportunity_id)
        WHERE workspace_id IS NOT NULL;

      CREATE VIRTUAL TABLE opportunities_fts USING fts5(
        title,
        acronym,
        summary,
        description,
        content='opportunities',
        content_rowid='rowid',
        tokenize='unicode61 remove_diacritics 2'
      );

      INSERT INTO opportunities_fts(rowid, title, acronym, summary, description)
      SELECT rowid, title, acronym, summary, description FROM opportunities;

      CREATE TRIGGER opportunities_fts_insert AFTER INSERT ON opportunities BEGIN
        INSERT INTO opportunities_fts(rowid, title, acronym, summary, description)
        VALUES (new.rowid, new.title, new.acronym, new.summary, new.description);
      END;

      CREATE TRIGGER opportunities_fts_delete AFTER DELETE ON opportunities BEGIN
        INSERT INTO opportunities_fts(opportunities_fts, rowid, title, acronym, summary, description)
        VALUES ('delete', old.rowid, old.title, old.acronym, old.summary, old.description);
      END;

      CREATE TRIGGER opportunities_fts_update AFTER UPDATE OF title, acronym, summary, description ON opportunities BEGIN
        INSERT INTO opportunities_fts(opportunities_fts, rowid, title, acronym, summary, description)
        VALUES ('delete', old.rowid, old.title, old.acronym, old.summary, old.description);
        INSERT INTO opportunities_fts(rowid, title, acronym, summary, description)
        VALUES (new.rowid, new.title, new.acronym, new.summary, new.description);
      END;
    `,
  },
  {
    version: 3,
    name: "user_governance_and_admin_notes",
    sql: `
      CREATE TABLE user_admin_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        author_user_id TEXT,
        body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX idx_admin_notes_user_created
        ON user_admin_notes(user_id, created_at DESC);
      CREATE INDEX idx_users_status_role_created
        ON users(status, role, created_at DESC);
      CREATE INDEX idx_audit_actor_created
        ON audit_logs(actor_user_id, created_at DESC);
    `,
  },
  {
    version: 4,
    name: "remove_placeholder_opportunities",
    sql: `
      DELETE FROM opportunities
      WHERE id IN ('eu-health-2027', 'biotech-fellowship-2027', 'clinical-ai-award-2027');
      DELETE FROM data_sources
      WHERE id = 'source-eu' AND NOT EXISTS (SELECT 1 FROM opportunities WHERE source_id = 'source-eu');
      UPDATE data_sources SET base_url = NULL, name = 'Başlangıç veri kataloğu' WHERE id = 'source-demo';
    `,
  },
  {
    version: 5,
    name: "cms_editorial_content",
    sql: `CREATE TABLE content_pages (
      slug TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),
      version INTEGER NOT NULL DEFAULT 1, author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE content_revisions (
      id TEXT PRIMARY KEY, page_slug TEXT NOT NULL REFERENCES content_pages(slug) ON DELETE CASCADE,
      version INTEGER NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL,
      author_id TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(page_slug,version)
    );`,
  },
  {
    version: 6,
    name: "institutional_publishing_and_submissions",
    sql: `
      CREATE TABLE institution_accounts (
        institution_id TEXT PRIMARY KEY REFERENCES institutions(id) ON DELETE RESTRICT,
        description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending'
          CHECK(status IN ('pending','verified','rejected')),
        version INTEGER NOT NULL DEFAULT 1, creation_hash TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE institution_members (
        institution_id TEXT NOT NULL REFERENCES institution_accounts(institution_id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        role TEXT NOT NULL CHECK(role IN ('manager','reviewer')),
        PRIMARY KEY(institution_id,user_id)
      );
      CREATE TABLE institutional_listings (
        opportunity_id TEXT PRIMARY KEY REFERENCES opportunities(id) ON DELETE RESTRICT,
        institution_id TEXT NOT NULL REFERENCES institution_accounts(institution_id) ON DELETE RESTRICT,
        created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        apply_mode TEXT NOT NULL CHECK(apply_mode IN ('platform','external')),
        deadline TEXT NOT NULL, creation_hash TEXT NOT NULL
      );
      CREATE TABLE opportunity_submissions (
        id TEXT PRIMARY KEY,
        opportunity_id TEXT NOT NULL REFERENCES institutional_listings(opportunity_id) ON DELETE RESTRICT,
        applicant_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        applicant_name TEXT NOT NULL, applicant_email TEXT NOT NULL,
        message TEXT NOT NULL CHECK(length(message) BETWEEN 30 AND 6000),
        status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','reviewing','accepted','rejected','withdrawn')),
        decision_note TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1,
        consent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(opportunity_id,applicant_id)
      );
      CREATE INDEX idx_institution_members_user ON institution_members(user_id);
      CREATE INDEX idx_institutional_listings_institution ON institutional_listings(institution_id);
      CREATE INDEX idx_submissions_listing_status ON opportunity_submissions(opportunity_id,status,created_at DESC);
      CREATE INDEX idx_submissions_applicant ON opportunity_submissions(applicant_id,created_at DESC);
    `,
  },
  {
    version: 7,
    name: 'portal_pages_and_site_identity',
    sql: `
      ALTER TABLE content_pages ADD COLUMN kind TEXT NOT NULL DEFAULT 'guide' CHECK(kind IN ('guide','page','home'));
      ALTER TABLE content_pages ADD COLUMN blocks_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(blocks_json));
      ALTER TABLE content_pages ADD COLUMN seo_description TEXT NOT NULL DEFAULT '';
      ALTER TABLE content_pages ADD COLUMN show_in_navigation INTEGER NOT NULL DEFAULT 0 CHECK(show_in_navigation IN (0,1));
      ALTER TABLE content_pages ADD COLUMN show_in_footer INTEGER NOT NULL DEFAULT 0 CHECK(show_in_footer IN (0,1));
      ALTER TABLE content_revisions ADD COLUMN kind TEXT NOT NULL DEFAULT 'guide';
      ALTER TABLE content_revisions ADD COLUMN blocks_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(blocks_json));
      ALTER TABLE content_revisions ADD COLUMN seo_description TEXT NOT NULL DEFAULT '';
      ALTER TABLE content_revisions ADD COLUMN show_in_navigation INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE content_revisions ADD COLUMN show_in_footer INTEGER NOT NULL DEFAULT 0;
      CREATE TABLE site_settings (
        id INTEGER PRIMARY KEY CHECK(id=1), value_json TEXT NOT NULL CHECK(json_valid(value_json)),
        version INTEGER NOT NULL, updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_content_public_navigation ON content_pages(status,kind,show_in_navigation);
    `,
  },
  {
    version:8,name:'listing_import_previews_and_references',sql:`
      CREATE TABLE listing_import_batches (
        id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scope_key TEXT NOT NULL, institution_id TEXT REFERENCES institution_accounts(institution_id) ON DELETE CASCADE,
        rows_json TEXT NOT NULL CHECK(json_valid(rows_json)), status TEXT NOT NULL DEFAULT 'preview' CHECK(status IN ('preview','applied')),
        expires_at TEXT NOT NULL, result_json TEXT CHECK(result_json IS NULL OR json_valid(result_json)), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_import_actor ON listing_import_batches(actor_id,status,expires_at);
      CREATE TABLE listing_import_references (
        scope_key TEXT NOT NULL, reference TEXT NOT NULL, opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        PRIMARY KEY(scope_key,reference), UNIQUE(scope_key,opportunity_id)
      );
    `
  },
  {version:9,name:'reversible_workflows',sql:`
    ALTER TABLE opportunities ADD COLUMN deleted_at TEXT;
    ALTER TABLE collections ADD COLUMN deleted_at TEXT;
    ALTER TABLE application_tasks ADD COLUMN deleted_at TEXT;
    ALTER TABLE application_workspaces ADD COLUMN deleted_at TEXT;
    ALTER TABLE content_pages ADD COLUMN deleted_at TEXT;
    ALTER TABLE notifications ADD COLUMN hidden_at TEXT;
  `},
];
