import { Receipt } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; Icon: typeof Receipt; current?: boolean };

// Phones show the section links as equal columns, so none is clipped off-screen.
const cols = ["", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"];

// Shared sticky header: logo, optional in-page section nav, and page actions on the right.
export default function TopBar({
  nav = [],
  navLabel,
  width = "max-w-[1400px]",
  children,
}: {
  nav?: NavItem[];
  navLabel?: string;
  width?: string;
  children: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className={`mx-auto flex ${width} flex-wrap items-center gap-4 px-4 py-3`}>
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-950">
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Receipt aria-hidden="true" className="size-5" />
          </span>
          FairShift
        </Link>
        {nav.length > 0 && (
          <nav aria-label={navLabel} className={`order-3 grid w-full ${cols[nav.length]} gap-1 sm:flex lg:order-none lg:mx-auto lg:w-auto`}>
            {nav.map(({ href, label, Icon, current }) => (
              <a
                key={href}
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-1 text-center text-[13px] leading-tight font-semibold sm:px-4 sm:text-sm ${current ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              >
                <Icon aria-hidden="true" className="hidden size-4 sm:block" />
                {label}
              </a>
            ))}
          </nav>
        )}
        <div className={`ml-auto flex items-center gap-3 ${nav.length ? "lg:ml-0" : ""}`}>{children}</div>
      </div>
    </header>
  );
}
