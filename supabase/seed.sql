-- seed.sql
-- Run after 0001_init.sql to populate the same catalogue used in Phase 2's
-- mock data, so the storefront looks identical once it's reading from
-- Supabase instead of lib/data/products.ts.

insert into categories (name, slug) values
  ('Kitchen', 'kitchen'),
  ('Home', 'home'),
  ('Desk', 'desk'),
  ('Bath', 'bath');

-- Products: one insert per row, pulling the category id by slug so this
-- file doesn't depend on generated uuids matching anything.
with cat as (select id, slug from categories)
insert into products (name, slug, description, price_cents, sku, stock_qty, category_id, is_published)
select v.name, v.slug, v.description, v.price_cents, v.sku, v.stock_qty, cat.id, true
from (values
  ('Cast Iron Skillet, 10in', 'cast-iron-skillet-10in',
   'Pre-seasoned cast iron skillet that goes from stovetop to oven. Gets better with every use.',
   1850000, 'KIT-CI-010', 14, 'kitchen'),
  ('Stoneware Mixing Bowl Set (3)', 'stoneware-mixing-bowl-set',
   'Three nesting stoneware bowls in warm glazes, sized for everyday prep and serving.',
   2650000, 'KIT-BWL-003', 9, 'kitchen'),
  ('Linen Throw, Olive', 'linen-throw-olive',
   'Heavyweight washed linen throw in a deep olive. Softens with every wash.',
   2200000, 'HOM-LTH-001', 21, 'home'),
  ('Carved Oak Candle Holder', 'carved-oak-candle-holder',
   'Solid oak candle holder, hand-turned with a slight taper. Sold individually.',
   980000, 'HOM-CDL-004', 30, 'home'),
  ('Walnut Desk Organiser', 'walnut-desk-organiser',
   'A single block of walnut, routed into trays for pens, cards, and small tools.',
   3150000, 'DSK-ORG-002', 7, 'desk'),
  ('Brass Desk Lamp', 'brass-desk-lamp',
   'Adjustable brass desk lamp with a warm 2700K bulb and a weighted base.',
   4450000, 'DSK-LMP-005', 5, 'desk'),
  ('Waffle Cotton Towel Set', 'waffle-cotton-towel-set',
   'Two bath towels and two hand towels in waffle-weave cotton. Quick-drying, no fade.',
   1750000, 'BTH-TWL-006', 18, 'bath'),
  ('Stone Soap Dish', 'stone-soap-dish',
   'Hand-carved soap dish in honed grey stone, with a channel so soap stays dry.',
   650000, 'BTH-SOP-007', 40, 'bath')
) as v(name, slug, description, price_cents, sku, stock_qty, category_slug)
join cat on cat.slug = v.category_slug;

-- One placeholder image per product (same picsum seeds as Phase 2).
insert into product_images (product_id, url, alt, sort_order)
select p.id, 'https://picsum.photos/seed/' || seed || '/900/1100', alt, 0
from products p
join (values
  ('cast-iron-skillet-10in', 'skillet1', 'Cast iron skillet on a wooden board'),
  ('stoneware-mixing-bowl-set', 'bowls1', 'Stack of stoneware mixing bowls'),
  ('linen-throw-olive', 'throw1', 'Olive linen throw folded on a sofa'),
  ('carved-oak-candle-holder', 'candle1', 'Oak candle holder on a shelf'),
  ('walnut-desk-organiser', 'desk1', 'Walnut desk organiser with pens'),
  ('brass-desk-lamp', 'lamp1', 'Brass desk lamp switched on'),
  ('waffle-cotton-towel-set', 'towel1', 'Folded waffle cotton towels'),
  ('stone-soap-dish', 'soap1', 'Grey stone soap dish')
) as img(slug, seed, alt) on img.slug = p.slug;
