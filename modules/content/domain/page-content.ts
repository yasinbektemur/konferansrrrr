import {z} from 'zod';
const internalLink=z.string().max(300).regex(/^\/(?![\/\\])[^\s\\]*$/,'Bağlantı bu sitede / ile başlayan bir adres olmalıdır.');
const common={id:z.string().min(1).max(80),title:z.string().trim().min(2).max(160)};
export const contentBlockSchema=z.discriminatedUnion('type',[
  z.object({...common,type:z.literal('text'),body:z.string().trim().min(5).max(10000)}),
  z.object({...common,type:z.literal('callout'),body:z.string().trim().min(5).max(1200),linkLabel:z.string().trim().min(2).max(60),href:internalLink}),
  z.object({...common,type:z.literal('faq'),items:z.array(z.object({question:z.string().trim().min(3).max(180),answer:z.string().trim().min(5).max(2000)})).min(1).max(12)})
]);
export type ContentBlock=z.infer<typeof contentBlockSchema>;
const boolean=z.preprocess(value=>value===true||value==='true'||value==='on'||value===1,z.boolean());
export const pageSchema=z.object({
  slug:z.string().regex(/^[a-z0-9-]{2,80}$/),title:z.string().trim().min(3).max(180),body:z.string().trim().min(5).max(30000),
  status:z.enum(['draft','published','archived']),version:z.coerce.number().int().nonnegative(),
  kind:z.enum(['guide','page','home']).default('guide'),seoDescription:z.string().trim().max(300).default(''),
  showInNavigation:boolean.default(false),showInFooter:boolean.default(false),
  blocks:z.array(contentBlockSchema).max(20).default([]).refine(blocks=>new Set(blocks.map(b=>b.id)).size===blocks.length,'Bölüm kimlikleri benzersiz olmalıdır.')
}).refine(page=>(page.kind==='home')===(page.slug==='ana-sayfa'),'Ana sayfa için ana-sayfa adresini kullanın.');
export const siteSettingsSchema=z.object({
  version:z.coerce.number().int().nonnegative(),brandName:z.string().trim().min(3).max(40),
  tagline:z.string().trim().min(5).max(120),footerText:z.string().trim().min(10).max(500),
  contactEmail:z.union([z.literal(''),z.string().email()])
});
export type SiteSettings=z.infer<typeof siteSettingsSchema>;
export const defaultSiteSettings:SiteSettings={version:0,brandName:'Konferans Radar',tagline:'Araştırmanın bir sonraki adımı.',footerText:'Araştırmacılar, ekipler ve kurumlar için konferans, destek ve yayın çağrıları. Fırsatları keşfet, hazırlığını planla, kurumlarla bağlantı kur.',contactEmail:''};
