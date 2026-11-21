-- ====================================================================
-- Campus Bites - Supabase Database Schema & Seed Data
-- Run this in your Supabase project: SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Create Canteens Table
CREATE TABLE IF NOT EXISTS public.canteens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  location TEXT,
  timings TEXT,
  avg_prep_minutes INT DEFAULT 15,
  image TEXT,
  upi_id TEXT,
  upi_merchant_name TEXT,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  canteen_id TEXT REFERENCES public.canteens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  is_veg BOOLEAN DEFAULT true,
  available BOOLEAN DEFAULT true,
  prep_time_minutes INT DEFAULT 10,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Users / Profiles Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  roll_number TEXT,
  mobile_number TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  canteen_id TEXT REFERENCES public.canteens(id),
  canteen_name TEXT NOT NULL,
  user_id TEXT,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_items INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Order Placed',
  pickup_time TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  upi_transaction_ref TEXT,
  order_token TEXT,
  estimated_pickup_time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) but allow public read/write for seamless app operations
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read canteens" ON public.canteens FOR SELECT USING (true);
CREATE POLICY "Allow public write canteens" ON public.canteens FOR ALL USING (true);

CREATE POLICY "Allow public read menu" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public write menu" ON public.menu_items FOR ALL USING (true);

CREATE POLICY "Allow public all users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow public all orders" ON public.orders FOR ALL USING (true);

-- 5. Seed Initial Canteens Data
INSERT INTO public.canteens (id, name, tagline, description, location, timings, avg_prep_minutes, image, upi_id, upi_merchant_name, is_open)
VALUES 
  (
    'block-2',
    'Block 2 Canteen',
    'Classic Campus Kitchen & Tiffin Hall',
    'Freshly cooked South Indian breakfasts, hot parathas, crispy chaat, and hearty North Indian bowls at student-friendly prices.',
    'Ground Floor, Academic Block 2',
    '7:30 AM – 7:30 PM',
    12,
    '/src/assets/images/canteen_block2_1795200116788.jpg',
    'block2canteen@okicici',
    'Block 2 Canteen Campus Bites',
    true
  ),
  (
    'apple-bees',
    'Apple & Bees Canteen',
    'Modern Campus Café & Grill',
    'Hand-crafted gourmet burgers, creamy pastas, grilled kathi wraps, Belgian cold coffee, and warm bakery desserts.',
    'Student Activity Courtyard',
    '8:30 AM – 9:00 PM',
    15,
    '/src/assets/images/canteen_apple_bees_1795200116907.jpg',
    'applebees.campus@okhdfcbank',
    'Apple and Bees Cafe',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Initial Menu Items
INSERT INTO public.menu_items (id, canteen_id, name, description, price, category, is_veg, available, prep_time_minutes, image)
VALUES
  ('b2-masala-dosa', 'block-2', 'Crispy Masala Dosa', 'Golden fermented crepe stuffed with spiced potato masala, served with coconut chutney and steaming sambar.', 65, 'Breakfast', true, true, 10, '/src/assets/images/food_masala_dosa_1795200117322.jpg'),
  ('b2-indori-poha', 'block-2', 'Indori Sev Poha', 'Fluffy flattened rice tempered with mustard seeds, curry leaves, roasted peanuts, pomegranate, and crispy Ratlami sev.', 40, 'Breakfast', true, true, 6, '/src/assets/images/food_poha_breakfast_1795200118143.jpg'),
  ('b2-punjabi-samosa', 'block-2', 'Punjabi Samosa Plate (2 Pcs)', 'Flaky golden pastry triangles filled with spiced potatoes and green peas, served with mint and tamarind chutneys.', 35, 'Snacks', true, true, 5, '/src/assets/images/food_samosa_chaat_1795200117036.jpg'),
  ('b2-paneer-roll', 'block-2', 'Paneer Tikka Kathi Roll', 'Char-grilled cottage cheese cubes, pickled red onions, and mint mayo wrapped in a flaky whole-wheat paratha.', 95, 'Fast Food', true, true, 12, '/src/assets/images/food_paneer_roll_1795200117443.jpg'),
  ('b2-chicken-roll', 'block-2', 'Double Egg Chicken Roll', 'Juicy tandoori chicken strips layered over a fluffy spiced egg paratha with crunchy onions and chaat masala.', 120, 'Fast Food', false, true, 14, '/src/assets/images/food_paneer_roll_1795200117443.jpg'),
  ('b2-rajma-chawal', 'block-2', 'Homestyle Rajma Chawal & Naan', 'Slow-simmered red kidney bean curry served with fragrant jeera basmati rice, butter naan, and pickled onions.', 110, 'Main Course', true, true, 12, '/src/assets/images/food_thali_rajma_1795200117100.jpg'),
  ('b2-paneer-thali', 'block-2', 'Paneer Butter Masala Bowl', 'Rich tomato-cashew makhani gravy with soft paneer cubes, jeera rice, and two crispy butter garlic naans.', 140, 'Main Course', true, true, 15, '/src/assets/images/food_thali_rajma_1795200117100.jpg'),
  ('b2-kulhad-chai', 'block-2', 'Adrak Elaichi Kulhad Chai', 'Freshly brewed Assam tea infused with crushed ginger and green cardamom, served piping hot in an earthen kulhad.', 25, 'Beverages', true, true, 4, '/src/assets/images/food_cold_coffee_1795200116907.jpg'),
  ('b2-brownie-bite', 'block-2', 'Warm Chocolate Walnut Brownie', 'Fudgy dark chocolate bakery brownie studded with toasted walnuts and warm fudge drizzle.', 60, 'Desserts', true, true, 5, '/src/assets/images/food_chocolate_brownie_1795200116878.jpg'),
  ('ab-breakfast-poha', 'apple-bees', 'Citrus Peanut Breakfast Poha', 'Light café-style spiced poha finished with toasted peanuts, ruby pomegranate, fresh cilantro, and lime.', 55, 'Breakfast', true, true, 8, '/src/assets/images/food_poha_breakfast_1795200118143.jpg'),
  ('ab-ghee-dosa', 'apple-bees', 'Butter Roast Dosa Platter', 'Extra-crisp butter-roasted dosa filled with herb-infused potato mash, two chutneys, and sambar.', 85, 'Breakfast', true, true, 12, '/src/assets/images/food_masala_dosa_1795200117322.jpg'),
  ('ab-samosa-trio', 'apple-bees', 'Crispy Herb Samosa Trio', 'Three golden cocktail samosas paired with house-blended mint coriander dip and tangy tamarind glaze.', 50, 'Snacks', true, true, 7, '/src/assets/images/food_samosa_chaat_1795200117036.jpg'),
  ('ab-crispy-chicken-burger', 'apple-bees', 'Crispy Fried Chicken Burger & Fries', 'Buttermilk-brined crunchy chicken fillet, aged cheddar, crisp lettuce, and smoky chipotle mayo in a brioche bun with peri-peri fries.', 165, 'Fast Food', false, true, 16, '/src/assets/images/food_crispy_burger_1795200116524.jpg'),
  ('ab-veg-crunch-burger', 'apple-bees', 'Herb Cheese Crispy Burger', 'Golden herb-crusted vegetable & paneer patty with melted cheddar, crisp greens, and salted fries.', 135, 'Fast Food', true, true, 14, '/src/assets/images/food_crispy_burger_1795200116524.jpg'),
  ('ab-arrabbiata-pasta', 'apple-bees', 'Roasted Tomato Arrabbiata Penne', 'Al dente penne tossed in slow-roasted cherry tomato basil sauce with parmesan and two toasted garlic herb breads.', 155, 'Main Course', true, true, 15, '/src/assets/images/food_margherita_pasta_1795200116461.jpg'),
  ('ab-chicken-pasta', 'apple-bees', 'Smoked Chicken Pink Sauce Pasta', 'Creamy spiced tomato-alfredo penne loaded with grilled chicken strips, olives, basil, and garlic bread.', 185, 'Main Course', false, true, 16, '/src/assets/images/food_margherita_pasta_1795200116461.jpg'),
  ('ab-cold-coffee', 'apple-bees', 'Belgian Chocolate Thick Cold Coffee', 'Slow-brewed dark espresso blended with creamy vanilla dairy, melted Belgian chocolate, and cocoa dust.', 75, 'Beverages', true, true, 5, '/src/assets/images/food_cold_coffee_1795200116907.jpg'),
  ('ab-iced-tea', 'apple-bees', 'Peach & Mint Sparkler Iced Tea', 'Refreshing black tea brewed fresh with summer peach pulp, crushed spearmint, and fizzy soda splash.', 65, 'Beverages', true, true, 4, '/src/assets/images/food_cold_coffee_1795200116907.jpg'),
  ('ab-lava-cake', 'apple-bees', 'Molten Choco Lava Cup', 'Warm miniature chocolate sponge with an oozing liquid ganache center, finished with powdered sugar.', 80, 'Desserts', true, true, 6, '/src/assets/images/food_chocolate_brownie_1795200116878.jpg')
ON CONFLICT (id) DO NOTHING;
