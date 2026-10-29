"use client";
import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";

export function AuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginForm, pendingLogin] = useActionState(loginAction, undefined);
  const [registerState, registerForm, pendingRegister] = useActionState(registerAction, undefined);
  const state = mode === "login" ? loginState : registerState;
  return <div className="auth-card">
    <span className="eyebrow">Güvenli çalışma alanı</span><h1 style={{fontSize:31}}>Radar hesabın</h1>
    <p className="lede" style={{marginBottom:25}}>Takiplerini ve başvuru planını cihazındaki yerel veritabanında sakla.</p>
    <div className="auth-tabs"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Giriş</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Yeni hesap</button></div>
    <form className="form-stack" action={mode === "login" ? loginForm : registerForm}>
      {mode === "register" && <label>Ad soyad<input className="field" name="displayName" required autoComplete="name"/></label>}
      <label>E-posta<input className="field" type="email" name="email" required autoComplete="email"/></label>
      <label>Parola<input className="field" type="password" name="password" required minLength={12} autoComplete={mode === "login" ? "current-password" : "new-password"}/><span className="form-help">En az 12 karakter kullan.</span></label>
      {state?.error && <div className="error">{state.error}</div>}
      <button className="btn primary" disabled={pendingLogin || pendingRegister}>{pendingLogin || pendingRegister ? "İşleniyor…" : mode === "login" ? "Çalışma alanına gir" : "Hesabı oluştur"}</button>
    </form>
  </div>;
}
