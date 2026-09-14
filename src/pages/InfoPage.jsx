import { Navigate, useParams } from 'react-router-dom';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { getInfoPage } from '../data/infoPages';
import { store, whatsappLink } from '../config/store';

/** Renders the policy and help pages linked from the footer. */
export default function InfoPage() {
  const { slug } = useParams();
  const page = getInfoPage(slug);

  if (!page) return <Navigate to="/not-found" replace />;

  return (
    <>
      <PageMeta title={page.title} description={page.intro} />

      <div className="shell pt-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: page.title }]} />
      </div>

      <div className="shell pb-24 pt-7">
        <div className="max-w-3xl">
          <p className="eyebrow">{page.eyebrow}</p>
          <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-[3.2rem]">{page.title}</h1>
          <p className="mt-6 text-base leading-relaxed text-slate">{page.intro}</p>

          <div className="mt-12 space-y-10">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-2xl text-ink sm:text-[1.75rem]">
                  {section.heading}
                </h2>

                {section.body && (
                  <ul className="mt-4 space-y-2.5">
                    {section.body.map((line) => (
                      <li key={line} className="flex gap-3 text-sm leading-relaxed text-slate">
                        <span
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-clay"
                          aria-hidden="true"
                        />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}

                {section.table && (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[24rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-y border-line bg-sand/60 text-left">
                          {section.table.head.map((cell) => (
                            <th
                              key={cell}
                              scope="col"
                              className="px-3 py-2.5 text-[10px] font-normal uppercase tracking-[0.16em] text-slate"
                            >
                              {cell}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row[0]} className="border-b border-line/70">
                            {row.map((cell, index) => (
                              <td
                                key={`${row[0]}-${index}`}
                                className={
                                  index === 0
                                    ? 'px-3 py-2.5 uppercase tracking-[0.08em] text-ink'
                                    : 'px-3 py-2.5 tabular-nums text-slate'
                                }
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>

          <div className="mt-14 border-t border-line pt-8">
            <h2 className="font-display text-2xl text-ink">Still need a hand?</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              Our team is on WhatsApp at {store.phone} and replies within a working day.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                href={whatsappLink()}
                target="_blank"
                rel="noreferrer noopener"
              >
                Message us
              </Button>
              <Button to="/contact" variant="outline">
                Contact page
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
