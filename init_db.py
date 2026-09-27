"""
Backend Database Initialization Script
Creates SQLite schema and seeds initial products, reviews, vehicles, and promo codes.
"""
import sqlite3
import json
import os

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database')
DB_PATH = os.path.join(DB_DIR, 'apex_store.db')

os.makedirs(DB_DIR, exist_ok=True)

def init_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Products Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        rating REAL DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 0,
        badge TEXT,
        image TEXT NOT NULL,
        gallery TEXT,
        short_desc TEXT,
        description TEXT,
        specs TEXT,
        features TEXT,
        compatible_makes TEXT,
        universal_fit INTEGER DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 10,
        is_featured INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Car Models Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS car_models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        make TEXT NOT NULL,
        model TEXT NOT NULL
    );
    """)

    # 3. Promo Codes Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS promo_codes (
        code TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        min_spend REAL DEFAULT 0,
        description TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
    );
    """)

    # 4. Orders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        shipping_address TEXT NOT NULL,
        shipping_city TEXT NOT NULL,
        shipping_zip TEXT NOT NULL,
        shipping_method TEXT NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        shipping_cost REAL DEFAULT 0,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'Order Confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Order Items Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        product_image TEXT,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        vehicle_tag TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    """)

    # 6. Customer Reviews Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        author TEXT NOT NULL,
        rating INTEGER NOT NULL,
        vehicle TEXT,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    print("Database tables created successfully.")

    # Seed Initial Data if empty
    cursor.execute("SELECT COUNT(*) FROM products;")
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)
        conn.commit()
        print("Initial catalog, vehicle, and promo data seeded successfully.")

    conn.close()

def seed_data(cursor):
    # Car Models
    car_models = {
        "BMW": ["3-Series (G20)", "M3 / M4 (G80/G82)", "5-Series (G30)", "M5 (F90)", "X5 / X5M", "M2 (G87)"],
        "Audi": ["A4 / S4 / RS4", "A5 / S5 / RS5", "A3 / S3 / RS3", "RS6 Avant", "Q7 / Q8", "TT RS"],
        "Tesla": ["Model 3", "Model Y", "Model S Plaid", "Model X", "Cybertruck"],
        "Mercedes-Benz": ["C-Class / C63 AMG", "E-Class / E63 AMG", "A-Class / CLA45", "G-Wagon G63", "AMG GT Coupe"],
        "Porsche": ["911 Carrera / GT3 (992)", "718 Cayman / Boxster", "Taycan", "Panamera", "Macan GTS"],
        "Toyota": ["GR Supra (A90)", "GR86", "Camry TRD", "Corolla GR", "Tacoma TRD Pro", "4Runner"],
        "Ford": ["Mustang GT / Dark Horse", "F-150 / Raptor", "Focus RS", "Bronco Wildtrak", "Explorer ST"],
        "Honda": ["Civic Type-R (FL5)", "Civic Si", "Accord Sport", "S2000", "CR-V Hybrid"],
        "Subaru": ["WRX / STI", "BRZ", "Forester Wilderness", "Outback XT"],
        "Nissan": ["GT-R (R35)", "Z (RZ34)", "370Z Nismo", "Altima SR"]
    }

    for make, models in car_models.items():
        for model in models:
            cursor.execute("INSERT INTO car_models (make, model) VALUES (?, ?);", (make, model))

    # Promo Codes
    promos = [
        ("TURBO10", "percent", 10.0, 0.0, "10% Off Entire Order"),
        ("SPEED25", "flat", 25.0, 100.0, "$25 Off Orders over $100"),
        ("FREESHIP", "shipping", 0.0, 0.0, "Free Express Shipping"),
        ("APEX50", "flat", 50.0, 250.0, "$50 Off Orders over $250")
    ]
    for code, ptype, val, min_spend, desc in promos:
        cursor.execute("""
        INSERT INTO promo_codes (code, type, value, min_spend, description)
        VALUES (?, ?, ?, ?, ?);
        """, (code, ptype, val, min_spend, desc))

    # Products List
    products = [
        {
            "id": "prod-001",
            "name": "Apex Pro Carbon Fiber F1 LED Steering Wheel",
            "category": "interior",
            "price": 649.99,
            "original_price": 799.99,
            "rating": 4.9,
            "reviews_count": 142,
            "badge": "Best Seller",
            "image": "assets/images/carbon_steering_wheel.jpg",
            "gallery": ["assets/images/carbon_steering_wheel.jpg", "assets/images/hero_car_accessories.jpg"],
            "short_desc": "Real Toray 3K twill carbon fiber with integrated OLED RPM shift indicator and genuine perforated leather.",
            "description": "Upgrade your cockpit to professional motorsport standards. Features programmable RGB LED shift lights, custom digital OLED telemetry display (RPM, speed, engine temp, battery voltage), and hand-stitched perforated Italian nappa leather.",
            "specs": {
                "Material": "Toray 3K Twill Gloss Carbon Fiber & Nappa Leather",
                "Display": "Custom OLED 128x32 Telemetry & 16-LED RPM Shift Indicator",
                "Connection": "OBD-II Wireless Bluetooth 5.2 Module (Included)",
                "Stitching": "Motorsport Crimson Red Dual Stitching",
                "Paddle Shifters": "Extended Carbon Magnetic Click Paddles",
                "Warranty": "3-Year Limited Manufacturer Warranty"
            },
            "features": [
                "Real-time 0-60 mph timer and lap time recorder",
                "Plug & play OBD2 smart module with zero wire splicing",
                "Ergonomic thumb rests and contoured D-cut flat bottom",
                "100% factory airbag and multi-function button transfer"
            ],
            "compatible_makes": ["BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Ford", "Toyota"],
            "universal_fit": 0,
            "stock": 7,
            "is_featured": 1,
            "initial_reviews": [
                {"author": "Marcus Vance", "rating": 5, "vehicle": "2024 BMW M3 Competition", "comment": "The LED shift lights and carbon weave quality blew me away. Installation took under 45 minutes using the included OBD-II plug."},
                {"author": "Elena Rostova", "rating": 5, "vehicle": "2023 Audi RS5", "comment": "Feels like sitting in a GT3 race car every morning. The leather grip is extremely tactile."}
            ]
        },
        {
            "id": "prod-002",
            "name": "LuminaRGB Fiber Optic Neo Ambient Interior Lighting Kit",
            "category": "lighting",
            "price": 89.99,
            "original_price": 129.99,
            "rating": 4.8,
            "reviews_count": 389,
            "badge": "Trending",
            "image": "assets/images/ambient_lighting_kit.jpg",
            "gallery": ["assets/images/ambient_lighting_kit.jpg", "assets/images/hero_car_accessories.jpg"],
            "short_desc": "Sub-millimeter optical fiber strips with 16 Million RGBW colors, sound-reactive acoustics, and iOS/Android app sync.",
            "description": "Transform your vehicle cabin into an ultra-modern lounge. Ultra-thin transparent light guides insert cleanly into interior seams with zero adhesives or visible wires. Features dynamic music sync, welcoming sequence, and customizable color zones.",
            "specs": {
                "Light Source": "High-Efficiency Quad-Core RGBW LED Drivers",
                "Fiber Length": "6x 78-inch (2m) Optical Guide Lines",
                "Control": "Bluetooth 5.0 iOS/Android App + Wireless RF Remote",
                "Voltage": "DC 12V (Cigarette Lighter & Fuse Box Harness Included)",
                "Modes": "Dynamic Flowing, Strobe, Music Pulse, Static Mood"
            },
            "features": [
                "Invisible seam installation with ultra-thin 0.5mm mounting tabs",
                "16 Million RGBW colors with independent 4-zone lighting control",
                "Acoustic sensor matches cabin audio beat in real-time",
                "Memory chip restores your last setting on car ignition"
            ],
            "compatible_makes": ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
            "universal_fit": 1,
            "stock": 28,
            "is_featured": 1,
            "initial_reviews": [
                {"author": "David Chen", "rating": 5, "vehicle": "2024 Tesla Model Y", "comment": "Makes the Model Y feel like a $150k luxury spaceship at night. App connects instantly."},
                {"author": "Sarah Jenkins", "rating": 4, "vehicle": "2022 Honda Civic", "comment": "Tucked neatly along the dashboard and doors. Music sync feature is a crowd favorite!"}
            ]
        },
        {
            "id": "prod-003",
            "name": "VisionPro 4K Starvis-2 Dual Smart Dashcam System",
            "category": "tech",
            "price": 189.99,
            "original_price": 249.99,
            "rating": 4.9,
            "reviews_count": 512,
            "badge": "Top Rated",
            "image": "assets/images/dual_dashcam_4k.jpg",
            "gallery": ["assets/images/dual_dashcam_4k.jpg"],
            "short_desc": "Sony STARVIS 2 true 4K UHD front + 1080P rear dual camera with 24/7 AI parking surveillance and GPS logging.",
            "description": "Uncompromised security for your pride and joy. Equipped with industry-leading Sony STARVIS 2 sensor, HDR night vision, supercapacitor power (resists extreme heat up to 160°F), and 5GHz Wi-Fi for instant phone footage download.",
            "specs": {
                "Resolution": "Front 4K UHD (3840x2160@30fps) + Rear 1080P FHD",
                "Sensor": "Sony STARVIS 2 IMX678 Ultra-Low-Light Sensor",
                "Display": "2.4-inch High-Definition IPS Anti-Glare Screen",
                "Field of View": "165° Front Wide-Angle + 150° Rear",
                "Storage": "Includes 128GB High-Endurance U3 MicroSD Card"
            },
            "features": [
                "24/7 G-sensor parking monitor with collision impact auto-lock",
                "License plate clarity in pitch darkness via advanced HDR",
                "Time-lapse recording preserves 48+ hours without overwriting",
                "Heat-resistant supercapacitor (No lithium battery fire risk)"
            ],
            "compatible_makes": ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
            "universal_fit": 1,
            "stock": 19,
            "is_featured": 1,
            "initial_reviews": [
                {"author": "Robert Miller", "rating": 5, "vehicle": "2025 Ford Mustang GT", "comment": "License plates are razor sharp even at highway speeds and low lighting. Peace of mind is priceless."}
            ]
        },
        {
            "id": "prod-004",
            "name": "Apex Aero GT High-Gloss Twill Carbon Trunk Spoiler",
            "category": "performance",
            "price": 329.99,
            "original_price": 420.00,
            "rating": 4.8,
            "reviews_count": 94,
            "badge": "Aerodynamic",
            "image": "assets/images/carbon_spoiler_wing.jpg",
            "gallery": ["assets/images/carbon_spoiler_wing.jpg", "assets/images/hero_car_accessories.jpg"],
            "short_desc": "Precision vacuum-infused dry carbon fiber duckbill spoiler engineered for downforce stability and aggressive styling.",
            "description": "Sculpted in high-speed wind tunnels, this rear trunk spoiler provides tangible high-speed rear axle stability while giving your vehicle a ferocious sports stance. Finished with multi-layer UV resistant ceramic clear coat.",
            "specs": {
                "Construction": "Dry Vacuum-Infused 3K Twill Weave Pre-Preg Carbon",
                "Finish": "High-Gloss Mirror Clear Coat with 99.8% UV Block",
                "Weight": "Ultra-lightweight: 1.45 lbs (660 grams)",
                "Installation": "Includes 3M VHB Automotive Bonding Tape (No Drilling)"
            },
            "features": [
                "No drilling required: installs in 20 minutes with 3M automotive tape",
                "Zero yellowing or fading guarantee backed by 5-year UV warranty",
                "Precision laser-scanned OEM trunk edge curvature fitment",
                "Sleek ducktail kick provides aggressive rear profile"
            ],
            "compatible_makes": ["BMW", "Audi", "Tesla", "Toyota", "Ford", "Honda", "Subaru"],
            "universal_fit": 0,
            "stock": 11,
            "is_featured": 1,
            "initial_reviews": [
                {"author": "Kevin Tran", "rating": 5, "vehicle": "2023 Toyota GR Supra", "comment": "Fitment is OEM level flush. Weave alignment is pure perfection, worth every penny!"}
            ]
        },
        {
            "id": "prod-005",
            "name": "MagVent 15W Auto-Clamping Magnetic Fast Car Mount",
            "category": "tech",
            "price": 49.99,
            "original_price": 69.99,
            "rating": 4.7,
            "reviews_count": 620,
            "badge": "Sale 28% OFF",
            "image": "assets/images/wireless_car_charger.jpg",
            "gallery": ["assets/images/wireless_car_charger.jpg"],
            "short_desc": "Qi2 15W wireless fast charging phone holder with smart infrared motorized clamps and aerospace aluminum bracket.",
            "description": "The ultimate cockpit phone cockpit solution. Built with dual infrared sensors that automatically open and clamp securely when your smartphone approaches. Features MagSafe-grade N52 neodymium magnets and a cool-running silent internal cooling turbine.",
            "specs": {
                "Output": "15W Max Qi2 Fast Wireless Charging",
                "Mounting": "Steel-Core Air Vent Hook & 360° Suction Dashboard Base",
                "Materials": "Tempered Scratch-Resistant Glass & Anodized Aluminum"
            },
            "features": [
                "Motorized arms close automatically when phone is placed",
                "Built-in supercapacitor opens clamp even after car engine is shut off",
                "Active cooling fan prevents phone overheating on hot sunny commutes",
                "Rotates 360 degrees smoothly for GPS navigation orientation"
            ],
            "compatible_makes": ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
            "universal_fit": 1,
            "stock": 45,
            "is_featured": 1,
            "initial_reviews": [
                {"author": "Jessica Taylor", "rating": 5, "vehicle": "2024 Porsche Macan", "comment": "Holds my heavy phone rock steady even over speed bumps and sudden turns. Sleek cyan glow looks luxury."}
            ]
        },
        {
            "id": "prod-006",
            "name": "CeramiShield 10H Graphene Ceramic Coating Kit",
            "category": "care",
            "price": 64.99,
            "original_price": 89.99,
            "rating": 4.9,
            "reviews_count": 275,
            "badge": "Pro Detailer",
            "image": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
            "gallery": ["https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80"],
            "short_desc": "True 10H hardness infused with aerospace graphene. Provides hyper-slick hydrophobic water beading and 5-year paint protection.",
            "description": "Give your vehicle a deep mirror gloss finish that sheds dirt, bird droppings, acid rain, and road salt effortlessly. The infused graphene lattice reduces surface heat absorption and repels water spots like magic.",
            "specs": {
                "Hardness": "Certified 10H Pencil Hardness",
                "Durability": "Up to 5 Years / 70,000 Miles Protection",
                "Kit Includes": "50ml Bottle, 2x Applicator Blocks, 5x Suede Cloths, Gloves"
            },
            "features": [
                "Candy-like deep wet gloss reflection on any color vehicle",
                "Anti-scratch surface resilience against micro-swirls during washes",
                "Self-cleaning effect: dirt washes off with simple water rinse",
                "Safe on clear coats, vinyl wraps, wheels, and carbon fiber"
            ],
            "compatible_makes": ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
            "universal_fit": 1,
            "stock": 33,
            "is_featured": 0,
            "initial_reviews": [
                {"author": "Anthony Rossi", "rating": 5, "vehicle": "2023 Mercedes-AMG C63", "comment": "Application was straightforward. Rain literally flies off the hood at 40 MPH without using wipers!"}
            ]
        },
        {
            "id": "prod-007",
            "name": "ApexAir Turbo 150PSI Digital Smart Tire Inflator & Jump Starter",
            "category": "tech",
            "price": 99.99,
            "original_price": 139.99,
            "rating": 4.8,
            "reviews_count": 310,
            "badge": "Emergency Must-Have",
            "image": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
            "gallery": ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"],
            "short_desc": "Cordless 150 PSI rapid tire pump combined with a 2500A peak lithium car battery jump starter and emergency LED floodlight.",
            "description": "Never get stranded on the highway. Jumps 8.5L gas and 6.5L diesel engines up to 30 times on a single charge. High-precision digital barometer stops automatically at preset PSI within seconds.",
            "specs": {
                "Max Pressure": "150 PSI (Accurate to +/- 0.5 PSI)",
                "Jump Starter Peak": "2500 Amps Peak Crank Current",
                "Battery": "16,000mAh Lithium Power Bank with USB-C PD 65W"
            },
            "features": [
                "Auto-shutoff once desired tire pressure is reached",
                "Sparks-proof heavy-duty copper clamp protection cables",
                "Charges laptops, tablets, and phones via rapid USB-C PD",
                "Compact carry case fits neatly under seat or in trunk"
            ],
            "compatible_makes": ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
            "universal_fit": 1,
            "stock": 22,
            "is_featured": 0,
            "initial_reviews": [
                {"author": "Brian O'Connor", "rating": 5, "vehicle": "2021 Subaru WRX STI", "comment": "Saved me from calling a tow truck on a remote mountain pass. Jumped instantly and topped off my tire."}
            ]
        },
        {
            "id": "prod-008",
            "name": "MatrixBeam Sequential Dynamic LED Headlight Bulbs (Pair)",
            "category": "lighting",
            "price": 119.99,
            "original_price": 159.99,
            "rating": 4.8,
            "reviews_count": 184,
            "badge": "300% Brighter",
            "image": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80",
            "gallery": ["https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80"],
            "short_desc": "24,000 Lumens 6500K pure white CSP LED upgrade kit with zero glare cut-off line and copper heat-pipe cooling.",
            "description": "Turn dark backroads into broad daylight. Engineered with aerospace thermal copper tubing and 12,000 RPM silent magnetic levitation fans to deliver 50,000 hours of blindingly clear, street-legal beam clarity.",
            "specs": {
                "Luminous Flux": "24,000 LM per pair (12,000 LM per bulb)",
                "Color Temp": "6500K Crystal Diamond White",
                "CANBUS": "100% CANBUS Ready (No flicker or dashboard error codes)"
            },
            "features": [
                "300% wider beam angle eliminates deer hazard blind spots",
                "Ultra-thin 1.0mm chip gap recreates flawless OEM focal point",
                "Plug & play 10-minute install without ballast boxes",
                "Anti-radio interference EMC shield built in"
            ],
            "compatible_makes": ["Universal", "BMW", "Audi", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
            "universal_fit": 1,
            "stock": 16,
            "is_featured": 0,
            "initial_reviews": [
                {"author": "Samantha Lee", "rating": 5, "vehicle": "2020 Honda Accord", "comment": "Massive upgrade over dull halogen yellows. Clean cut-off means oncoming drivers never get blinded."}
            ]
        },
        {
            "id": "prod-009",
            "name": "ThrottleX Pro 9-Mode Electronic Throttle Response Controller",
            "category": "performance",
            "price": 149.99,
            "original_price": 199.99,
            "rating": 4.9,
            "reviews_count": 167,
            "badge": "Zero Turbo Lag",
            "image": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
            "gallery": ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80"],
            "short_desc": "Eliminates electronic pedal delay instantly. Features Race, Sport+, Eco, Valet, Anti-Theft Lock, and Auto AI modes.",
            "description": "Does your vehicle feel sluggish when you hit the gas? ThrottleX intercepts the fly-by-wire pedal sensor to deliver instantaneous throttle response, sharper acceleration, and switchable fuel-saving eco modes.",
            "specs": {
                "Modes": "9 Programs with 9 Micro-Sensitivity Levels (81 Settings)",
                "Display": "Slim Curved OLED Micro Display with CNC Aluminum Dial"
            },
            "features": [
                "Instant neck-snapping acceleration feel on demand",
                "Does not void factory engine ECU warranty",
                "Valet mode limits max throttle to 30%",
                "Eco mode smooths throttle for stop-and-go city fuel economy"
            ],
            "compatible_makes": ["BMW", "Audi", "Tesla", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
            "universal_fit": 0,
            "stock": 14,
            "is_featured": 0,
            "initial_reviews": [
                {"author": "Derek Walker", "rating": 5, "vehicle": "2024 Ford F-150 / Mustang", "comment": "It literally feels like a stage 1 tune without touching the ECU. The throttle lag is completely gone."}
            ]
        },
        {
            "id": "prod-010",
            "name": "Apex 3D Laser-Fit Carbon Textured All-Weather Floor Mats",
            "category": "interior",
            "price": 139.99,
            "original_price": 179.99,
            "rating": 4.8,
            "reviews_count": 228,
            "badge": "Laser Measured",
            "image": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
            "gallery": ["https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80"],
            "short_desc": "3D digital laser scanned thermal TPE floor liners with raised side walls and waterproof carbon fiber grain texture.",
            "description": "Keep your car carpets pristine in mud, snow, spills, and sand. Unlike cheap rubber mats that smell in the summer heat, our eco-friendly non-toxic TPE remains flexible from -40°F to 175°F and cleans off with a hose.",
            "specs": {
                "Material": "Multi-Layer High-Density TPE with Carbon Fiber Pattern",
                "Fitment": "Custom Laser Measured (Front Row + Rear Passenger Row)"
            },
            "features": [
                "High raised perimeter keeps melted snow and coffee spills contained",
                "Anti-skid bottom claws lock directly into factory floor anchors",
                "Zero curling or cracking under extreme desert sun or winter freezes",
                "Pressure washer safe for quick 60-second cleanup"
            ],
            "compatible_makes": ["BMW", "Audi", "Tesla", "Toyota", "Ford", "Honda"],
            "universal_fit": 0,
            "stock": 25,
            "is_featured": 0,
            "initial_reviews": [
                {"author": "Chloe Bennett", "rating": 5, "vehicle": "2023 Tesla Model 3", "comment": "Fit every curve like a glove. Looks way sleeker than generic rubber mats."}
            ]
        },
        {
            "id": "prod-011",
            "name": "SoundCraft 600W Compact Under-Seat Powered Subwoofer",
            "category": "tech",
            "price": 179.99,
            "original_price": 229.99,
            "rating": 4.7,
            "reviews_count": 140,
            "badge": "Deep Bass",
            "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
            "gallery": ["https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80"],
            "short_desc": "Ultra-slim cast-aluminum active 10-inch subwoofer with integrated Class D amplifier and remote bass level knob.",
            "description": "Add punchy, heart-thumping low-end audio without sacrificing your trunk space. At just 2.8 inches thick, it slides effortlessly under driver or passenger seats while delivering 600W peak acoustic power.",
            "specs": {
                "Peak Power": "600 Watts (200W RMS Continuous)",
                "Woofer Size": "10-inch Low Profile Anodized Cone",
                "Dimensions": "13.6 x 10.2 x 2.8 Ultra-Slim Profile"
            },
            "features": [
                "Fits under standard car seats without modifying upholstery",
                "Remote bass boost dial fits cleanly in center console",
                "Built-in subsonic filter and low-pass crossover (50Hz - 150Hz)",
                "Works with OEM factory radios and aftermarket head units"
            ],
            "compatible_makes": ["Universal", "BMW", "Audi", "Tesla", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
            "universal_fit": 1,
            "stock": 12,
            "is_featured": 0,
            "initial_reviews": [
                {"author": "Liam Garcia", "rating": 5, "vehicle": "2022 Toyota GR86", "comment": "Filled out the weak factory sound system with rich, crisp bass. Didn't lose an inch of cargo space."}
            ]
        },
        {
            "id": "prod-012",
            "name": "AeroBurn Quad Titanium-Blue Burnt Exhaust Tips (Pair)",
            "category": "performance",
            "price": 79.99,
            "original_price": 109.99,
            "rating": 4.8,
            "reviews_count": 119,
            "badge": "Aggressive Stance",
            "image": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
            "gallery": ["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80"],
            "short_desc": "Mirror-polished T-304 stainless steel with electro-ionized burnt titanium blue slant cut and double-wall resonance.",
            "description": "Give your vehicle rear diffuser an unmistakable track-inspired presence. Features double-wall thermal insulation to prevent exhaust soot discoloration and a bolt-on heavy-duty stainless clamp system.",
            "specs": {
                "Material": "T-304 Marine Grade Stainless Steel with Titanium Ion Coat",
                "Inlet Diameter": "2.5-inch (63mm) Universal Clamp-on",
                "Outlet Diameter": "3.5-inch (89mm) Aggressive Slant Cut"
            },
            "features": [
                "Deepens exhaust tone through acoustic double-wall chamber",
                "Corrosion-proof titanium electroplate will never rust or flake",
                "Drain hole prevents water retention and condensation rust",
                "Fits 90% of sport sedans, hatchbacks, and performance SUVs"
            ],
            "compatible_makes": ["Universal", "BMW", "Audi", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
            "universal_fit": 1,
            "stock": 18,
            "is_featured": 0,
            "initial_reviews": [
                {"author": "Nathan Reed", "rating": 5, "vehicle": "2021 Subaru WRX", "comment": "The burnt blue finish against a black diffuser is gorgeous. Clamped tight with zero rattling."}
            ]
        }
    ]

    for p in products:
        cursor.execute("""
        INSERT INTO products (
            id, name, category, price, original_price, rating, reviews_count,
            badge, image, gallery, short_desc, description, specs, features,
            compatible_makes, universal_fit, stock, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            p["id"],
            p["name"],
            p["category"],
            p["price"],
            p["original_price"],
            p["rating"],
            p["reviews_count"],
            p["badge"],
            p["image"],
            json.dumps(p["gallery"]),
            p["short_desc"],
            p["description"],
            json.dumps(p["specs"]),
            json.dumps(p["features"]),
            json.dumps(p["compatible_makes"]),
            p["universal_fit"],
            p["stock"],
            p["is_featured"]
        ))

        # Insert initial reviews
        for rev in p.get("initial_reviews", []):
            cursor.execute("""
            INSERT INTO reviews (product_id, author, rating, vehicle, comment)
            VALUES (?, ?, ?, ?, ?);
            """, (p["id"], rev["author"], rev["rating"], rev["vehicle"], rev["comment"]))

if __name__ == '__main__':
    init_database()
