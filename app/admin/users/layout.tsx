import { requireUserAdministrator } from "@/modules/identity/infrastructure/server-auth";
export default async function UserManagementLayout({children}:{children:React.ReactNode}){await requireUserAdministrator();return children}
