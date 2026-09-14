import Rating from '../Rating';
import Reveal from '../Reveal';
import SectionHeading from '../SectionHeading';
import { testimonials } from '../../data/reviews';

export default function Testimonials() {
  return (
    <section className="shell py-20 lg:py-28" aria-labelledby="reviews-heading">
      <SectionHeading
        eyebrow="Customer Love"
        title="What our customers say"
        titleId="reviews-heading"
        subtitle="Verified reviews from shoppers across India."
        align="center"
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((testimonial, index) => (
          <Reveal key={testimonial.name} delay={index * 80}>
            <figure className="flex h-full flex-col border border-line bg-white p-6">
              <Rating value={testimonial.rating} size={13} />
              <blockquote className="mt-4 flex-1 font-display text-lg leading-snug text-ink">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-6 border-t border-line pt-4">
                <span className="block text-[11px] uppercase tracking-[0.18em] text-ink">
                  {testimonial.name}
                </span>
                <span className="mt-1 block text-xs text-muted">{testimonial.location}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
