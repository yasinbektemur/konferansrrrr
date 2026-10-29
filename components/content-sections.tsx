import Link from 'next/link';
import type {ContentBlock} from '@/modules/content/domain/page-content';
export function ContentSections({blocks}:{blocks:ContentBlock[]}){
  return <div className="content-sections">{blocks.map(block=>block.type==='faq'?<section className="content-section content-faq" key={block.id}><h2>{block.title}</h2>{block.items.map((item,i)=><details key={i}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>:<section key={block.id} className={`content-section content-${block.type}`}><div><h2>{block.title}</h2><p>{block.body}</p></div>{block.type==='callout'&&<Link className="btn primary" href={block.href}>{block.linkLabel}</Link>}</section>)}</div>;
}
