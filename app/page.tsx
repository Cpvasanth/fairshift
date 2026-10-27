import Link from "next/link";
import { packs } from "@/lib/rules";
import { workers } from "@/lib/seed";

export default function Home() {
  return (
    <main id="main" className="mx-auto w-full max-w-xl space-y-6 p-4">
      <header>
        <h1 className="text-3xl font-bold">FairShift</h1>
        <p className="text-lg">Every shift gets a receipt.</p>
        <p className="text-gray-700">
          The worker&apos;s phone is a second register: their own copy of hours, pay math and every report they make.
        </p>
      </header>

      {Object.values(packs).map((p) => (
        <section key={p.id} aria-labelledby={`${p.id}-h`} className="space-y-2">
          <h2 id={`${p.id}-h`} className="text-xl font-bold">
            {p.industry} · {p.site}
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {Object.values(workers)
              .filter((w) => w.packId === p.id)
              .map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/w/${w.id}`}
                    className="flex min-h-28 flex-col justify-center rounded-xl border-2 border-gray-900 p-4 text-lg font-bold"
                  >
                    {w.name}
                    <span className="text-base font-normal text-gray-700">{w.role}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <Link href="/admin" className="block min-h-12 rounded-xl bg-gray-900 p-4 text-center text-lg font-bold text-white">
        Admin dashboard
      </Link>

      <p className="text-gray-700">
        Cross-industry: each site runs on a rule pack (wage basis, overtime rule, hazard categories, severity floors). A hospital
        or factory is one more rule pack, with no code changes.
      </p>
    </main>
  );
}
