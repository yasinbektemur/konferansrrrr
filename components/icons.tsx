import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function RadarIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18.6 5.4M12 3v2M21 12h-2M12 21v-2M3 12h2"/><circle cx="16" cy="8" r="1.4" fill="currentColor" stroke="none"/></svg>; }
export function SearchIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }
export function CalendarIcon(props: IconProps) { return <svg {...base} {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>; }
export function MapIcon(props: IconProps) { return <svg {...base} {...props}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></svg>; }
export function BriefcaseIcon(props: IconProps) { return <svg {...base} {...props}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></svg>; }
export function BookmarkIcon(props: IconProps) { return <svg {...base} {...props}><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4Z"/></svg>; }
export function ShieldIcon(props: IconProps) { return <svg {...base} {...props}><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>; }
export function SettingsIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>; }
export function ChevronIcon(props: IconProps) { return <svg {...base} {...props}><path d="m9 18 6-6-6-6"/></svg>; }
export function ExternalIcon(props: IconProps) { return <svg {...base} {...props}><path d="M15 3h6v6M10 14 21 3M18 13v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h7"/></svg>; }
export function MenuIcon(props: IconProps) { return <svg {...base} {...props}><path d="M4 7h16M4 12h16M4 17h16"/></svg>; }
export function CloseIcon(props: IconProps) { return <svg {...base} {...props}><path d="m6 6 12 12M18 6 6 18"/></svg>; }
export function BuildingIcon(props:IconProps){return <svg {...base} {...props}><path d="M4 21V5l8-3v19M12 8h8v13M2 21h20M7 7h2M7 11h2M7 15h2M15 11h2M15 15h2M15 19h2"/></svg>;}
export function BookIcon(props:IconProps){return <svg {...base} {...props}><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15M5 8h4M5 12h4M15 8h4M15 12h4"/></svg>;}
export function UserIcon(props:IconProps){return <svg {...base} {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>;}
export function BellIcon(props:IconProps){return <svg {...base} {...props}><path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 22h4"/></svg>;}
export function LayersIcon(props:IconProps){return <svg {...base} {...props}><path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/></svg>;}
export function ChartIcon(props:IconProps){return <svg {...base} {...props}><path d="M3 3v18h18M7 16v-5M12 16V7M17 16v-8"/></svg>;}
export function ArrowIcon(props:IconProps){return <svg {...base} {...props}><path d="M4 12h16m-6-6 6 6-6 6"/></svg>;}
export function GlobeIcon(props:IconProps){return <svg {...base} {...props}><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></svg>;}
