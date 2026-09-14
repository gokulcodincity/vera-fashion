import Modal from './Modal';
import { infoPages } from '../data/infoPages';
import { store } from '../config/store';

const GUIDE = infoPages['size-guide'];

/** Size tables lifted straight from the size guide page content. */
export default function SizeGuideModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Size Guide" size="lg" description={GUIDE.intro}>
      <div className="mt-8 space-y-9">
        {GUIDE.sections
          .filter((section) => section.table)
          .map((section) => (
            <div key={section.heading}>
              <h3 className="mb-3 font-sans text-[10px] font-normal uppercase tracking-[0.22em] text-ink">
                {section.heading}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[22rem] border-collapse text-sm">
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
            </div>
          ))}

        <p className="border-t border-line pt-6 text-sm text-slate">
          Between two sizes? Message us on WhatsApp at {store.phone} and our stylists will help you
          choose.
        </p>
      </div>
    </Modal>
  );
}
