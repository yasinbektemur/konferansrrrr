import { randomUUID } from 'node:crypto';
import type { RelationalDatabase } from '@/modules/shared/infrastructure/database/sqlite-database';
import { ConflictError } from '@/modules/shared/domain/errors';
import type { InstitutionalCatalog } from '@/modules/marketplace/application/ports';
import type { Institution, Listing, ListingInput, ListingStatus } from '@/modules/marketplace/domain/models';

const select=`SELECT o.id,il.institution_id AS institutionId,o.version,o.title,o.summary,o.description,o.type,
  o.attendance_mode AS attendanceMode,o.official_url AS officialUrl,il.deadline,il.apply_mode AS applyMode,
  o.status,o.deleted_at AS deletedAt,i.name AS institutionName,il.creation_hash AS creationHash,
  (SELECT COUNT(*) FROM opportunity_submissions s WHERE s.opportunity_id=o.id) AS applicantCount
  FROM institutional_listings il JOIN opportunities o ON o.id=il.opportunity_id
  JOIN institutions i ON i.id=il.institution_id`;

/** Catalog's integration adapter: only this boundary publishes institution listings into the catalog. */
export class SqliteInstitutionalCatalog implements InstitutionalCatalog {
  constructor(private readonly db:RelationalDatabase){}
  get(id:string){const row=this.db.prepare(`${select} WHERE o.id=?`).get(id) as Listing|undefined;return row?{...row}:null;}
  list(options:{institutionId?:string;publicOnly?:boolean;reviewOnly?:boolean;trash?:boolean}){
    const where=['o.deleted_at IS '+(options.trash?'NOT NULL':'NULL')],params:string[]=[];
    if(options.institutionId){where.push('il.institution_id=?');params.push(options.institutionId);}
    if(options.publicOnly)where.push("o.status='published'");
    if(options.reviewOnly)where.push("o.status='review'");
    return (this.db.prepare(`${select} WHERE ${where.join(' AND ')} ORDER BY o.created_at DESC,o.id`).all(...params) as Listing[]).map(row=>({...row}));
  }
  save(input:ListingInput,institution:Institution,actorId:string,creationHash:string){
    const existing=this.get(input.id);
    if(!existing){
      this.db.prepare("INSERT INTO data_sources(id,name,kind,trust_level) VALUES('institution-publishing','Kurum tarafından yayımlandı','manual','unknown') ON CONFLICT(id) DO NOTHING").run();
      // One explicit organizer per institution; never infer ownership from publisher names.
      const organizerId=`institution:${institution.id}`;
      this.db.prepare('INSERT INTO organizers(id,name,institution_id,website_url) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING').run(organizerId,institution.name,institution.id,institution.websiteUrl);
      this.db.prepare(`INSERT INTO opportunities(id,slug,source_id,organizer_id,type,title,summary,description,status,attendance_mode,official_url,trust_level,confidence_score)
        VALUES(?,?,'institution-publishing',?,?,?,?,?,'draft',?,?,'unknown',0)`).run(input.id,`ilan-${input.id}`,organizerId,input.type,input.title,input.summary,input.description,input.attendanceMode,input.officialUrl);
      this.db.prepare('INSERT INTO institutional_listings(opportunity_id,institution_id,created_by,apply_mode,deadline,creation_hash) VALUES(?,?,?,?,?,?)').run(input.id,input.institutionId,actorId,input.applyMode,input.deadline,creationHash);
      this.db.prepare("INSERT INTO deadlines(id,opportunity_id,kind,label,due_at,timezone) VALUES(?,?,'application','Başvuru sonu',?,'UTC')").run(randomUUID(),input.id,input.deadline);
    }else{
      const result=this.db.prepare(`UPDATE opportunities SET title=?,summary=?,description=?,type=?,attendance_mode=?,official_url=?,status='draft',version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=?`).run(input.title,input.summary,input.description,input.type,input.attendanceMode,input.officialUrl,input.id,input.version);
      if(!result.changes)throw new ConflictError('İlan değişti.');
      this.db.prepare('UPDATE institutional_listings SET apply_mode=?,deadline=? WHERE opportunity_id=?').run(input.applyMode,input.deadline,input.id);
      this.db.prepare("UPDATE deadlines SET due_at=?,updated_at=CURRENT_TIMESTAMP WHERE opportunity_id=? AND kind='application'").run(input.deadline,input.id);
    }
  }
  transition(id:string,status:ListingStatus,version:number){
    const result=this.db.prepare(`UPDATE opportunities SET status=?,version=version+1,updated_at=CURRENT_TIMESTAMP,
      published_at=CASE WHEN ?='published' THEN CURRENT_TIMESTAMP ELSE published_at END,
      archived_at=CASE WHEN ?='archived' THEN CURRENT_TIMESTAMP ELSE archived_at END WHERE id=? AND version=?`).run(status,status,status,id,version);
    if(!result.changes)throw new ConflictError('İlan değişti.');
    this.db.prepare("DELETE FROM cache_entries WHERE namespace='opportunity-facets'").run();
  }
}
