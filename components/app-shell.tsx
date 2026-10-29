import { getCurrentUser } from "@/modules/identity/infrastructure/server-auth";
import { SurfaceShell } from "./surface-shell";
import {ContentService} from '@/modules/content/content-service';
import {getDatabase} from '@/modules/shared/infrastructure/database/server-database';
import {ProductTour} from './product-tour';
export async function AppShell({children}:{children:React.ReactNode}) {
  const cms=new ContentService(getDatabase()),user=await getCurrentUser();
  return <><SurfaceShell user={user} pages={cms.navigation()} settings={cms.siteSettings()}>{children}</SurfaceShell>{user&&<ProductTour key={user.id} user={user}/>}</>;
}
