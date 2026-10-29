import {requireAdmin} from '@/modules/identity/infrastructure/server-auth';
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireAdmin();return <div className="admin-frame"><main className="admin-content">{children}</main></div>;}
