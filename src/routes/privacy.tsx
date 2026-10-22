import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & POPIA — ET-Tech" },
      { name: "description", content: "How ET-Tech collects, uses and protects your personal information under POPIA." },
      { property: "og:title", content: "Privacy & POPIA — ET-Tech" },
      { property: "og:description", content: "How ET-Tech handles your personal information (POPIA)." },
    ],
  }),
  component: Privacy,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What we collect",
    body: [
      "Account details: your email address and the display name you choose.",
      "Business listings: the business information you submit (name, description, services, contact details, location).",
      "Enquiries: your name, email and message when you contact a business through the site.",
      "Watchlists and quote submissions linked to your account.",
    ],
  },
  {
    title: "Why we collect it",
    body: [
      "To create and manage your account (POPIA basis: contract performance).",
      "To publish business listings and deliver enquiries to businesses (consent / legitimate interest).",
      "To show your saved watchlist and quotes to you (contract performance).",
      "We do not sell your personal information or send marketing you did not ask for.",
    ],
  },
  {
    title: "Who sees your information",
    body: [
      "Enquiry details are shared only with the business you contacted.",
      "Your email address is never shown publicly or given to businesses you browse.",
      "Administrators may view submissions to moderate content and verify businesses.",
      "Our infrastructure providers (hosting, database, email delivery) process data only on our instructions.",
    ],
  },
  {
    title: "Your POPIA rights",
    body: [
      "You may request access to, correction or deletion of your personal information at any time.",
      "You may withdraw consent and delete your account — contact us and we will erase your data.",
      "You may lodge a complaint with the Information Regulator of South Africa.",
      "Requests are handled free of charge within a reasonable time.",
    ],
  },
  {
    title: "Security & retention",
    body: [
      "Data is stored encrypted in transit and at rest on managed infrastructure.",
      "We keep your data only while your account is active, or as long as the law requires.",
      "Cookies/local storage are used only to keep you signed in — no third-party ad trackers.",
    ],
  },
];

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-6xl">Privacy notice</h1>
      <p className="mt-2 text-muted-foreground">POPIA-compliant summary — last updated October 2026.</p>
      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-10">
          <h2 className="font-display text-3xl">{s.title}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {s.body.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </section>
      ))}
      <p className="mt-12 text-sm text-muted-foreground">
        Questions or data requests: <span className="text-foreground">privacy@et-tech.co.za</span>
      </p>
    </div>
  );
}
