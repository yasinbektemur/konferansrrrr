import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
import "./surfaces.css";
import "./marketplace.css";
import "./portal.css";
import "./transfer.css";
import "./tour.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Konferans Radar", template: "%s · Konferans Radar" },
  description: "Araştırmacılar için konferans, hibe, burs ve yayın fırsatı istihbaratı.",
  applicationName: "Konferans Radar",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="tr"><body><AppShell>{children}</AppShell></body></html>;
}
