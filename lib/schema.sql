-- Categories table
create table if not exists categories (
  id serial primary key,
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default now()
);

-- Products table
create table if not exists products (
  id serial primary key,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null,
  category_id integer references categories(id),
  available boolean default true,
  made_to_order boolean default true,
  lead_time text default '2–4 weeks',
  fabric text,
  care_instructions text,
  sizes text[] default array['XS','S','M','L','XL'],
  created_at timestamp with time zone default now()
);

-- Product images table
create table if not exists product_images (
  id serial primary key,
  product_id integer references products(id) on delete cascade,
  url text not null,
  alt_text text,
  position integer default 0,
  created_at timestamp with time zone default now()
);

-- Seed categories
insert into categories (name, slug) values
  ('New In', 'new-in'),
  ('Dresses', 'dresses'),
  ('Sets', 'sets'),
  ('Tops', 'tops'),
  ('Skirts', 'skirts'),
  ('Trousers', 'trousers')
on conflict (slug) do nothing;

-- Seed products
insert into products (name, slug, description, price, category_id, fabric, care_instructions) values
  ('Linen Wrap Dress', 'linen-wrap-dress', 'A beautifully draped wrap dress cut from 100% natural linen. Effortlessly elegant — wear it dressed up or down. Handmade to order.', 120.00, (select id from categories where slug = 'dresses'), '100% Natural Linen', 'Hand wash cold'),
  ('Ivory Slip Set', 'ivory-slip-set', 'A matching slip skirt and cami top set in soft ivory. Minimal, feminine, and endlessly versatile.', 95.00, (select id from categories where slug = 'sets'), 'Satin-finish fabric', 'Dry clean only'),
  ('Blush Midi Skirt', 'blush-midi-skirt', 'A soft blush midi skirt with a floaty silhouette. Cut on the bias for natural movement.', 75.00, (select id from categories where slug = 'skirts'), 'Chiffon blend', 'Hand wash cold'),
  ('Cream Corset Top', 'cream-corset-top', 'A structured corset top in warm cream. Boning detail at the front, adjustable lace-up back.', 60.00, (select id from categories where slug = 'tops'), 'Cotton sateen', 'Dry clean only'),
  ('Champagne Maxi Dress', 'champagne-maxi-dress', 'Floor-length and flowing in a warm champagne tone. A showstopper made for special occasions.', 145.00, (select id from categories where slug = 'dresses'), 'Silk-touch fabric', 'Dry clean only'),
  ('Nude Linen Set', 'nude-linen-set', 'A relaxed co-ord set in nude linen. Wide-leg trousers and a sleeveless top.', 110.00, (select id from categories where slug = 'sets'), '100% Natural Linen', 'Hand wash cold'),
  ('Dusty Rose Blouse', 'dusty-rose-blouse', 'A delicate blouse in dusty rose with a relaxed, feminine silhouette.', 65.00, (select id from categories where slug = 'tops'), 'Washed silk blend', 'Hand wash cold'),
  ('Satin Slip Dress', 'satin-slip-dress', 'A silky slip dress that moves with you. Clean lines, minimal detail, maximum impact.', 130.00, (select id from categories where slug = 'new-in'), 'Satin finish', 'Dry clean only'),
  ('Tailored Wide Trousers', 'tailored-wide-trousers', 'Wide-leg trousers with a sharp tailored waistband. Flattering, comfortable, and made to last.', 85.00, (select id from categories where slug = 'trousers'), 'Crepe fabric', 'Dry clean only')
on conflict (slug) do nothing;

-- Storage bucket for product images (run separately if needed)
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
