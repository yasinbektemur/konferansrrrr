import {requireAdmin} from '@/modules/identity/infrastructure/server-auth';
import {ListingTransferWorkbench} from '@/components/listing-transfer-workbench';
export default async function AdminImport(){await requireAdmin();return <><header className="admin-page-head"><div><h1>İlan içe / dışa aktarma</h1><p>CSV dosyasını denetle, gerçek alanları önizle ve yeni katalog ilanlarını yayımla.</p></div></header><ListingTransferWorkbench scope={{kind:'catalog'}} returnHref="/admin/opportunities"/></>;}
