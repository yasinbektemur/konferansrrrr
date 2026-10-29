import {notFound} from 'next/navigation';
import {ContentService} from '@/modules/content/content-service';
import {getDatabase} from '@/modules/shared/infrastructure/database/server-database';
import {ContentSections} from '@/components/content-sections';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params,page=new ContentService(getDatabase()).findPublished(slug);return {title:page?.title??'Rehber',description:page?.seoDescription||page?.body.slice(0,160)};}
export default async function Guide({params}:{params:Promise<{slug:string}>}){const {slug}=await params,page=new ContentService(getDatabase()).findPublished(slug);if(!page||page.kind!=='guide')notFound();return <main className="page public-content-page"><header className="public-content-heading"><span>Araştırmacı rehberi</span><h1>{page.title}</h1><p>{page.body}</p></header><ContentSections blocks={page.blocks}/></main>;}
