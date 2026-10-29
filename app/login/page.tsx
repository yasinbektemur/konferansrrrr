import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { getCurrentUser } from "@/modules/identity/infrastructure/server-auth";

export const metadata: Metadata = { title: "Giriş" };
export default async function LoginPage(){ if(await getCurrentUser()) redirect("/"); return <div className="auth-page"><section className="auth-story"><span className="eyebrow" style={{color:"#74d5ca"}}>Kişisel araştırma operasyonu</span><h1>Fırsatı bul.<br/>Takvimi yönet.<br/>Başvuruyu bitir.</h1><p>Dağınık çağrı sayfalarını sürekli kontrol etmek yerine araştırma fırsatlarını doğrulanmış ilişkileriyle birlikte tek radarda tut.</p><div className="auth-points"><div><b>01</b><span>Fırsat ve son tarih ilişkisi</span></div><div><b>02</b><span>Kişisel başvuru panosu</span></div><div><b>03</b><span>Yerel, taşınabilir veri</span></div></div></section><section className="auth-form-wrap"><AuthPanel/></section></div>; }
