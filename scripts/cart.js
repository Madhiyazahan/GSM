/**
 * APEX AUTO GEAR - Cart & Wishlist State Management
 */

import { PRODUCTS, PROMO_CODES } from './products.js';

const CART_STORAGE_KEY = 'apex_cart_v1';
const WISHLIST_STORAGE_KEY = 'apex_wishlist_v1';
const GARAGE_STORAGE_KEY = 'apex_garage_v1';

class Store {
  constructor() {
    this.cart = this.load(CART_STORAGE_KEY, []);
    this.wishlist = this.load(WISHLIST_STORAGE_KEY, []);
    this.garage = this.load(GARAGE_STORAGE_KEY, null);
    this.appliedPromo = null;
    this.shippingMethod = 'standard'; // standard ($0 or $12), express ($15), priority ($25)
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error('Storage read error:', e);
      return fallback;
    }
  }

  save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  dispatch(event, detail = {}) {
    window.dispatchEvent(new CustomEvent(event, { detail }));
  }

  // Cart operations
  getCart() {
    return this.cart;
  }

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  addToCart(productId, quantity = 1, selectedCar = null) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return { success: false, message: "Product not found" };

    const existingIndex = this.cart.findIndex(i => i.id === productId);
    if (existingIndex > -1) {
      const newQty = this.cart[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        return { success: false, message: `Only ${product.stock} units available in stock.` };
      }
      this.cart[existingIndex].quantity = newQty;
    } else {
      if (quantity > product.stock) {
        return { success: false, message: `Only ${product.stock} units available in stock.` };
      }
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: quantity,
        vehicleTag: selectedCar || (this.garage ? `${this.garage.year} ${this.garage.make} ${this.garage.model}` : null)
      });
    }

    this.save(CART_STORAGE_KEY, this.cart);
    this.dispatch('cart:updated', { cart: this.cart, count: this.getCartCount() });
    return { success: true, item: product };
  }

  updateQuantity(productId, quantity) {
    const product = PRODUCTS.find(p => p.id === productId);
    const itemIndex = this.cart.findIndex(i => i.id === productId);
    if (itemIndex === -1) return;

    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (product && quantity > product.stock) {
      this.cart[itemIndex].quantity = product.stock;
      this.save(CART_STORAGE_KEY, this.cart);
      this.dispatch('cart:updated', { cart: this.cart, count: this.getCartCount() });
      return { limited: true, max: product.stock };
    }

    this.cart[itemIndex].quantity = quantity;
    this.save(CART_STORAGE_KEY, this.cart);
    this.dispatch('cart:updated', { cart: this.cart, count: this.getCartCount() });
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.id !== productId);
    this.save(CART_STORAGE_KEY, this.cart);
    this.dispatch('cart:updated', { cart: this.cart, count: this.getCartCount() });
  }

  clearCart() {
    this.cart = [];
    this.appliedPromo = null;
    this.save(CART_STORAGE_KEY, this.cart);
    this.dispatch('cart:updated', { cart: this.cart, count: 0 });
  }

  // Shipping
  setShippingMethod(method) {
    this.shippingMethod = method;
    this.dispatch('cart:updated', { cart: this.cart, totals: this.getTotals() });
  }

  // Promo operations
  applyPromo(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    const promo = PROMO_CODES[cleanCode];
    if (!promo) {
      return { success: false, message: 'Invalid promo code. Try "TURBO10" or "SPEED25".' };
    }

    const subtotal = this.getSubtotal();
    if (promo.minSpend && subtotal < promo.minSpend) {
      return { success: false, message: `Requires a minimum purchase of $${promo.minSpend.toFixed(2)}` };
    }

    this.appliedPromo = { code: cleanCode, ...promo };
    this.dispatch('cart:updated', { cart: this.cart, totals: this.getTotals() });
    return { success: true, message: `Coupon "${cleanCode}" applied! ${promo.description}` };
  }

  removePromo() {
    this.appliedPromo = null;
    this.dispatch('cart:updated', { cart: this.cart, totals: this.getTotals() });
  }

  getSubtotal() {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getTotals() {
    const subtotal = this.getSubtotal();
    let discount = 0;

    if (this.appliedPromo) {
      if (this.appliedPromo.type === 'percent') {
        discount = (subtotal * this.appliedPromo.value) / 100;
      } else if (this.appliedPromo.type === 'flat') {
        discount = Math.min(this.appliedPromo.value, subtotal);
      }
    }

    // Shipping calculations
    // Free standard shipping if subtotal >= 150 or if promo code is FREESHIP
    let shippingCost = 0;
    const isFreeShippingSpend = subtotal >= 150;
    const isPromoFreeShipping = this.appliedPromo && this.appliedPromo.type === 'shipping';

    if (this.shippingMethod === 'standard') {
      shippingCost = (isFreeShippingSpend || isPromoFreeShipping || subtotal === 0) ? 0 : 12.00;
    } else if (this.shippingMethod === 'express') {
      shippingCost = isPromoFreeShipping ? 0 : 19.99;
    } else if (this.shippingMethod === 'priority') {
      shippingCost = 29.99;
    }

    // Estimated tax (7.5%)
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxableAmount * 0.075;
    const total = taxableAmount + shippingCost + tax;

    // Free shipping threshold remainder
    const freeShippingRemaining = Math.max(0, 150 - subtotal);

    return {
      subtotal,
      discount,
      shippingCost,
      tax,
      total,
      freeShippingRemaining,
      freeShippingThreshold: 150,
      hasFreeShipping: isFreeShippingSpend || isPromoFreeShipping,
      appliedPromo: this.appliedPromo,
      shippingMethod: this.shippingMethod
    };
  }

  // Wishlist operations
  getWishlist() {
    return this.wishlist;
  }

  isInWishlist(productId) {
    return this.wishlist.includes(productId);
  }

  toggleWishlist(productId) {
    const index = this.wishlist.indexOf(productId);
    let added = false;
    if (index > -1) {
      this.wishlist.splice(index, 1);
    } else {
      this.wishlist.push(productId);
      added = true;
    }
    this.save(WISHLIST_STORAGE_KEY, this.wishlist);
    this.dispatch('wishlist:updated', { wishlist: this.wishlist, added, productId });
    return added;
  }

  // Garage operations
  getGarage() {
    return this.garage;
  }

  setGarage(make, model, year) {
    if (!make) {
      this.garage = null;
    } else {
      this.garage = { make, model, year };
    }
    this.save(GARAGE_STORAGE_KEY, this.garage);
    this.dispatch('garage:updated', { garage: this.garage });
  }
}

export const store = new Store();
