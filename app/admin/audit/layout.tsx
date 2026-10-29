import { requireUserAdministrator } from "@/modules/identity/infrastructure/server-auth";
export default async function AuditLayout({children}:{children:React.ReactNode}){await requireUserAdministrator();return children}
