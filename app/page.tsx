import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import NewsletterForm from '@/components/NewsletterForm';

const categories = [
  {
    name: 'Sets',
    slug: 'sets',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
    desc: 'Elevated two-pieces',
  },
  {
    name: 'Dresses',
    slug: 'dresses',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80',
    desc: 'From day to evening',
  },
  {
    name: 'Jumpsuits',
    slug: 'jumpsuits',
    image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&q=80',
    desc: 'One-and-done dressing',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80',
    desc: 'The finishing touch',
  },
];

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80"
            alt="Bloomingdew Hero"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-charcoal/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-xl">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-4">
              New Collection
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-cream leading-tight mb-6">
              Wear Your
              <br />
              Story
            </h1>
            <p className="text-cream/80 text-lg mb-8 leading-relaxed">
              Handcrafted fashion for the modern woman. Every piece made with
              intention — available ready-to-wear or custom-made for you.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="bg-cream text-charcoal text-sm tracking-widest uppercase px-8 py-3 hover:bg-gold hover:text-cream transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/about#custom"
                className="border border-cream text-cream text-sm tracking-widest uppercase px-8 py-3 hover:bg-cream hover:text-charcoal transition-colors"
              >
                Custom Orders
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-3">
            Shop by Category
          </h2>
          <p className="text-warm-gray text-sm">Find your perfect look</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden aspect-[3/4]"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-charcoal/30 group-hover:bg-charcoal/20 transition-colors" />
              <div className="absolute bottom-4 left-4">
                <p className="text-cream font-display text-xl font-semibold">{cat.name}</p>
                <p className="text-cream/75 text-xs mt-0.5">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-2">
                New Arrivals
              </h2>
              <p className="text-warm-gray text-sm">Our latest pieces, just in</p>
            </div>
            <Link
              href="/shop"
              className="text-sm tracking-wide text-charcoal border-b border-charcoal hover:text-gold hover:border-gold transition-colors hidden sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[500px]">
            <Image
              src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80"
              alt="Bloomingdew brand story"
              fill
              className="object-cover"
            />
          </div>
          <div className="bg-charcoal text-cream px-10 py-16 flex flex-col justify-center">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-4">Our Story</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-6 leading-snug">
              Made with Intention,
              <br />
              Worn with Love
            </h2>
            <p className="text-cream/75 text-sm leading-relaxed mb-6">
              Bloomingdew was born from a belief that every woman deserves clothing
              that fits her perfectly — in every sense of the word. We design pieces
              that move with you, celebrate your shape, and tell your story.
            </p>
            <p className="text-cream/75 text-sm leading-relaxed mb-8">
              Each piece is handcrafted to order with premium fabrics. Not
              mass-produced — made for you.
            </p>
            <Link
              href="/about"
              className="self-start border border-cream text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-cream hover:text-charcoal transition-colors"
            >
              Our Story →
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gold/10 border-y border-border py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-3">
            Join the Community
          </h2>
          <p className="text-warm-gray text-sm mb-6">
            New arrivals, styling tips, and exclusive offers — straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
