import {requireUser} from '@/modules/identity/infrastructure/server-auth';
export default async function ResearchLayout({children}:{children:React.ReactNode}){await requireUser();return children;}
