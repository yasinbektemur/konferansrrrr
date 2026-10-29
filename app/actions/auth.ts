"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DomainError } from "@/modules/shared/domain/errors";
import { getAuthenticationService, requestUserAgent, SESSION_COOKIE } from "@/modules/identity/infrastructure/server-auth";
export type AuthActionState = { error?: string } | undefined;
async function storeSession(token: string, expiresAt: string) { (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(expiresAt) }); }
export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> { try { const result = await getAuthenticationService().register({ email: String(formData.get("email") ?? ""), displayName: String(formData.get("displayName") ?? ""), password: String(formData.get("password") ?? ""), userAgent: await requestUserAgent() }); await storeSession(result.token, result.expiresAt); } catch (error) { return { error: error instanceof DomainError ? error.message : "Hesap oluşturulamadı." }; } redirect("/"); }
export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> { try { const result = await getAuthenticationService().login({ email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? ""), userAgent: await requestUserAgent() }); await storeSession(result.token, result.expiresAt); } catch (error) { return { error: error instanceof DomainError ? error.message : "Giriş yapılamadı." }; } redirect("/"); }
export async function logoutAction() { const cookieStore = await cookies(); const token = cookieStore.get(SESSION_COOKIE)?.value; if (token) getAuthenticationService().logout(token); cookieStore.delete(SESSION_COOKIE); redirect("/"); }
