import PageMeta from '../components/PageMeta';
import Hero from '../components/home/Hero';
import CategoryShowcase from '../components/home/CategoryShowcase';
import NewArrivals from '../components/home/NewArrivals';
import PromoBanner from '../components/home/PromoBanner';
import FeaturedCollection from '../components/home/FeaturedCollection';
import BestSellers from '../components/home/BestSellers';
import ValueProps from '../components/home/ValueProps';
import Testimonials from '../components/home/Testimonials';
import InstagramGrid from '../components/home/InstagramGrid';

export default function Home() {
  return (
    <>
      <PageMeta
        title="Premium Fashion"
        description="VERA is a premium fashion label with curated dresses, shirts, denim, jackets and accessories for women and men. Style That Speaks."
      />
      <Hero />
      <CategoryShowcase />
      <NewArrivals />
      <PromoBanner />
      <FeaturedCollection />
      <BestSellers />
      <ValueProps />
      <Testimonials />
      <InstagramGrid />
    </>
  );
}
