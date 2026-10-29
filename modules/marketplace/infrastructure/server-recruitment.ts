import 'server-only';
import { getDatabase } from '@/modules/shared/infrastructure/database/server-database';
import { SqliteInstitutionalCatalog } from '@/modules/opportunities/infrastructure/institutional-catalog';
import { RecruitmentService } from '../application/recruitment-service';
import { SqliteRecruitmentRepository } from './sqlite-recruitment-repository';
export function getRecruitment(){const database=getDatabase();return new RecruitmentService(new SqliteRecruitmentRepository(database),new SqliteInstitutionalCatalog(database));}
