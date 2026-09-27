-- ==============================================================================
-- APEX AUTO GEAR - SUPABASE POSTGRESQL SCHEMA & INITIAL DATA SEED
-- Run this script in your Supabase Project -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    rating NUMERIC(3, 1) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    badge TEXT,
    image TEXT NOT NULL,
    gallery JSONB DEFAULT '[]'::jsonb,
    short_desc TEXT,
    description TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    compatible_makes JSONB DEFAULT '[]'::jsonb,
    universal_fit BOOLEAN DEFAULT false,
    stock INTEGER NOT NULL DEFAULT 10,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Car Models Table
CREATE TABLE IF NOT EXISTS public.car_models (
    id BIGSERIAL PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    code TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'percent', 'flat', 'shipping'
    value NUMERIC(10, 2) NOT NULL,
    min_spend NUMERIC(10, 2) DEFAULT 0,
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_zip TEXT NOT NULL,
    shipping_method TEXT NOT NULL DEFAULT 'standard',
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    shipping_cost NUMERIC(10, 2) DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'Order Confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    vehicle_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Customer Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    vehicle TEXT,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access for Catalog, Vehicles, and Promos
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products stock" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Public read car_models" ON public.car_models FOR SELECT USING (true);
CREATE POLICY "Public insert car_models" ON public.car_models FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete car_models" ON public.car_models FOR DELETE USING (true);

CREATE POLICY "Public read promo_codes" ON public.promo_codes FOR SELECT USING (true);

-- Allow Public Read & Insert for Orders (so customers can create and view orders)
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select orders" ON public.orders FOR SELECT USING (true);

CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select order_items" ON public.order_items FOR SELECT USING (true);

-- Allow Public Read & Insert for Reviews
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- REALTIME REPLICATION (For live order & stock updates)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- Seed Car Models
INSERT INTO public.car_models (make, model) VALUES
('BMW', '3-Series (G20)'), ('BMW', 'M3 / M4 (G80/G82)'), ('BMW', '5-Series (G30)'), ('BMW', 'M5 (F90)'), ('BMW', 'X5 / X5M'),
('Audi', 'A4 / S4 / RS4'), ('Audi', 'A5 / S5 / RS5'), ('Audi', 'A3 / S3 / RS3'), ('Audi', 'RS6 Avant'), ('Audi', 'Q7 / Q8'),
('Tesla', 'Model 3'), ('Tesla', 'Model Y'), ('Tesla', 'Model S Plaid'), ('Tesla', 'Model X'), ('Tesla', 'Cybertruck'),
('Mercedes-Benz', 'C-Class / C63 AMG'), ('Mercedes-Benz', 'E-Class / E63 AMG'), ('Mercedes-Benz', 'AMG GT Coupe'),
('Porsche', '911 Carrera / GT3 (992)'), ('Porsche', '718 Cayman / Boxster'), ('Porsche', 'Taycan'), ('Porsche', 'Macan GTS'),
('Toyota', 'GR Supra (A90)'), ('Toyota', 'GR86'), ('Toyota', 'Camry TRD'), ('Toyota', 'Corolla GR'),
('Ford', 'Mustang GT / Dark Horse'), ('Ford', 'F-150 / Raptor'), ('Ford', 'Focus RS'), ('Ford', 'Bronco Wildtrak'),
('Honda', 'Civic Type-R (FL5)'), ('Honda', 'Civic Si'), ('Honda', 'Accord Sport'), ('Honda', 'S2000'),
('Subaru', 'WRX / STI'), ('Subaru', 'BRZ'), ('Subaru', 'Forester Wilderness'),
('Nissan', 'GT-R (R35)'), ('Nissan', 'Z (RZ34)'), ('Nissan', '370Z Nismo')
ON CONFLICT DO NOTHING;

-- Seed Promo Codes
INSERT INTO public.promo_codes (code, type, value, min_spend, description) VALUES
('TURBO10', 'percent', 10.0, 0.0, '10% Off Entire Order'),
('SPEED25', 'flat', 25.0, 100.0, '$25 Off Orders over $100'),
('FREESHIP', 'shipping', 0.0, 0.0, 'Free Express Shipping'),
('APEX50', 'flat', 50.0, 250.0, '$50 Off Orders over $250')
ON CONFLICT (code) DO NOTHING;

-- Seed Products
INSERT INTO public.products (
    id, name, category, price, original_price, rating, reviews_count,
    badge, image, gallery, short_desc, description, specs, features,
    compatible_makes, universal_fit, stock, is_featured
) VALUES
(
    'prod-001',
    'Apex Pro Carbon Fiber F1 LED Steering Wheel',
    'interior',
    649.99,
    799.99,
    4.9,
    142,
    'Best Seller',
    'assets/images/carbon_steering_wheel.jpg',
    '["assets/images/carbon_steering_wheel.jpg", "assets/images/hero_car_accessories.jpg"]'::jsonb,
    'Real Toray 3K twill carbon fiber with integrated OLED RPM shift indicator and genuine perforated leather.',
    'Upgrade your cockpit to professional motorsport standards. Features programmable RGB LED shift lights, custom digital OLED telemetry display (RPM, speed, engine temp, battery voltage), and hand-stitched perforated Italian nappa leather.',
    '{"Material": "Toray 3K Twill Gloss Carbon Fiber", "Display": "OLED 128x32 Telemetry & 16-LED RPM Shift Indicator", "Connection": "OBD-II Wireless Bluetooth 5.2", "Stitching": "Motorsport Crimson Red Dual Stitching"}'::jsonb,
    '["Real-time 0-60 mph timer and lap time recorder", "Plug & play OBD2 smart module with zero wire splicing", "Ergonomic thumb rests and contoured D-cut flat bottom", "100% factory airbag and multi-function button transfer"]'::jsonb,
    '["BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Ford", "Toyota"]'::jsonb,
    false,
    7,
    true
),
(
    'prod-002',
    'LuminaRGB Fiber Optic Neo Ambient Interior Lighting Kit',
    'lighting',
    89.99,
    129.99,
    4.8,
    389,
    'Trending',
    'assets/images/ambient_lighting_kit.jpg',
    '["assets/images/ambient_lighting_kit.jpg", "assets/images/hero_car_accessories.jpg"]'::jsonb,
    'Sub-millimeter optical fiber strips with 16 Million RGBW colors, sound-reactive acoustics, and iOS/Android app sync.',
    'Transform your vehicle cabin into an ultra-modern lounge. Ultra-thin transparent light guides insert cleanly into interior seams with zero adhesives or visible wires.',
    '{"Light Source": "High-Efficiency Quad-Core RGBW LED Drivers", "Fiber Length": "6x 78-inch Optical Guides", "Control": "Bluetooth 5.0 App + Wireless RF Remote", "Voltage": "DC 12V Harness Included"}'::jsonb,
    '["Invisible seam installation with ultra-thin 0.5mm mounting tabs", "16 Million RGBW colors with independent 4-zone lighting control", "Acoustic sensor matches cabin audio beat in real-time", "Memory chip restores your last setting on car ignition"]'::jsonb,
    '["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"]'::jsonb,
    true,
    28,
    true
),
(
    'prod-003',
    'VisionPro 4K Starvis-2 Dual Smart Dashcam System',
    'tech',
    189.99,
    249.99,
    4.9,
    512,
    'Top Rated',
    'assets/images/dual_dashcam_4k.jpg',
    '["assets/images/dual_dashcam_4k.jpg"]'::jsonb,
    'Sony STARVIS 2 true 4K UHD front + 1080P rear dual camera with 24/7 AI parking surveillance and GPS logging.',
    'Uncompromised security for your pride and joy. Equipped with industry-leading Sony STARVIS 2 sensor, HDR night vision, supercapacitor power, and 5GHz Wi-Fi.',
    '{"Resolution": "Front 4K UHD (3840x2160) + Rear 1080P FHD", "Sensor": "Sony STARVIS 2 IMX678", "Display": "2.4-inch High-Definition IPS", "Field of View": "165° Front Wide-Angle + 150° Rear", "Storage": "Includes 128GB MicroSD Card"}'::jsonb,
    '["24/7 G-sensor parking monitor with collision impact auto-lock", "License plate clarity in pitch darkness via advanced HDR", "Time-lapse recording preserves 48+ hours without overwriting", "Heat-resistant supercapacitor (No lithium battery risk)"]'::jsonb,
    '["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"]'::jsonb,
    true,
    19,
    true
),
(
    'prod-004',
    'Apex Aero GT High-Gloss Twill Carbon Trunk Spoiler',
    'performance',
    329.99,
    420.00,
    4.8,
    94,
    'Aerodynamic',
    'assets/images/carbon_spoiler_wing.jpg',
    '["assets/images/carbon_spoiler_wing.jpg", "assets/images/hero_car_accessories.jpg"]'::jsonb,
    'Precision vacuum-infused dry carbon fiber duckbill spoiler engineered for downforce stability and aggressive styling.',
    'Sculpted in high-speed wind tunnels, this rear trunk spoiler provides tangible high-speed rear axle stability while giving your vehicle a ferocious sports stance.',
    '{"Construction": "Dry Vacuum-Infused 3K Twill Pre-Preg Carbon", "Finish": "High-Gloss Mirror Clear Coat with 99.8% UV Block", "Weight": "1.45 lbs (660 grams)", "Installation": "Includes 3M VHB Automotive Tape"}'::jsonb,
    '["No drilling required: installs in 20 minutes with 3M automotive tape", "Zero yellowing or fading guarantee backed by 5-year UV warranty", "Precision laser-scanned OEM trunk edge curvature fitment", "Sleek ducktail kick provides aggressive rear profile"]'::jsonb,
    '["BMW", "Audi", "Tesla", "Toyota", "Ford", "Honda", "Subaru"]'::jsonb,
    false,
    11,
    true
),
(
    'prod-005',
    'MagVent 15W Auto-Clamping Magnetic Fast Car Mount',
    'tech',
    49.99,
    69.99,
    4.7,
    620,
    'Sale 28% OFF',
    'assets/images/wireless_car_charger.jpg',
    '["assets/images/wireless_car_charger.jpg"]'::jsonb,
    'Qi2 15W wireless fast charging phone holder with smart infrared motorized clamps and aerospace aluminum bracket.',
    'The ultimate cockpit phone cockpit solution. Built with dual infrared sensors that automatically open and clamp securely when your smartphone approaches.',
    '{"Output": "15W Max Qi2 Fast Wireless Charging", "Mounting": "Steel-Core Air Vent Hook & 360° Suction Base", "Materials": "Tempered Scratch-Resistant Glass & Aluminum"}'::jsonb,
    '["Motorized arms close automatically when phone is placed", "Built-in supercapacitor opens clamp even after car engine is shut off", "Active cooling fan prevents phone overheating on hot sunny commutes", "Rotates 360 degrees smoothly for GPS navigation orientation"]'::jsonb,
    '["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"]'::jsonb,
    true,
    45,
    true
),
(
    'prod-006',
    'CeramiShield 10H Graphene Ceramic Coating Kit',
    'care',
    64.99,
    89.99,
    4.9,
    275,
    'Pro Detailer',
    'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80',
    '["https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'True 10H hardness infused with aerospace graphene. Provides hyper-slick hydrophobic water beading and 5-year paint protection.',
    'Give your vehicle a deep mirror gloss finish that sheds dirt, bird droppings, acid rain, and road salt effortlessly.',
    '{"Hardness": "Certified 10H Pencil Hardness", "Durability": "Up to 5 Years / 70,000 Miles", "Kit Includes": "50ml Bottle, 2 Applicator Blocks, 5 Suede Cloths"}'::jsonb,
    '["Candy-like deep wet gloss reflection on any color vehicle", "Anti-scratch surface resilience against micro-swirls during washes", "Self-cleaning effect: dirt washes off with simple water rinse", "Safe on clear coats, vinyl wraps, wheels, and carbon fiber"]'::jsonb,
    '["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"]'::jsonb,
    true,
    33,
    false
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    stock = EXCLUDED.stock;

-- Seed Initial Reviews
INSERT INTO public.reviews (product_id, author, rating, vehicle, comment) VALUES
('prod-001', 'Marcus Vance', 5, '2024 BMW M3 Competition', 'The LED shift lights and carbon weave quality blew me away. Installation took under 45 minutes using the included OBD-II plug.'),
('prod-001', 'Elena Rostova', 5, '2023 Audi RS5', 'Feels like sitting in a GT3 race car every morning. The leather grip is extremely tactile.'),
('prod-002', 'David Chen', 5, '2024 Tesla Model Y', 'Makes the Model Y feel like a $150k luxury spaceship at night. App connects instantly.')
ON CONFLICT DO NOTHING;
