"use client";
import { useRef } from "react";
import Link from "next/link";
import type { OpportunityProps } from "@/modules/opportunities/domain/opportunity";
import { CloseIcon, ExternalIcon, SearchIcon } from "./icons";

export function OpportunityPreview({ opportunity }: { opportunity: OpportunityProps }) {
  const ref = useRef<HTMLDialogElement>(null);
  const deadline = [...opportunity.deadlines].sort((a,b) => a.dueAt.localeCompare(b.dueAt))[0];
  return <><button className="icon-btn" onClick={() => ref.current?.showModal()} aria-label="Hızlı incele"><SearchIcon/></button><dialog className="preview" ref={ref} onClick={(event) => { if (event.target === ref.current) ref.current.close(); }}>
    <div className="preview-head"><div><div className="eyebrow">Hızlı inceleme · {typeName(opportunity.type)}</div><h2>{opportunity.title}</h2></div><button className="icon-btn" onClick={() => ref.current?.close()} aria-label="Kapat"><CloseIcon/></button></div>
    <div className="preview-body"><p className="lede">{opportunity.summary}</p><div className="preview-facts"><div>En yakın son tarih<b>{deadline ? formatDate(deadline.dueAt) : "Belirtilmemiş"}</b></div><div>Konum<b>{[opportunity.city, opportunity.country].filter(Boolean).join(", ") || "Çevrim içi"}</b></div><div>Kaynak güveni<b>%{opportunity.confidenceScore} · {opportunity.sourceName}</b></div></div><div>{opportunity.topics.map(topic => <span className="tag" key={topic}>{topic}</span>)}</div><div className="preview-actions"><a className="btn" href={opportunity.officialUrl} target="_blank" rel="noreferrer">Resmî kaynak <ExternalIcon/></a><Link className="btn primary" href={`/conference/${opportunity.id}`}>Detayları aç</Link></div></div>
  </dialog></>;
}
function formatDate(value: string) { return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
function typeName(type: string) { return ({ conference:"Konferans", workshop:"Çalıştay", grant:"Hibe", fellowship:"Burs", competition:"Yarışma", fair:"Fuar", special_issue:"Özel sayı", award:"Ödül" } as Record<string,string>)[type] ?? type; }
