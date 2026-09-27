/**
 * APEX AUTO GEAR - Product Catalog Data & Backend API Client
 * Connects with Flask + SQLite database with local fallback resilience.
 */

const API_BASE = '/api';

// Fallback initial products
export let PRODUCTS = [
  {
    id: "prod-001",
    name: "Apex Pro Carbon Fiber F1 LED Steering Wheel",
    category: "interior",
    price: 649.99,
    originalPrice: 799.99,
    rating: 4.9,
    reviewsCount: 142,
    badge: "Best Seller",
    image: "assets/images/carbon_steering_wheel.jpg",
    gallery: ["assets/images/carbon_steering_wheel.jpg", "assets/images/hero_car_accessories.jpg"],
    shortDesc: "Real Toray 3K twill carbon fiber with integrated OLED RPM shift indicator and genuine perforated leather.",
    description: "Upgrade your cockpit to professional motorsport standards. Features programmable RGB LED shift lights, custom digital OLED telemetry display (RPM, speed, engine temp, battery voltage), and hand-stitched perforated Italian nappa leather.",
    specs: {
      "Material": "Toray 3K Twill Gloss Carbon Fiber & Nappa Leather",
      "Display": "Custom OLED 128x32 Telemetry & 16-LED RPM Shift Indicator",
      "Connection": "OBD-II Wireless Bluetooth 5.2 Module (Included)",
      "Stitching": "Motorsport Crimson Red Dual Stitching",
      "Paddle Shifters": "Extended Carbon Magnetic Click Paddles",
      "Warranty": "3-Year Limited Manufacturer Warranty"
    },
    features: [
      "Real-time 0-60 mph timer and lap time recorder",
      "Plug & play OBD2 smart module with zero wire splicing",
      "Ergonomic thumb rests and contoured D-cut flat bottom",
      "100% factory airbag and multi-function button transfer"
    ],
    compatibleMakes: ["BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Ford", "Toyota"],
    universalFit: false,
    stock: 7,
    isFeatured: true
  },
  {
    id: "prod-002",
    name: "LuminaRGB Fiber Optic Neo Ambient Interior Lighting Kit",
    category: "lighting",
    price: 89.99,
    originalPrice: 129.99,
    rating: 4.8,
    reviewsCount: 389,
    badge: "Trending",
    image: "assets/images/ambient_lighting_kit.jpg",
    gallery: ["assets/images/ambient_lighting_kit.jpg", "assets/images/hero_car_accessories.jpg"],
    shortDesc: "Sub-millimeter optical fiber strips with 16 Million RGBW colors, sound-reactive acoustics, and iOS/Android app sync.",
    description: "Transform your vehicle cabin into an ultra-modern lounge. Ultra-thin transparent light guides insert cleanly into interior seams with zero adhesives or visible wires. Features dynamic music sync, welcoming sequence, and customizable color zones.",
    specs: {
      "Light Source": "High-Efficiency Quad-Core RGBW LED Drivers",
      "Fiber Length": "6x 78-inch (2m) Optical Guide Lines",
      "Control": "Bluetooth 5.0 iOS/Android App + Wireless RF Remote",
      "Voltage": "DC 12V (Cigarette Lighter & Fuse Box Harness Included)",
      "Modes": "Dynamic Flowing, Strobe, Music Pulse, Static Mood"
    },
    features: [
      "Invisible seam installation with ultra-thin 0.5mm mounting tabs",
      "16 Million RGBW colors with independent 4-zone lighting control",
      "Acoustic sensor matches cabin audio beat in real-time",
      "Memory chip restores your last setting on car ignition"
    ],
    compatibleMakes: ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
    universalFit: true,
    stock: 28,
    isFeatured: true
  },
  {
    id: "prod-003",
    name: "VisionPro 4K Starvis-2 Dual Smart Dashcam System",
    category: "tech",
    price: 189.99,
    originalPrice: 249.99,
    rating: 4.9,
    reviewsCount: 512,
    badge: "Top Rated",
    image: "assets/images/dual_dashcam_4k.jpg",
    gallery: ["assets/images/dual_dashcam_4k.jpg"],
    shortDesc: "Sony STARVIS 2 true 4K UHD front + 1080P rear dual camera with 24/7 AI parking surveillance and GPS logging.",
    description: "Uncompromised security for your pride and joy. Equipped with industry-leading Sony STARVIS 2 sensor, HDR night vision, supercapacitor power (resists extreme heat up to 160°F), and 5GHz Wi-Fi for instant phone footage download.",
    specs: {
      "Resolution": "Front 4K UHD (3840x2160@30fps) + Rear 1080P FHD",
      "Sensor": "Sony STARVIS 2 IMX678 Ultra-Low-Light Sensor",
      "Display": "2.4-inch High-Definition IPS Anti-Glare Screen",
      "Field of View": "165° Front Wide-Angle + 150° Rear",
      "Storage": "Includes 128GB High-Endurance U3 MicroSD Card"
    },
    features: [
      "24/7 G-sensor parking monitor with collision impact auto-lock",
      "License plate clarity in pitch darkness via advanced HDR",
      "Time-lapse recording preserves 48+ hours without overwriting",
      "Heat-resistant supercapacitor (No lithium battery fire risk)"
    ],
    compatibleMakes: ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
    universalFit: true,
    stock: 19,
    isFeatured: true
  },
  {
    id: "prod-004",
    name: "Apex Aero GT High-Gloss Twill Carbon Trunk Spoiler",
    category: "performance",
    price: 329.99,
    originalPrice: 420.00,
    rating: 4.8,
    reviewsCount: 94,
    badge: "Aerodynamic",
    image: "assets/images/carbon_spoiler_wing.jpg",
    gallery: ["assets/images/carbon_spoiler_wing.jpg", "assets/images/hero_car_accessories.jpg"],
    shortDesc: "Precision vacuum-infused dry carbon fiber duckbill spoiler engineered for downforce stability and aggressive styling.",
    description: "Sculpted in high-speed wind tunnels, this rear trunk spoiler provides tangible high-speed rear axle stability while giving your vehicle a ferocious sports stance. Finished with multi-layer UV resistant ceramic clear coat.",
    specs: {
      "Construction": "Dry Vacuum-Infused 3K Twill Weave Pre-Preg Carbon",
      "Finish": "High-Gloss Mirror Clear Coat with 99.8% UV Block",
      "Weight": "Ultra-lightweight: 1.45 lbs (660 grams)",
      "Installation": "Includes 3M VHB Automotive Bonding Tape (No Drilling)"
    },
    features: [
      "No drilling required: installs in 20 minutes with 3M automotive tape",
      "Zero yellowing or fading guarantee backed by 5-year UV warranty",
      "Precision laser-scanned OEM trunk edge curvature fitment",
      "Sleek ducktail kick provides aggressive rear profile"
    ],
    compatibleMakes: ["BMW", "Audi", "Tesla", "Toyota", "Ford", "Honda", "Subaru"],
    universalFit: false,
    stock: 11,
    isFeatured: true
  },
  {
    id: "prod-005",
    name: "MagVent 15W Auto-Clamping Magnetic Fast Car Mount",
    category: "tech",
    price: 49.99,
    originalPrice: 69.99,
    rating: 4.7,
    reviewsCount: 620,
    badge: "Sale 28% OFF",
    image: "assets/images/wireless_car_charger.jpg",
    gallery: ["assets/images/wireless_car_charger.jpg"],
    shortDesc: "Qi2 15W wireless fast charging phone holder with smart infrared motorized clamps and aerospace aluminum bracket.",
    description: "The ultimate cockpit phone cockpit solution. Built with dual infrared sensors that automatically open and clamp securely when your smartphone approaches. Features MagSafe-grade N52 neodymium magnets and a cool-running silent internal cooling turbine.",
    specs: {
      "Output": "15W Max Qi2 Fast Wireless Charging",
      "Mounting": "Steel-Core Air Vent Hook & 360° Suction Dashboard Base",
      "Materials": "Tempered Scratch-Resistant Glass & Anodized Aluminum"
    },
    features: [
      "Motorized arms close automatically when phone is placed",
      "Built-in supercapacitor opens clamp even after car engine is shut off",
      "Active cooling fan prevents phone overheating on hot sunny commutes",
      "Rotates 360 degrees smoothly for GPS navigation orientation"
    ],
    compatibleMakes: ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
    universalFit: true,
    stock: 45,
    isFeatured: true
  },
  {
    id: "prod-006",
    name: "CeramiShield 10H Graphene Ceramic Coating Kit",
    category: "care",
    price: 64.99,
    originalPrice: 89.99,
    rating: 4.9,
    reviewsCount: 275,
    badge: "Pro Detailer",
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80",
    gallery: ["https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80"],
    shortDesc: "True 10H hardness infused with aerospace graphene. Provides hyper-slick hydrophobic water beading and 5-year paint protection.",
    description: "Give your vehicle a deep mirror gloss finish that sheds dirt, bird droppings, acid rain, and road salt effortlessly. The infused graphene lattice reduces surface heat absorption and repels water spots like magic.",
    specs: {
      "Hardness": "Certified 10H Pencil Hardness",
      "Durability": "Up to 5 Years / 70,000 Miles Protection",
      "Kit Includes": "50ml Bottle, 2x Applicator Blocks, 5x Suede Cloths, Gloves"
    },
    features: [
      "Candy-like deep wet gloss reflection on any color vehicle",
      "Anti-scratch surface resilience against micro-swirls during washes",
      "Self-cleaning effect: dirt washes off with simple water rinse",
      "Safe on clear coats, vinyl wraps, wheels, and carbon fiber"
    ],
    compatibleMakes: ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
    universalFit: true,
    stock: 33,
    isFeatured: false
  },
  {
    id: "prod-007",
    name: "ApexAir Turbo 150PSI Digital Smart Tire Inflator & Jump Starter",
    category: "tech",
    price: 99.99,
    originalPrice: 139.99,
    rating: 4.8,
    reviewsCount: 310,
    badge: "Emergency Must-Have",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    gallery: ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"],
    shortDesc: "Cordless 150 PSI rapid tire pump combined with a 2500A peak lithium car battery jump starter and emergency LED floodlight.",
    description: "Never get stranded on the highway. Jumps 8.5L gas and 6.5L diesel engines up to 30 times on a single charge. High-precision digital barometer stops automatically at preset PSI within seconds.",
    specs: {
      "Max Pressure": "150 PSI (Accurate to +/- 0.5 PSI)",
      "Jump Starter Peak": "2500 Amps Peak Crank Current",
      "Battery": "16,000mAh Lithium Power Bank with USB-C PD 65W"
    },
    features: [
      "Auto-shutoff once desired tire pressure is reached",
      "Sparks-proof heavy-duty copper clamp protection cables",
      "Charges laptops, tablets, and phones via rapid USB-C PD",
      "Compact carry case fits neatly under seat or in trunk"
    ],
    compatibleMakes: ["Universal", "BMW", "Audi", "Tesla", "Mercedes-Benz", "Porsche", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
    universalFit: true,
    stock: 22,
    isFeatured: false
  },
  {
    id: "prod-008",
    name: "MatrixBeam Sequential Dynamic LED Headlight Bulbs (Pair)",
    category: "lighting",
    price: 119.99,
    originalPrice: 159.99,
    rating: 4.8,
    reviewsCount: 184,
    badge: "300% Brighter",
    image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80",
    gallery: ["https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80"],
    shortDesc: "24,000 Lumens 6500K pure white CSP LED upgrade kit with zero glare cut-off line and copper heat-pipe cooling.",
    description: "Turn dark backroads into broad daylight. Engineered with aerospace thermal copper tubing and 12,000 RPM silent magnetic levitation fans to deliver 50,000 hours of blindingly clear, street-legal beam clarity.",
    specs: {
      "Luminous Flux": "24,000 LM per pair (12,000 LM per bulb)",
      "Color Temp": "6500K Crystal Diamond White",
      "CANBUS": "100% CANBUS Ready (No flicker or dashboard error codes)"
    },
    features: [
      "300% wider beam angle eliminates deer hazard blind spots",
      "Ultra-thin 1.0mm chip gap recreates flawless OEM focal point",
      "Plug & play 10-minute install without ballast boxes",
      "Anti-radio interference EMC shield built in"
    ],
    compatibleMakes: ["Universal", "BMW", "Audi", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
    universalFit: true,
    stock: 16,
    isFeatured: false
  },
  {
    id: "prod-009",
    name: "ThrottleX Pro 9-Mode Electronic Throttle Response Controller",
    category: "performance",
    price: 149.99,
    originalPrice: 199.99,
    rating: 4.9,
    reviewsCount: 167,
    badge: "Zero Turbo Lag",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    gallery: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80"],
    shortDesc: "Eliminates electronic pedal delay instantly. Features Race, Sport+, Eco, Valet, Anti-Theft Lock, and Auto AI modes.",
    description: "Does your vehicle feel sluggish when you hit the gas? ThrottleX intercepts the fly-by-wire pedal sensor to deliver instantaneous throttle response, sharper acceleration, and switchable fuel-saving eco modes.",
    specs: {
      "Modes": "9 Programs with 9 Micro-Sensitivity Levels (81 Settings)",
      "Display": "Slim Curved OLED Micro Display with CNC Aluminum Dial"
    },
    features: [
      "Instant neck-snapping acceleration feel on demand",
      "Does not void factory engine ECU warranty",
      "Valet mode limits max throttle to 30%",
      "Eco mode smooths throttle for stop-and-go city fuel economy"
    ],
    compatibleMakes: ["BMW", "Audi", "Tesla", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
    universalFit: false,
    stock: 14,
    isFeatured: false
  },
  {
    id: "prod-010",
    name: "Apex 3D Laser-Fit Carbon Textured All-Weather Floor Mats",
    category: "interior",
    price: 139.99,
    originalPrice: 179.99,
    rating: 4.8,
    reviewsCount: 228,
    badge: "Laser Measured",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
    gallery: ["https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80"],
    shortDesc: "3D digital laser scanned thermal TPE floor liners with raised side walls and waterproof carbon fiber grain texture.",
    description: "Keep your car carpets pristine in mud, snow, spills, and sand. Unlike cheap rubber mats that smell in the summer heat, our eco-friendly non-toxic TPE remains flexible from -40°F to 175°F and cleans off with a hose.",
    specs: {
      "Material": "Multi-Layer High-Density TPE with Carbon Fiber Pattern",
      "Fitment": "Custom Laser Measured (Front Row + Rear Passenger Row)"
    },
    features: [
      "High raised perimeter keeps melted snow and coffee spills contained",
      "Anti-skid bottom claws lock directly into factory floor anchors",
      "Zero curling or cracking under extreme desert sun or winter freezes",
      "Pressure washer safe for quick 60-second cleanup"
    ],
    compatibleMakes: ["BMW", "Audi", "Tesla", "Toyota", "Ford", "Honda"],
    universalFit: false,
    stock: 25,
    isFeatured: false
  },
  {
    id: "prod-011",
    name: "SoundCraft 600W Compact Under-Seat Powered Subwoofer",
    category: "tech",
    price: 179.99,
    originalPrice: 229.99,
    rating: 4.7,
    reviewsCount: 140,
    badge: "Deep Bass",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    gallery: ["https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80"],
    shortDesc: "Ultra-slim cast-aluminum active 10-inch subwoofer with integrated Class D amplifier and remote bass level knob.",
    description: "Add punchy, heart-thumping low-end audio without sacrificing your trunk space. At just 2.8 inches thick, it slides effortlessly under driver or passenger seats while delivering 600W peak acoustic power.",
    specs: {
      "Peak Power": "600 Watts (200W RMS Continuous)",
      "Woofer Size": "10-inch Low Profile Anodized Cone",
      "Dimensions": "13.6 x 10.2 x 2.8 Ultra-Slim Profile"
    },
    features: [
      "Fits under standard car seats without modifying upholstery",
      "Remote bass boost dial fits cleanly in center console",
      "Built-in subsonic filter and low-pass crossover (50Hz - 150Hz)",
      "Works with OEM factory radios and aftermarket head units"
    ],
    compatibleMakes: ["Universal", "BMW", "Audi", "Tesla", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
    universalFit: true,
    stock: 12,
    isFeatured: false
  },
  {
    id: "prod-012",
    name: "AeroBurn Quad Titanium-Blue Burnt Exhaust Tips (Pair)",
    category: "performance",
    price: 79.99,
    originalPrice: 109.99,
    rating: 4.8,
    reviewsCount: 119,
    badge: "Aggressive Stance",
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
    gallery: ["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80"],
    shortDesc: "Mirror-polished T-304 stainless steel with electro-ionized burnt titanium blue slant cut and double-wall resonance.",
    description: "Give your vehicle rear diffuser an unmistakable track-inspired presence. Features double-wall thermal insulation to prevent exhaust soot discoloration and a bolt-on heavy-duty stainless clamp system.",
    specs: {
      "Material": "T-304 Marine Grade Stainless Steel with Titanium Ion Coat",
      "Inlet Diameter": "2.5-inch (63mm) Universal Clamp-on",
      "Outlet Diameter": "3.5-inch (89mm) Aggressive Slant Cut"
    },
    features: [
      "Deepens exhaust tone through acoustic double-wall chamber",
      "Corrosion-proof titanium electroplate will never rust or flake",
      "Drain hole prevents water retention and condensation rust",
      "Fits 90% of sport sedans, hatchbacks, and performance SUVs"
    ],
    compatibleMakes: ["Universal", "BMW", "Audi", "Toyota", "Ford", "Honda", "Subaru", "Nissan"],
    universalFit: true,
    stock: 18,
    isFeatured: false
  }
];

export let CAR_MODELS = {
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
};

export const PROMO_CODES = {
  "TURBO10": { type: "percent", value: 10, minSpend: 0, description: "10% Off Entire Order" },
  "SPEED25": { type: "flat", value: 25, minSpend: 100, description: "$25 Off Orders over $100" },
  "FREESHIP": { type: "shipping", value: 0, minSpend: 0, description: "Free Express Shipping" },
  "APEX50": { type: "flat", value: 50, minSpend: 250, description: "$50 Off Orders over $250" }
};

// ==============================================================================
// BACKEND API CLIENT FUNCTIONS
// ==============================================================================

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (e) {
    console.warn('Backend server offline or unreachable, using local fallback:', e);
    return null;
  }
}

export async function fetchProductsAPI(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/products?${query}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    if (data.success && data.products) {
      PRODUCTS = data.products;
      return data.products;
    }
    return PRODUCTS;
  } catch (e) {
    console.warn('Using local catalog fallback:', e);
    return PRODUCTS;
  }
}

export async function fetchProductDetailAPI(productId) {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch product details');
    const data = await res.json();
    return data.success ? data.product : null;
  } catch (e) {
    console.warn('Failed to fetch product details from DB:', e);
    return PRODUCTS.find(p => p.id === productId) || null;
  }
}

export async function fetchVehiclesAPI() {
  try {
    const res = await fetch(`${API_BASE}/vehicles`);
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    const data = await res.json();
    if (data.success && data.vehicles) {
      CAR_MODELS = data.vehicles;
      return data.vehicles;
    }
    return CAR_MODELS;
  } catch (e) {
    return CAR_MODELS;
  }
}

export async function submitOrderAPI(orderPayload) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    return await res.json();
  } catch (e) {
    console.error('Error submitting order to DB:', e);
    return { success: false, error: e.message };
  }
}

export async function fetchOrderAPI(orderId) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`);
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function submitReviewAPI(reviewPayload) {
  try {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload)
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}
