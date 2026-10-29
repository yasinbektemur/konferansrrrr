import {notFound} from 'next/navigation';
import {ContentService} from '@/modules/content/content-service';
import {getDatabase} from '@/modules/shared/infrastructure/database/server-database';
import {ContentSections} from '@/components/content-sections';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params,page=new ContentService(getDatabase()).findPublished(slug);return {title:page?.title??'Sayfa bulunamadı',description:page?.seoDescription||page?.body.slice(0,160)};}
export default async function SitePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params,page=new ContentService(getDatabase()).findPublished(slug);if(!page||page.kind!=='page')notFound();return <main className="page public-content-page"><header className="public-content-heading"><span>Konferans Radar</span><h1>{page.title}</h1><p>{page.body}</p></header><ContentSections blocks={page.blocks}/></main>;}
