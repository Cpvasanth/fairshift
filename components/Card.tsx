import type { Receipt } from "lucide-react";
import type { ReactNode } from "react";

// The white panel every page is built from: a titled section with an icon and an optional action on the right.
export default function Card({
  id,
  title,
  Icon,
  aside,
  children,
  className = "",
}: {
  id: string;
  title: ReactNode;
  Icon: typeof Receipt;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    // min-w-0: a grid item otherwise grows to its content's width and pushes the page sideways on phones.
    <section id={id} aria-labelledby={`${id}-h`} className={`min-w-0 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 id={`${id}-h`} className="flex items-center gap-2.5 text-xl font-semibold text-slate-950">
          <Icon aria-hidden="true" className="size-6 shrink-0" strokeWidth={1.75} />
          <span>{title}</span>
        </h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
