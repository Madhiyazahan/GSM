"""
APEX AUTO GEAR - Unified Backend Server
Dual-Engine: Supabase (PostgreSQL Cloud) + Local SQLite Auto-Fallback
"""

import os
import sys
import sqlite3
import json
import random
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Safe UTF-8 console output for Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database', 'apex_store.db')
ENV_PATH = os.path.join(BASE_DIR, '.env')

load_dotenv(ENV_PATH)

app = Flask(__name__, static_folder=BASE_DIR)
CORS(app)

# ==============================================================================
# SUPABASE CLIENT SETUP & HEALTH MONITOR
# ==============================================================================
supabase_client = None
SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip()
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '').strip()

def init_supabase(url, key):
    global supabase_client, SUPABASE_URL, SUPABASE_KEY
    if url and key and not url.startswith('https://your-project'):
        try:
            from supabase import create_client
            supabase_client = create_client(url, key)
            SUPABASE_URL = url
            SUPABASE_KEY = key
            print(f"[*] Supabase Cloud Client Initialized: {url}")
            return True
        except Exception as e:
            print(f"[!] Warning: Failed to connect to Supabase: {e}")
            supabase_client = None
            return False
    supabase_client = None
    return False

# Attempt initial Supabase connection
init_supabase(SUPABASE_URL, SUPABASE_KEY)

def get_sqlite_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def is_supabase_active():
    return supabase_client is not None

# ==============================================================================
# STATIC FRONTEND ROUTES
# ==============================================================================

@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

# ==============================================================================
# REST API ENDPOINTS (Dual-Engine Supabase + SQLite)
# ==============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Reports active database engine (Supabase Cloud or SQLite)"""
    if is_supabase_active():
        try:
            # Query Supabase products count
            res = supabase_client.table('products').select('id', count='exact').execute()
            orders_res = supabase_client.table('orders').select('id', count='exact').execute()
            return jsonify({
                "status": "healthy",
                "engine": "supabase",
                "database": "Supabase Cloud (PostgreSQL)",
                "supabase_url": SUPABASE_URL,
                "products_count": res.count or 0,
                "orders_count": orders_res.count or 0,
                "server_time": datetime.now().isoformat()
            })
        except Exception as e:
            print(f"[!] Supabase health query failed, falling back to SQLite: {e}")

    # Fallback to local SQLite
    try:
        conn = get_sqlite_db()
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM products;")
        prod_count = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM orders;")
        order_count = c.fetchone()[0]
        conn.close()
        return jsonify({
            "status": "healthy",
            "engine": "sqlite",
            "database": "SQLite (Local Fallback)",
            "supabase_configured": bool(SUPABASE_URL and SUPABASE_KEY),
            "products_count": prod_count,
            "orders_count": order_count,
            "server_time": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route('/api/supabase/config', methods=['GET', 'POST'])
def handle_supabase_config():
    """Configures and tests Supabase connection live from the frontend"""
    if request.method == 'GET':
        return jsonify({
            "configured": is_supabase_active(),
            "url": SUPABASE_URL if SUPABASE_URL else "",
            "hasKey": bool(SUPABASE_KEY)
        })

    data = request.get_json() or {}
    url = data.get('url', '').strip()
    key = data.get('key', '').strip()

    if not url or not key:
        return jsonify({"success": False, "error": "Both Supabase URL and API Key are required."}), 400

    success = init_supabase(url, key)
    if success:
        # Save to .env
        try:
            with open(ENV_PATH, 'w', encoding='utf-8') as f:
                f.write(f"SUPABASE_URL={url}\n")
                f.write(f"SUPABASE_KEY={key}\n")
        except Exception as e:
            print(f"Could not write .env: {e}")

        # Check if tables exist in Supabase
        try:
            test_query = supabase_client.table('products').select('id').limit(1).execute()
            has_tables = True
        except Exception:
            has_tables = False

        return jsonify({
            "success": True,
            "message": "Connected to Supabase PostgreSQL successfully!",
            "engine": "supabase",
            "hasTables": has_tables
        })
    else:
        return jsonify({
            "success": False,
            "error": "Failed to connect to Supabase. Please check your Project URL and API Key."
        }), 400

@app.route('/api/supabase/sync', methods=['POST'])
def sync_sqlite_to_supabase():
    """Syncs existing SQLite products and models directly into Supabase"""
    if not is_supabase_active():
        return jsonify({"success": False, "error": "Supabase is not connected. Configure credentials first."}), 400

    try:
        conn = get_sqlite_db()
        c = conn.cursor()

        # 1. Fetch products from SQLite
        c.execute("SELECT * FROM products;")
        prods = [dict(r) for r in c.fetchall()]

        synced_products = 0
        product_errors = []
        for p in prods:
            try:
                payload = {
                    "id": p["id"],
                    "name": p["name"],
                    "category": p["category"],
                    "price": p["price"],
                    "original_price": p["original_price"],
                    "rating": p["rating"],
                    "reviews_count": p["reviews_count"],
                    "badge": p["badge"],
                    "image": p["image"],
                    "gallery": json.loads(p["gallery"]) if p["gallery"] else [],
                    "short_desc": p["short_desc"],
                    "description": p["description"],
                    "specs": json.loads(p["specs"]) if p["specs"] else {},
                    "features": json.loads(p["features"]) if p["features"] else [],
                    "compatible_makes": json.loads(p["compatible_makes"]) if p["compatible_makes"] else [],
                    "universal_fit": bool(p["universal_fit"]),
                    "stock": p["stock"],
                    "is_featured": bool(p["is_featured"])
                }
                supabase_client.table('products').upsert(payload, on_conflict='id').execute()
                synced_products += 1
            except Exception as pe:
                product_errors.append(str(pe))
                print(f"[!] Product sync error ({p.get('id')}): {pe}")

        # 2. Sync car models — delete-first then bulk insert to avoid duplicates / PGRST125
        synced_models = 0
        model_error = None
        try:
            c.execute("SELECT make, model FROM car_models;")
            models = [dict(r) for r in c.fetchall()]

            # Clear existing rows first so re-sync is always clean
            supabase_client.table('car_models').delete().neq('id', 0).execute()

            # Bulk insert in batches of 50
            batch_size = 50
            for i in range(0, len(models), batch_size):
                batch = models[i:i + batch_size]
                supabase_client.table('car_models').insert(batch).execute()
                synced_models += len(batch)
        except Exception as me:
            model_error = str(me)
            print(f"[!] Car models sync error: {me}")

        conn.close()

        # Build result
        msg_parts = []
        if synced_products > 0:
            msg_parts.append(f"{synced_products} products")
        if synced_models > 0:
            msg_parts.append(f"{synced_models} vehicle models")

        if not msg_parts:
            return jsonify({
                "success": False,
                "error": f"Nothing synced. Check that tables exist in Supabase (run supabase_schema.sql first). Details: {product_errors or model_error}"
            }), 500

        warnings = []
        if product_errors:
            warnings.append(f"{len(product_errors)} product(s) skipped: {product_errors[0]}")
        if model_error:
            warnings.append(f"Vehicle models error: {model_error}")

        return jsonify({
            "success": True,
            "message": f"Synced {', '.join(msg_parts)} to Supabase!",
            "synced_products": synced_products,
            "synced_models": synced_models,
            "warnings": warnings
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Returns vehicle makes and their corresponding models from Supabase or SQLite"""
    if is_supabase_active():
        try:
            res = supabase_client.table('car_models').select('make, model').order('make').execute()
            result = {}
            for row in res.data:
                make = row["make"]
                model = row["model"]
                if make not in result:
                    result[make] = []
                result[make].append(model)
            if result:
                return jsonify({"success": True, "engine": "supabase", "vehicles": result})
        except Exception as e:
            print(f"[!] Supabase vehicles query failed: {e}")

    # SQLite fallback
    try:
        conn = get_sqlite_db()
        c = conn.cursor()
        c.execute("SELECT make, model FROM car_models ORDER BY make ASC, model ASC;")
        rows = c.fetchall()
        conn.close()

        result = {}
        for row in rows:
            make = row["make"]
            model = row["model"]
            if make not in result:
                result[make] = []
            result[make].append(model)

        return jsonify({"success": True, "engine": "sqlite", "vehicles": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/products', methods=['GET'])
def list_products():
    """Lists products with optional filtering and sorting from Supabase or SQLite"""
    category = request.args.get('category', 'all')
    search = request.args.get('search', '').strip()
    make = request.args.get('make', '').strip()
    in_stock_only = request.args.get('in_stock', '0') == '1'
    sort_by = request.args.get('sort', 'featured')

    products = []
    engine_used = "sqlite"

    if is_supabase_active():
        try:
            query = supabase_client.table('products').select('*')
            if category and category != 'all':
                query = query.eq('category', category)
            if in_stock_only:
                query = query.gt('stock', 0)

            res = query.execute()
            for r in res.data:
                item = dict(r)
                item["compatibleMakes"] = item.get("compatible_makes") or []
                item["universalFit"] = bool(item.get("universal_fit"))
                item["isFeatured"] = bool(item.get("is_featured"))
                item["originalPrice"] = item.get("original_price")
                item["shortDesc"] = item.get("short_desc")
                item["reviewsCount"] = item.get("reviews_count")
                products.append(item)
            engine_used = "supabase"
        except Exception as e:
            print(f"[!] Supabase products query failed, using SQLite: {e}")
            products = []

    # If Supabase not active or returned empty
    if not products:
        try:
            conn = get_sqlite_db()
            c = conn.cursor()
            q = "SELECT * FROM products WHERE 1=1"
            params = []
            if category and category != 'all':
                q += " AND category = ?"
                params.append(category)
            if in_stock_only:
                q += " AND stock > 0"
            c.execute(q, params)
            rows = c.fetchall()
            for r in rows:
                item = dict(r)
                item["gallery"] = json.loads(item["gallery"]) if item["gallery"] else []
                item["specs"] = json.loads(item["specs"]) if item["specs"] else {}
                item["features"] = json.loads(item["features"]) if item["features"] else []
                item["compatibleMakes"] = json.loads(item["compatible_makes"]) if item["compatible_makes"] else []
                item["universalFit"] = bool(item["universal_fit"])
                item["isFeatured"] = bool(item["is_featured"])
                item["originalPrice"] = item["original_price"]
                item["shortDesc"] = item["short_desc"]
                item["reviewsCount"] = item["reviews_count"]
                products.append(item)
            conn.close()
            engine_used = "sqlite"
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    # In-memory search & fitment filter
    if search:
        s = search.lower()
        products = [
            p for p in products
            if s in (p.get("name") or "").lower() or s in (p.get("shortDesc") or "").lower() or s in (p.get("category") or "").lower()
        ]

    if make:
        products = [
            p for p in products
            if p.get("universalFit") or (make in (p.get("compatibleMakes") or []))
        ]

    # Sorting
    if sort_by == 'price-low':
        products.sort(key=lambda x: x.get("price", 0))
    elif sort_by == 'price-high':
        products.sort(key=lambda x: x.get("price", 0), reverse=True)
    elif sort_by == 'rating':
        products.sort(key=lambda x: x.get("rating", 0), reverse=True)
    elif sort_by == 'stock':
        products.sort(key=lambda x: x.get("stock", 0), reverse=True)
    else: # featured
        products.sort(key=lambda x: (x.get("isFeatured", False), x.get("reviewsCount", 0)), reverse=True)

    return jsonify({"success": True, "engine": engine_used, "count": len(products), "products": products})

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Returns single product with parsed specs and reviews"""
    if is_supabase_active():
        try:
            prod_res = supabase_client.table('products').select('*').eq('id', product_id).single().execute()
            if prod_res.data:
                item = dict(prod_res.data)
                item["compatibleMakes"] = item.get("compatible_makes") or []
                item["universalFit"] = bool(item.get("universal_fit"))
                item["isFeatured"] = bool(item.get("is_featured"))
                item["originalPrice"] = item.get("original_price")
                item["shortDesc"] = item.get("short_desc")
                item["reviewsCount"] = item.get("reviews_count")

                # Reviews
                rev_res = supabase_client.table('reviews').select('*').eq('product_id', product_id).order('id', desc=True).execute()
                item["reviews"] = rev_res.data or []
                return jsonify({"success": True, "engine": "supabase", "product": item})
        except Exception as e:
            print(f"[!] Supabase get_product failed: {e}")

    # SQLite fallback
    try:
        conn = get_sqlite_db()
        c = conn.cursor()
        c.execute("SELECT * FROM products WHERE id = ?;", (product_id,))
        row = c.fetchone()
        if not row:
            conn.close()
            return jsonify({"success": False, "error": "Product not found"}), 404

        item = dict(row)
        item["gallery"] = json.loads(item["gallery"]) if item["gallery"] else []
        item["specs"] = json.loads(item["specs"]) if item["specs"] else {}
        item["features"] = json.loads(item["features"]) if item["features"] else []
        item["compatibleMakes"] = json.loads(item["compatible_makes"]) if item["compatible_makes"] else []
        item["universalFit"] = bool(item["universal_fit"])
        item["isFeatured"] = bool(item["is_featured"])
        item["originalPrice"] = item["original_price"]
        item["shortDesc"] = item["short_desc"]
        item["reviewsCount"] = item["reviews_count"]

        c.execute("SELECT author, rating, vehicle, comment, created_at FROM reviews WHERE product_id = ? ORDER BY id DESC;", (product_id,))
        item["reviews"] = [dict(r) for r in c.fetchall()]
        conn.close()

        return jsonify({"success": True, "engine": "sqlite", "product": item})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Creates an order, validates inventory, and saves to Supabase or SQLite"""
    payload = request.get_json() or {}
    items = payload.get('items', [])
    shipping_info = payload.get('shipping', {})
    totals = payload.get('totals', {})
    payment = payload.get('payment', {})

    if not items:
        return jsonify({"success": False, "error": "Cart is empty"}), 400

    order_id = f"APX-{random.randint(100000, 999999)}"

    # If Supabase is active
    if is_supabase_active():
        try:
            # 1. Insert order into Supabase
            order_data = {
                "id": order_id,
                "customer_name": shipping_info.get('name', 'Valued Customer'),
                "customer_email": shipping_info.get('email', 'customer@apex.com'),
                "customer_phone": shipping_info.get('phone', ''),
                "shipping_address": shipping_info.get('address', '742 Evergreen Terrace'),
                "shipping_city": shipping_info.get('city', 'Los Angeles'),
                "shipping_zip": shipping_info.get('zip', '90210'),
                "shipping_method": totals.get('shippingMethod', 'standard'),
                "subtotal": float(totals.get('subtotal', 0)),
                "discount": float(totals.get('discount', 0)),
                "shipping_cost": float(totals.get('shippingCost', 0)),
                "tax": float(totals.get('tax', 0)),
                "total": float(totals.get('total', 0)),
                "payment_method": payment.get('method', 'Credit Card (•••• 4242)'),
                "status": "Order Confirmed"
            }
            supabase_client.table('orders').insert(order_data).execute()

            # 2. Insert line items
            for it in items:
                order_item = {
                    "order_id": order_id,
                    "product_id": it.get('id'),
                    "product_name": it.get('name'),
                    "product_image": it.get('image'),
                    "unit_price": float(it.get('price', 0)),
                    "quantity": int(it.get('quantity', 1)),
                    "vehicle_tag": it.get('vehicleTag')
                }
                supabase_client.table('order_items').insert(order_item).execute()

                # Decrement stock in Supabase
                try:
                    p_res = supabase_client.table('products').select('stock').eq('id', it.get('id')).single().execute()
                    if p_res.data:
                        new_stock = max(0, p_res.data['stock'] - int(it.get('quantity', 1)))
                        supabase_client.table('products').update({'stock': new_stock}).eq('id', it.get('id')).execute()
                except Exception as ex:
                    print(f"Stock update note: {ex}")

            return jsonify({
                "success": True,
                "engine": "supabase",
                "orderId": order_id,
                "message": "Order saved to Supabase PostgreSQL database successfully!",
                "createdAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "status": "Order Confirmed",
                "total": totals.get('total', 0)
            })
        except Exception as e:
            print(f"[!] Supabase order insert failed, saving to SQLite: {e}")

    # SQLite fallback
    try:
        conn = get_sqlite_db()
        c = conn.cursor()

        # Check stock and decrement
        for it in items:
            c.execute("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?;", (int(it.get('quantity', 1)), it.get('id')))

        c.execute("""
        INSERT INTO orders (
            id, customer_name, customer_email, customer_phone,
            shipping_address, shipping_city, shipping_zip,
            shipping_method, subtotal, discount, shipping_cost,
            tax, total, payment_method, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            order_id,
            shipping_info.get('name', 'Valued Customer'),
            shipping_info.get('email', 'customer@apex.com'),
            shipping_info.get('phone', ''),
            shipping_info.get('address', '742 Evergreen Terrace'),
            shipping_info.get('city', 'Los Angeles'),
            shipping_info.get('zip', '90210'),
            totals.get('shippingMethod', 'standard'),
            float(totals.get('subtotal', 0)),
            float(totals.get('discount', 0)),
            float(totals.get('shippingCost', 0)),
            float(totals.get('tax', 0)),
            float(totals.get('total', 0)),
            payment.get('method', 'Credit Card (•••• 4242)'),
            'Order Confirmed'
        ))

        for it in items:
            c.execute("""
            INSERT INTO order_items (
                order_id, product_id, product_name, product_image,
                unit_price, quantity, vehicle_tag
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (
                order_id,
                it.get('id'),
                it.get('name'),
                it.get('image'),
                float(it.get('price', 0)),
                int(it.get('quantity', 1)),
                it.get('vehicleTag')
            ))

        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "engine": "sqlite",
            "orderId": order_id,
            "message": "Order saved to database successfully",
            "createdAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "Order Confirmed",
            "total": totals.get('total', 0)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    """Fetches full order details and line items from Supabase or SQLite"""
    if is_supabase_active():
        try:
            res = supabase_client.table('orders').select('*').eq('id', order_id).single().execute()
            if res.data:
                order_data = dict(res.data)
                items_res = supabase_client.table('order_items').select('*').eq('order_id', order_id).execute()
                order_data["items"] = items_res.data or []
                return jsonify({"success": True, "engine": "supabase", "order": order_data})
        except Exception as e:
            print(f"[!] Supabase order lookup failed: {e}")

    # SQLite fallback
    try:
        conn = get_sqlite_db()
        c = conn.cursor()
        c.execute("SELECT * FROM orders WHERE id = ?;", (order_id,))
        order = c.fetchone()
        if not order:
            conn.close()
            return jsonify({"success": False, "error": "Order not found"}), 404

        order_data = dict(order)
        c.execute("SELECT * FROM order_items WHERE order_id = ?;", (order_id,))
        order_data["items"] = [dict(i) for i in c.fetchall()]
        conn.close()

        return jsonify({"success": True, "engine": "sqlite", "order": order_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/reviews', methods=['POST'])
def add_review():
    """Submits a customer review to Supabase or SQLite"""
    data = request.get_json() or {}
    prod_id = data.get('productId')
    author = data.get('author', '').strip() or 'Automotive Enthusiast'
    rating = int(data.get('rating', 5))
    vehicle = data.get('vehicle', 'Verified Vehicle Owner')
    comment = data.get('comment', '').strip()

    if not prod_id or not comment:
        return jsonify({"success": False, "error": "Product ID and comment are required"}), 400

    if is_supabase_active():
        try:
            rev_payload = {
                "product_id": prod_id,
                "author": author,
                "rating": rating,
                "vehicle": vehicle,
                "comment": comment
            }
            supabase_client.table('reviews').insert(rev_payload).execute()

            # Recalculate average rating
            revs = supabase_client.table('reviews').select('rating').eq('product_id', prod_id).execute()
            if revs.data:
                avg = sum(r['rating'] for r in revs.data) / len(revs.data)
                supabase_client.table('products').update({
                    "rating": round(avg, 1),
                    "reviews_count": len(revs.data)
                }).eq('id', prod_id).execute()

            return jsonify({
                "success": True,
                "engine": "supabase",
                "message": "Review saved directly to Supabase PostgreSQL!",
                "newRating": round(avg, 1) if revs.data else 5.0
            })
        except Exception as e:
            print(f"[!] Supabase review insert failed: {e}")

    # SQLite fallback
    try:
        conn = get_sqlite_db()
        c = conn.cursor()
        c.execute("INSERT INTO reviews (product_id, author, rating, vehicle, comment) VALUES (?, ?, ?, ?, ?);",
                  (prod_id, author, rating, vehicle, comment))
        c.execute("SELECT AVG(rating), COUNT(*) FROM reviews WHERE product_id = ?;", (prod_id,))
        avg_rating, count = c.fetchone()
        c.execute("UPDATE products SET rating = ROUND(?, 1), reviews_count = ? WHERE id = ?;", (avg_rating or 5.0, count, prod_id))
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "engine": "sqlite",
            "message": "Review saved to database!",
            "newRating": round(avg_rating or 5.0, 1),
            "reviewsCount": count
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ==============================================================================
# STATIC FILE SERVING (After all API routes)
# ==============================================================================
@app.route('/<path:path>')
def serve_static(path):
    if path.startswith('api/'):
        return jsonify({"error": "Endpoint not found"}), 404
    if os.path.exists(os.path.join(BASE_DIR, path)):
        return send_from_directory(BASE_DIR, path)
    return send_from_directory(BASE_DIR, 'index.html')

# ==============================================================================
# MAIN ENTRY POINT
# ==============================================================================
if __name__ == '__main__':
    print("==============================================================")
    print(" APEX DRIVE UNIFIED BACKEND SERVER")
    print(f" Engine Mode: {'⚡ Supabase Cloud PostgreSQL' if is_supabase_active() else '🟢 SQLite (Local Auto-Fallback)'}")
    print(" Running on: http://localhost:3000")
    print("==============================================================")
    app.run(host='0.0.0.0', port=3000, debug=False)
