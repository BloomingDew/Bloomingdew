import { supabase } from './supabase';

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  category: string;
  category_slug: string;
  available: boolean;
  made_to_order: boolean;
  lead_time: string;
  fabric: string;
  care_instructions: string;
  sizes: string[];
  images: { url: string; alt_text: string; position: number }[];
};

export async function getProducts(categorySlug?: string): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(url, alt_text, position)
    `)
    .eq('available', true)
    .order('created_at', { ascending: false });

  if (categorySlug && categorySlug !== 'all') {
    query = query.eq('categories.slug', categorySlug);
  }

  const { data, error } = await query;
  if (error) { console.error(error); return []; }

  return (data || []).map(normalise).filter(Boolean) as Product[];
}

export async function getProductById(id: number): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(url, alt_text, position)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return normalise(data);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(url, alt_text, position)
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return normalise(data);
}

function normalise(data: any): Product {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    price: data.price,
    discount: data.discount || 0,
    category: data.categories?.name || '',
    category_slug: data.categories?.slug || '',
    available: data.available,
    made_to_order: data.made_to_order,
    lead_time: data.lead_time,
    fabric: data.fabric || '',
    care_instructions: data.care_instructions || '',
    sizes: data.sizes || ['XS', 'S', 'M', 'L', 'XL'],
    images: (data.product_images || []).sort((a: any, b: any) => a.position - b.position),
  };
}
