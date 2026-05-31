import type { Product } from './types';

export const products: Product[] = [
  {
    id: '1',
    slug: 'silk-wrap-dress',
    name: 'Silk Wrap Dress',
    price: 18900,
    category: 'dresses',
    description:
      'A timeless wrap silhouette crafted from lightweight silk. Effortlessly transitions from a day brunch to an evening out. The adjustable tie allows for a custom fit every time.',
    details: [
      'Lightweight 100% silk fabric',
      'Adjustable wrap tie at waist',
      'Deep V-neckline with flutter sleeves',
      'Falls to mid-calf length',
      'Available in ready-to-wear and custom sizing',
      'Dry clean or gentle hand wash',
    ],
    fabric: '100% Silk',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'],
    colors: ['Ivory', 'Onyx', 'Dusty Rose'],
    inStock: true,
    featured: true,
  },
  {
    id: '2',
    slug: 'crepe-coord-set',
    name: 'Crepe Co-ord Set',
    price: 16500,
    category: 'sets',
    description:
      'A sophisticated two-piece set in premium lightweight crepe. The relaxed crop top and wide-leg trousers create an effortlessly chic look that works for any occasion.',
    details: [
      'Lightweight crepe fabric — perfect for warm days',
      'Crop top with subtle ruched detail',
      'High-waist wide-leg trousers',
      'Elastic waistband for comfort',
      'Available in ready-to-wear and custom sizing',
      'Machine washable on gentle cycle',
    ],
    fabric: '95% Polyester, 5% Elastane Crepe',
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'],
    colors: ['Cream', 'Sage', 'Black'],
    inStock: true,
    featured: true,
  },
  {
    id: '3',
    slug: 'linen-two-piece-set',
    name: 'Linen Two-Piece Set',
    price: 14500,
    category: 'sets',
    description:
      'Relaxed linen tailoring at its finest. This breathable two-piece features a relaxed button-down top and matching wide-leg trousers — the perfect warm-weather ensemble.',
    details: [
      'Premium linen blend fabric',
      'Oversized button-down top',
      'Matching wide-leg trousers with pockets',
      'Naturally breathable — ideal for warm climates',
      'Washes beautifully and softens with each wash',
    ],
    fabric: '55% Linen, 45% Cotton',
    images: [
      'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'],
    colors: ['Natural', 'White', 'Camel'],
    inStock: true,
    featured: false,
  },
  {
    id: '4',
    slug: 'tailored-jumpsuit',
    name: 'Tailored Jumpsuit',
    price: 19900,
    category: 'jumpsuits',
    description:
      'One-and-done dressing, elevated. This sleek tailored jumpsuit features a cinched waist, wide legs, and a clean crew neckline — structured enough for the office, stunning enough for dinner.',
    details: [
      'Structured crepe fabric with subtle sheen',
      'Crew neckline with hidden zip closure',
      'Cinched waist with self-belt',
      'Wide cropped leg',
      'Side pockets',
      'Dry clean recommended',
    ],
    fabric: 'Structured Crepe — 70% Viscose, 30% Polyester',
    images: [
      'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'],
    colors: ['Black', 'Ivory', 'Navy'],
    inStock: true,
    featured: true,
  },
  {
    id: '5',
    slug: 'summer-mini-dress',
    name: 'Summer Mini Dress',
    price: 12900,
    category: 'dresses',
    description:
      'Lightweight and effortlessly feminine. This flowy mini dress is cut from soft chiffon with delicate flutter sleeves — your go-to for warm days and late evenings.',
    details: [
      'Soft chiffon fabric with fluid drape',
      'Flutter sleeve with tie detail',
      'A-line silhouette',
      'Mini length',
      'Fully lined',
      'Hand wash or dry clean',
    ],
    fabric: '100% Chiffon (Polyester)',
    images: [
      'https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=800&q=80',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'],
    colors: ['Blush', 'White', 'Terracotta'],
    inStock: true,
    featured: false,
  },
  {
    id: '6',
    slug: 'structured-blazer-set',
    name: 'Structured Blazer Set',
    price: 22000,
    category: 'sets',
    description:
      'Power dressing, redefined. This double-breasted blazer and matching wide-leg trouser set is impeccably tailored and turns heads in every room.',
    details: [
      'Premium wool-blend suiting fabric',
      'Double-breasted blazer with gold-tone buttons',
      'Matching high-waist wide-leg trousers',
      'Fully lined blazer',
      'Side pockets on trousers',
      'Dry clean only',
    ],
    fabric: '80% Wool, 20% Polyester Blend',
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'],
    colors: ['Black', 'Camel', 'Ivory'],
    inStock: true,
    featured: true,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: Product['category']): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}
