import 'server-only';
import {getDatabase} from '@/modules/shared/infrastructure/database/server-database';
import {getRecruitment} from '@/modules/marketplace/infrastructure/server-recruitment';
import {SqliteListingTransferTarget} from '@/modules/opportunities/infrastructure/listing-transfer-target';
import {ListingTransferService} from '../application/listing-transfer-service';
import {SqliteTransferStore} from './sqlite-transfer-store';
import type {TransferScope} from '../application/ports';
export function getListingTransfer(scope:TransferScope){const db=getDatabase();return new ListingTransferService(new SqliteTransferStore(db),new SqliteListingTransferTarget(db,getRecruitment(),scope),scope);}
