import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Minimal accordion. `items` is an array of { id, title, content }.
 * `defaultOpen` accepts an item id.
 */
export default function Accordion({ items = [], defaultOpen = null }) {
  const [openId, setOpenId] = useState(defaultOpen);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={`panel-${item.id}`}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-sans text-[11px] font-normal uppercase tracking-[0.22em] text-ink">
                  {item.title}
                </span>
                <span className="text-muted transition-colors group-hover:text-ink">
                  {isOpen ? (
                    <Minus size={15} strokeWidth={1.4} />
                  ) : (
                    <Plus size={15} strokeWidth={1.4} />
                  )}
                </span>
              </button>
            </h3>
            <div
              id={`panel-${item.id}`}
              hidden={!isOpen}
              className="animate-fade-in pb-6 text-sm leading-relaxed text-slate"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
