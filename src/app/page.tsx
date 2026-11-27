const endpoints = [
  { method: "GET", path: "/api/tables", desc: "List active tables for the floor plan" },
  { method: "GET", path: "/api/menu", desc: "List categories and menu items" },
  { method: "GET", path: "/api/slots", desc: "List active time slots" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">
          Brew & Book
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-primary-dark sm:text-5xl">
          Coffee shop booking platform foundation
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          Day 1 setup: Next.js + Tailwind, Prisma/PostgreSQL schema, seed data,
          coffee/cream theme, Bangla font support, and read-only APIs for
          tables, menu, and slots.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="text-2xl font-semibold text-primary">15</div>
            <div className="mt-1 text-sm text-muted">Seeded tables</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="text-2xl font-semibold text-primary">25</div>
            <div className="mt-1 text-sm text-muted">Menu items</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="text-2xl font-semibold text-primary">9</div>
            <div className="mt-1 text-sm text-muted">Time slots</div>
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-primary-dark">Day 1 APIs</h2>
          <div className="mt-4 divide-y divide-border">
            {endpoints.map((e) => (
              <div key={e.path} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className="inline-flex w-fit rounded-md bg-surface-alt px-2 py-1 text-xs font-semibold text-primary">
                  {e.method}
                </span>
                <code className="text-sm text-foreground">{e.path}</code>
                <span className="text-sm text-muted">{e.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 text-sm text-muted">
          Next: Day 2 - interactive SVG floor plan, menu panel, and admin menu management.
        </p>
      </div>
    </main>
  );
}
