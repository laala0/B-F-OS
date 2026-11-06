/* eslint-disable @next/next/no-img-element -- photos come from a public bucket, not the repo */
import type { Metadata } from "next";
import { sitePhoto } from "@/lib/domain/form2finish";
import { LeadForm } from "./lead-form";

export const metadata: Metadata = {
  title: "Form2Finish: concrete and finish work, Metro Vancouver",
  description:
    "Give us the problem. One accountable team, form to finish, for engineers and strata managers in Metro Vancouver.",
};

const PROBLEMS = [
  {
    title: "Walls on tight sites",
    body: "Forming, rebar and pours for walls, planters and stepped footings, on slopes and between existing buildings.",
  },
  {
    title: "Slabs and patches",
    body: "Saw-cut, patch and trowel finish that sits flush with the floor around it.",
  },
  {
    title: "Driveways, walkways, stairs",
    body: "Dig out, form, pour and finish, right up against the building.",
  },
  {
    title: "Foundations and footings",
    body: "Layout, forms, rebar and pump day, from a house to a 123-space childcare centre.",
  },
  {
    title: "Work around piles",
    body: "Forming, rebar and pours around drilled piles.",
  },
  {
    title: "Final finish",
    body: "Trowel, float, patch, polished and broom.",
  },
];

const CHAIN = [
  { stage: "Layout and forming", by: "Boss & Friends" },
  { stage: "Rebar", by: "Boss & Friends" },
  { stage: "Pour", by: "Boss & Friends" },
  { stage: "Final finish", by: "Form2Finish" },
];

const WORK = [
  { where: "Cranbrook", what: "Childcare centre, 123 spaces: footings, walls, rebar, pours", by: "Boss & Friends" },
  { where: "Maple Ridge", what: "Commercial site: forming, rebar and pour around drilled piles, road and entrance", by: "Boss & Friends" },
  { where: "West Kelowna", what: "Waterfront wall pour by boom pump", by: "Boss & Friends" },
  { where: "New Westminster", what: "Slab and pit patches: saw-cut, poured, trowel finished", by: "Form2Finish" },
  { where: "Surrey", what: "Planter and sonotube column forms on a slope", by: "Boss & Friends" },
];

const METHOD = [
  { title: "See the problem first", body: "The site, the drawings, and what the engineer is actually trying to solve." },
  { title: "Options in dollars", body: "What each fix costs now, and what waiting costs later." },
  { title: "One scope, one team", body: "No hand-offs to chase. One accountable contact from form to finish." },
  { title: "A record you can file", body: "Dated photos of every stage, by job, so nothing gets buried without proof." },
];

const PHOTOS = [
  { name: "forms-rebar", alt: "Rebar tied inside timber forms on a footing" },
  { name: "rebar-check", alt: "Tape measure on a rebar mat, checking cover over gravel" },
  { name: "pump-pour", alt: "Boom pump placing concrete into wall forms beside a lake" },
  { name: "slab-finish", alt: "Freshly finished concrete slab inside a framed building" },
];

export default function CapabilityPage() {
  return (
    <div className="flex-1 bg-[#f4f1ea] text-[#15181b] print:bg-white">
      {/* The PDF is this page printed: one letter sheet, no photos, no form. */}
      <style>{"@page { size: letter; margin: 0.4in 0.25in; }"}</style>
      <header className="bg-[#15181b] text-[#f4f1ea] print:bg-white print:text-[#15181b]">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-8 sm:pb-20 print:pb-1">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-[family-name:var(--font-display)] text-xl tracking-wide">FORM2FINISH</p>
            <p className="text-sm text-[#a5a29b] print:text-[#15181b]">Metro Vancouver, BC</p>
          </div>
          <h1 className="mt-14 font-[family-name:var(--font-display)] text-6xl uppercase leading-[0.95] sm:text-8xl lg:text-9xl print:mt-1 print:text-4xl">
            Give us the problem.
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-[#d8d5ce] sm:text-2xl print:mt-1 print:text-base print:text-[#15181b]">
            One accountable team, form to finish. Concrete and finish work for engineers and strata managers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <a
              href="#contact"
              className="bg-[#ff6b1a] px-6 py-3 font-semibold text-[#15181b] transition-colors hover:bg-[#ff8340]"
            >
              Tell us the problem
            </a>
            <a
              href="/form2finish-capability.pdf"
              className="border border-[#5a5f64] px-6 py-3 font-semibold transition-colors hover:border-[#f4f1ea]"
            >
              Download the PDF
            </a>
          </div>
        </div>
      </header>

      <section aria-label="Recent work" className="print:hidden">
        <div className="grid grid-cols-2 gap-1 bg-[#15181b] lg:grid-cols-4">
          {PHOTOS.map((photo) => (
            <img
              key={photo.name}
              src={sitePhoto(photo.name)}
              alt={photo.alt}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 sm:px-8">
        <section className="py-14 sm:py-20 print:py-2">
          <h2 className="font-[family-name:var(--font-display)] text-4xl uppercase sm:text-5xl print:text-xl">
            What we get called for
          </h2>
          <ul className="mt-8 grid gap-px bg-[#cfcbc1] sm:grid-cols-2 lg:grid-cols-3 print:mt-1 print:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <li key={problem.title} className="bg-[#f4f1ea] p-5 print:bg-white print:p-1.5">
                <h3 className="text-lg font-bold print:text-sm">{problem.title}</h3>
                <p className="mt-1 text-[#454a4f] print:text-xs">{problem.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-[#cfcbc1] py-14 sm:py-20 print:py-2">
          <h2 className="font-[family-name:var(--font-display)] text-4xl uppercase sm:text-5xl print:text-xl">
            Form to finish, clearly named
          </h2>
          <ol className="mt-8 grid grid-cols-2 gap-1 sm:grid-cols-4 print:mt-1">
            {CHAIN.map((link) => {
              const finish = link.by === "Form2Finish";
              return (
                <li
                  key={link.stage}
                  className={
                    finish
                      ? "bg-[#ff6b1a] p-4 text-[#15181b] print:border print:border-[#15181b] print:bg-white print:p-1.5"
                      : "bg-[#15181b] p-4 text-[#f4f1ea] print:border print:border-[#15181b] print:bg-white print:p-1.5 print:text-[#15181b]"
                  }
                >
                  <p className="font-bold print:text-xs">{link.stage}</p>
                  <p className="mt-6 text-sm opacity-80 print:mt-0 print:text-xs">{link.by}</p>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 max-w-3xl text-lg text-[#454a4f] print:mt-1 print:text-xs">
            Boss &amp; Friends Construction Ltd. carries out forming, rebar and pours. Form2Finish does the final finish
            and is your one point of contact.
          </p>
        </section>

        <section className="border-t border-[#cfcbc1] py-14 sm:py-20 print:py-2">
          <h2 className="font-[family-name:var(--font-display)] text-4xl uppercase sm:text-5xl print:text-xl">
            Selected work
          </h2>
          <table className="mt-8 w-full border-collapse text-left print:mt-1 print:text-xs">
            <thead className="sr-only">
              <tr>
                <th>Where</th>
                <th>What</th>
                <th>Done by</th>
              </tr>
            </thead>
            <tbody>
              {WORK.map((job) => (
                <tr key={job.where} className="border-b border-[#cfcbc1] align-top">
                  <th scope="row" className="w-36 py-3 pr-4 font-bold sm:w-48 print:w-28 print:py-1">
                    {job.where}
                  </th>
                  <td className="py-3 pr-4 text-[#454a4f] print:py-1">{job.what}</td>
                  <td className="hidden w-44 py-3 text-sm text-[#6a6f74] sm:table-cell print:table-cell print:w-28 print:py-1 print:text-xs">
                    {job.by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border-t border-[#cfcbc1] py-14 sm:py-20 print:py-2">
          <h2 className="font-[family-name:var(--font-display)] text-4xl uppercase sm:text-5xl print:text-xl">
            How we work
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 print:mt-1 print:grid-cols-4 print:gap-3">
            {METHOD.map((step, i) => (
              <li key={step.title}>
                <p className="font-[family-name:var(--font-display)] text-4xl text-[#ff6b1a] print:text-xl">{i + 1}</p>
                <h3 className="mt-2 text-lg font-bold print:mt-0 print:text-sm">{step.title}</h3>
                <p className="mt-1 text-[#454a4f] print:text-xs">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-10 border-t border-[#cfcbc1] py-14 sm:py-20 lg:grid-cols-2 print:grid-cols-2 print:gap-6 print:py-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-4xl uppercase print:text-xl">Behind it</h2>
            <p className="mt-4 text-lg text-[#454a4f] print:mt-1 print:text-xs">
              Six years on the tools. Drywall and renovation across Ontario, from washrooms and basements to a large
              estate home, then concrete in Vancouver, starting on the pump. A finisher who has poured knows what a bad
              pour costs. That&apos;s why we think about the hand-offs before they happen.
            </p>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-4xl uppercase print:text-xl">
              Outside Metro Vancouver
            </h2>
            <p className="mt-4 text-lg text-[#454a4f] print:mt-1 print:text-xs">
              We can refer independent, trusted teams in Windsor, Ontario and Halifax, Nova Scotia.
            </p>
          </div>
        </section>
      </main>

      <section id="contact" className="bg-[#15181b] text-[#f4f1ea] print:hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-5xl uppercase leading-none">
              What&apos;s the problem?
            </h2>
            <p className="mt-4 text-lg text-[#c9c6bf]">A wall, a slab, a slope, a leak. Tell us what you&apos;re looking at.</p>
          </div>
          <LeadForm />
        </div>
      </section>

      <footer className="bg-[#15181b] px-4 pb-8 text-sm text-[#8b9096] sm:px-8 print:hidden">
        <p className="mx-auto max-w-6xl">Form2Finish · Metro Vancouver, BC</p>
      </footer>
    </div>
  );
}
