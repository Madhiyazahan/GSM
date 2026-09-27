/**
 * APEX AUTO GEAR - Main Application Controller (Full Backend + SQLite Connected)
 * Handles catalog browsing, fitment filtering, search, reviews submission,
 * cart drawer, database order creation, and live order tracking.
 */

import { 
  PRODUCTS, 
  CAR_MODELS, 
  PROMO_CODES,
  checkBackendHealth,
  fetchProductsAPI,
  fetchProductDetailAPI,
  fetchVehiclesAPI,
  submitOrderAPI,
  fetchOrderAPI,
  submitReviewAPI
} from './products.js';
import { store } from './cart.js';

// DOM Elements Cache
const DOM = {
  dbStatusBadge: document.getElementById('db-status-badge'),
  dbStatusDot: document.getElementById('db-status-dot'),
  dbStatusText: document.getElementById('db-status-text'),

  // Supabase Modal
  supabaseModal: document.getElementById('supabase-modal'),
  supabaseModalBackdrop: document.getElementById('supabase-modal-backdrop'),
  closeSupabaseBtn: document.getElementById('close-supabase-btn'),
  supabaseModalEngine: document.getElementById('supabase-modal-engine'),
  supabaseUrlInput: document.getElementById('supabase-url-input'),
  supabaseKeyInput: document.getElementById('supabase-key-input'),
  saveSupabaseBtn: document.getElementById('save-supabase-btn'),
  syncSupabaseBtn: document.getElementById('sync-supabase-btn'),

  productsGrid: document.getElementById('products-grid'),
  categoryTabs: document.querySelectorAll('.cat-tab'),
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  sortSelect: document.getElementById('sort-select'),
  inStockFilter: document.getElementById('instock-filter'),
  garageOnlyFilter: document.getElementById('garage-only-filter'),

  // Garage bar
  garageMakeSelect: document.getElementById('garage-make-select'),
  garageModelSelect: document.getElementById('garage-model-select'),
  garageYearSelect: document.getElementById('garage-year-select'),
  garageSaveBtn: document.getElementById('garage-save-btn'),
  garageActiveBadge: document.getElementById('garage-active-badge'),
  garageVehicleName: document.getElementById('garage-vehicle-name'),
  garageResetBtn: document.getElementById('garage-reset-btn'),
  headerGarageBtn: document.getElementById('header-garage-btn'),
  headerGarageText: document.getElementById('header-garage-text'),

  // Header badges & buttons
  cartBadge: document.getElementById('cart-badge'),
  cartBtn: document.getElementById('header-cart-btn'),
  wishlistBadge: document.getElementById('wishlist-badge'),
  wishlistBtn: document.getElementById('header-wishlist-btn'),
  headerTrackBtn: document.getElementById('header-track-btn'),

  // Cart Drawer
  cartDrawer: document.getElementById('cart-drawer'),
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  closeDrawerBtn: document.getElementById('close-drawer-btn'),
  drawerItemsContainer: document.getElementById('drawer-items'),
  shippingProgressBar: document.getElementById('shipping-bar-fill'),
  shippingProgressMsg: document.getElementById('shipping-progress-msg'),
  promoInput: document.getElementById('promo-input'),
  applyPromoBtn: document.getElementById('apply-promo-btn'),
  appliedPromoContainer: document.getElementById('applied-promo-container'),
  cartSubtotal: document.getElementById('cart-subtotal'),
  cartDiscountRow: document.getElementById('cart-discount-row'),
  cartDiscount: document.getElementById('cart-discount'),
  cartShipping: document.getElementById('cart-shipping'),
  cartTax: document.getElementById('cart-tax'),
  cartTotal: document.getElementById('cart-total'),
  proceedCheckoutBtn: document.getElementById('proceed-checkout-btn'),

  // Quick View Modal
  quickviewModal: document.getElementById('quickview-modal'),
  quickviewBackdrop: document.getElementById('quickview-backdrop'),
  closeQuickviewBtn: document.getElementById('close-quickview-btn'),
  quickviewBody: document.getElementById('quickview-body'),

  // Checkout Modal
  checkoutModal: document.getElementById('checkout-modal'),
  checkoutBackdrop: document.getElementById('checkout-backdrop'),
  closeCheckoutBtn: document.getElementById('close-checkout-btn'),
  checkoutSteps: document.querySelectorAll('.step-indicator'),
  checkoutStepPanels: document.querySelectorAll('.checkout-step-panel'),
  checkoutNextStepBtn: document.getElementById('checkout-next-btn'),
  checkoutPrevStepBtn: document.getElementById('checkout-prev-btn'),
  placeOrderBtn: document.getElementById('place-order-btn'),

  // Credit Card live preview
  cardNumInput: document.getElementById('card-num-input'),
  cardNameInput: document.getElementById('card-name-input'),
  cardExpiryInput: document.getElementById('card-expiry-input'),
  cardCvvInput: document.getElementById('card-cvv-input'),
  cardPreviewNum: document.getElementById('card-preview-num'),
  cardPreviewName: document.getElementById('card-preview-name'),
  cardPreviewExpiry: document.getElementById('card-preview-expiry'),

  // Order Receipt confirmation
  orderNumberPill: document.getElementById('order-number-pill'),
  receiptSummaryList: document.getElementById('receipt-summary-list'),
  receiptGrandTotal: document.getElementById('receipt-grand-total'),
  printReceiptBtn: document.getElementById('print-receipt-btn'),
  continueShoppingBtn: document.getElementById('continue-shopping-btn'),

  // Track Order Modal
  trackOrderModal: document.getElementById('track-order-modal'),
  trackOrderBackdrop: document.getElementById('track-order-backdrop'),
  closeTrackBtn: document.getElementById('close-track-btn'),
  trackOrderInput: document.getElementById('track-order-input'),
  lookupOrderBtn: document.getElementById('lookup-order-btn'),
  trackOrderResult: document.getElementById('track-order-result'),

  // Toast Container
  toastContainer: document.getElementById('toast-container')
};

// Global State
let currentProducts = [...PRODUCTS];
let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'featured';
let showOnlyInStock = false;
let showOnlyGarageFit = false;
let currentCheckoutStep = 1;
let activeModalProductId = null;

/**
 * Toast Notification System
 */
export function showToast(message, type = 'success') {
  if (!DOM.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `${iconSvg} <span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Filter & Sort Catalog
 */
function getFilteredProducts() {
  const garage = store.getGarage();

  return currentProducts.filter(prod => {
    // Category match
    if (currentCategory !== 'all' && prod.category !== currentCategory) {
      return false;
    }

    // Search query match
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchDesc = (prod.shortDesc || '').toLowerCase().includes(q);
      const matchCat = (prod.category || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    // In Stock filter
    if (showOnlyInStock && prod.stock <= 0) {
      return false;
    }

    // Garage vehicle compatibility filter
    if (showOnlyGarageFit && garage) {
      const isCompat = prod.universalFit || (prod.compatibleMakes || []).includes(garage.make);
      if (!isCompat) return false;
    }

    return true;
  }).sort((a, b) => {
    if (currentSort === 'price-low') return a.price - b.price;
    if (currentSort === 'price-high') return b.price - a.price;
    if (currentSort === 'rating') return b.rating - a.rating;
    if (currentSort === 'stock') return b.stock - a.stock;
    // 'featured'
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });
}

/**
 * Render Product Grid
 */
function renderProducts() {
  if (!DOM.productsGrid) return;
  const filtered = getFilteredProducts();
  const garage = store.getGarage();

  if (filtered.length === 0) {
    DOM.productsGrid.innerHTML = `
      <div class="no-results-box">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-dim); margin-bottom: 12px;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No Accessories Match Your Search</h3>
        <p>Try resetting your vehicle filter or adjusting your keywords.</p>
        <button id="reset-filter-btn" class="btn-primary" style="margin: 0 auto;">Reset All Filters</button>
      </div>
    `;

    document.getElementById('reset-filter-btn')?.addEventListener('click', () => {
      currentCategory = 'all';
      currentSearch = '';
      showOnlyInStock = false;
      showOnlyGarageFit = false;
      if (DOM.searchInput) DOM.searchInput.value = '';
      if (DOM.inStockFilter) DOM.inStockFilter.checked = false;
      if (DOM.garageOnlyFilter) DOM.garageOnlyFilter.checked = false;
      DOM.categoryTabs.forEach(t => t.classList.toggle('active', t.dataset.cat === 'all'));
      renderProducts();
    });
    return;
  }

  DOM.productsGrid.innerHTML = filtered.map(prod => {
    const isWishlisted = store.isInWishlist(prod.id);
    
    // Fitment check for active vehicle
    let fitmentBadgeHtml = '';
    let fitmentChipHtml = '';

    if (garage) {
      const isCompat = prod.universalFit || (prod.compatibleMakes || []).includes(garage.make);
      if (isCompat) {
        fitmentBadgeHtml = `<span class="badge-tag badge-fitment">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Fits ${garage.make}
        </span>`;
        fitmentChipHtml = `<div class="card-compatibility-chip matched">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Guaranteed Fit: ${garage.year} ${garage.make} ${garage.model}
        </div>`;
      } else {
        fitmentChipHtml = `<div class="card-compatibility-chip" style="color: var(--accent-red);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          Does not fit ${garage.make}
        </div>`;
      }
    } else {
      fitmentChipHtml = `<div class="card-compatibility-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        ${prod.universalFit ? 'Universal Fitment' : 'Specific Vehicle Fit'}
      </div>`;
    }

    return `
      <article class="product-card" data-id="${prod.id}">
        <div class="card-media" onclick="window.apexApp.openQuickView('${prod.id}')">
          <img src="${prod.image}" alt="${prod.name}" class="card-img" loading="lazy">
          
          <div class="card-badges">
            ${prod.badge ? `<span class="badge-tag ${prod.badge.includes('Sale') ? 'badge-sale' : 'badge-primary'}">${prod.badge}</span>` : ''}
            ${fitmentBadgeHtml}
          </div>

          <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                  onclick="event.stopPropagation(); window.apexApp.toggleWishlist('${prod.id}')"
                  title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          <button class="card-quickview-btn">Quick Specs & View</button>
        </div>

        <div class="card-body">
          <span class="card-cat">${prod.category}</span>
          <h3 class="card-title" onclick="window.apexApp.openQuickView('${prod.id}')">${prod.name}</h3>

          <div class="card-ratings">
            <div class="stars-row">
              ${'★'.repeat(Math.floor(prod.rating))}${'☆'.repeat(5 - Math.floor(prod.rating))}
            </div>
            <span class="rating-count">(${prod.reviewsCount})</span>
          </div>

          ${fitmentChipHtml}

          <div class="card-footer">
            <div class="price-wrap">
              <span class="current-price">$${prod.price.toFixed(2)}</span>
              ${prod.originalPrice ? `<span class="original-price">$${prod.originalPrice.toFixed(2)}</span>` : ''}
            </div>

            <button class="add-cart-btn" onclick="window.apexApp.addToCart('${prod.id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>Add</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Garage Selector Logic
 */
async function initGarage() {
  if (!DOM.garageMakeSelect) return;

  // Fetch live vehicle models from DB
  const vehicles = await fetchVehiclesAPI();
  const makes = Object.keys(vehicles);

  DOM.garageMakeSelect.innerHTML = `<option value="">Select Make</option>` + 
    makes.map(m => `<option value="${m}">${m}</option>`).join('');

  // Make change listener
  DOM.garageMakeSelect.addEventListener('change', (e) => {
    const make = e.target.value;
    if (!make || !vehicles[make]) {
      DOM.garageModelSelect.innerHTML = `<option value="">Select Model</option>`;
      DOM.garageModelSelect.disabled = true;
      return;
    }

    DOM.garageModelSelect.disabled = false;
    DOM.garageModelSelect.innerHTML = `<option value="">Select Model</option>` +
      vehicles[make].map(model => `<option value="${model}">${model}</option>`).join('');
  });

  // Save Garage
  DOM.garageSaveBtn?.addEventListener('click', () => {
    const make = DOM.garageMakeSelect.value;
    const model = DOM.garageModelSelect.value;
    const year = DOM.garageYearSelect.value;

    if (!make || !model || !year) {
      showToast('Please select Year, Make, and Model.', 'error');
      return;
    }

    store.setGarage(make, model, year);
    showToast(`Garage vehicle updated: ${year} ${make} ${model}`, 'success');
  });

  // Reset Garage
  DOM.garageResetBtn?.addEventListener('click', () => {
    store.setGarage(null);
    DOM.garageMakeSelect.value = '';
    DOM.garageModelSelect.innerHTML = `<option value="">Select Model</option>`;
    DOM.garageModelSelect.disabled = true;
    showToast('Vehicle cleared from garage.', 'info');
  });

  // Header garage quick click
  DOM.headerGarageBtn?.addEventListener('click', () => {
    document.querySelector('.garage-bar-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Listen to garage updates
  window.addEventListener('garage:updated', (e) => {
    updateGarageUI(e.detail.garage);
    renderProducts();
  });

  // Initial load
  updateGarageUI(store.getGarage());
}

function updateGarageUI(garage) {
  if (garage) {
    DOM.garageActiveBadge?.classList.add('active');
    if (DOM.garageVehicleName) {
      DOM.garageVehicleName.textContent = `${garage.year} ${garage.make} ${garage.model}`;
    }
    DOM.headerGarageBtn?.classList.add('has-vehicle');
    if (DOM.headerGarageText) {
      DOM.headerGarageText.textContent = `${garage.make} ${garage.model}`;
    }
  } else {
    DOM.garageActiveBadge?.classList.remove('active');
    DOM.headerGarageBtn?.classList.remove('has-vehicle');
    if (DOM.headerGarageText) {
      DOM.headerGarageText.textContent = 'Select Ride';
    }
  }
}

/**
 * Quick View Modal Logic with Live Database Reviews
 */
async function openQuickView(productId) {
  activeModalProductId = productId;
  let prod = await fetchProductDetailAPI(productId);
  if (!prod) {
    prod = currentProducts.find(p => p.id === productId);
  }
  if (!prod) return;

  const garage = store.getGarage();
  const isCompat = garage ? (prod.universalFit || (prod.compatibleMakes || []).includes(garage.make)) : true;

  const specsEntries = Object.entries(prod.specs || {}).map(([key, val]) => `
    <div class="spec-entry">
      <strong>${key}</strong>
      <span>${val}</span>
    </div>
  `).join('');

  const featuresList = (prod.features || []).map(f => `
    <li style="margin-bottom: 6px; display: flex; align-items: baseline; gap: 8px;">
      <span style="color: var(--accent-cyan); font-weight: bold;">✔</span>
      <span>${f}</span>
    </li>
  `).join('');

  const reviewsHtml = (prod.reviews || []).map(r => `
    <div style="background: var(--bg-surface); padding: 12px 14px; border-radius: 6px; border: 1px solid var(--border-subtle); margin-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-weight: 700; color: #fff; font-size: 0.85rem;">${r.author}</span>
        <span style="font-size: 0.75rem; color: var(--accent-amber);">${'★'.repeat(r.rating)}</span>
      </div>
      <div style="font-size: 0.72rem; color: var(--accent-emerald); margin-bottom: 6px;">
        Verified Buyer • ${r.vehicle || 'Vehicle Owner'}
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">"${r.comment}"</p>
    </div>
  `).join('') || `<p style="font-size: 0.82rem; color: var(--text-muted);">No reviews yet. Be the first to review this upgrade!</p>`;

  DOM.quickviewBody.innerHTML = `
    <div class="quickview-grid">
      <div class="quickview-gallery">
        <div class="quickview-main-img-box">
          <img id="qv-active-img" src="${prod.image}" alt="${prod.name}" class="quickview-main-img">
        </div>
        ${prod.gallery && prod.gallery.length > 1 ? `
          <div class="quickview-thumbs">
            ${prod.gallery.map((img, i) => `
              <div class="quickview-thumb ${i === 0 ? 'active' : ''}" onclick="window.apexApp.switchQvThumb('${img}', this)">
                <img src="${img}" alt="Thumbnail">
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Customer Reviews List -->
        <div style="margin-top: 24px;">
          <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: #fff; margin-bottom: 10px;">Customer Reviews & Ratings</h4>
          <div id="qv-reviews-container">${reviewsHtml}</div>
          
          <!-- Submit Review Form -->
          <div style="margin-top: 18px; padding: 14px; background: var(--bg-surface); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <h5 style="font-size: 0.82rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Write a Review (Saves to Database)</h5>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <input type="text" id="review-author-input" class="form-input" style="flex: 1; padding: 6px 10px; font-size: 0.8rem;" placeholder="Your Name" value="Car Enthusiast">
              <select id="review-rating-select" class="form-select" style="padding: 6px 10px; font-size: 0.8rem;">
                <option value="5">★★★★★ 5 Stars</option>
                <option value="4">★★★★☆ 4 Stars</option>
                <option value="3">★★★☆☆ 3 Stars</option>
              </select>
            </div>
            <textarea id="review-comment-input" class="form-input" style="width: 100%; height: 60px; padding: 8px; font-size: 0.8rem; margin-bottom: 8px; resize: none;" placeholder="Share your installation and build experience..."></textarea>
            <button class="btn-primary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="window.apexApp.submitReview('${prod.id}')">Submit to Database</button>
          </div>
        </div>
      </div>

      <div class="quickview-details">
        <span class="quickview-cat">${prod.category}</span>
        <h2 class="quickview-title">${prod.name}</h2>

        <div class="quickview-ratings">
          <span style="color: var(--accent-amber); font-weight: 700;">★ ${prod.rating}</span>
          <span style="color: var(--text-muted);">(${prod.reviewsCount} verified reviews)</span>
          <span style="color: var(--accent-emerald); font-weight: 600; margin-left: auto;">In Stock (${prod.stock} units)</span>
        </div>

        <div class="quickview-price-box">
          <span class="quickview-price">$${prod.price.toFixed(2)}</span>
          ${prod.originalPrice ? `<span class="quickview-original">$${prod.originalPrice.toFixed(2)}</span>` : ''}
          ${prod.badge ? `<span class="badge-tag badge-primary" style="margin-left: auto;">${prod.badge}</span>` : ''}
        </div>

        <p class="quickview-desc">${prod.description}</p>

        <div class="modal-fitment-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <div>
            ${garage ? (isCompat ? `Verified 100% Fit for your ${garage.year} ${garage.make} ${garage.model}` : `Warning: May not fit your ${garage.make} ${garage.model}`) : (prod.universalFit ? 'Universal Fitment for 12V Passenger Vehicles' : `Compatible with: ${(prod.compatibleMakes || []).join(', ')}`)}
          </div>
        </div>

        <div class="specs-table-wrap">
          <h4 class="specs-title">Technical Specifications</h4>
          <div class="specs-list">
            ${specsEntries}
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 class="specs-title">Engineered Highlights</h4>
          <ul style="list-style: none; font-size: 0.82rem; color: var(--text-muted);">
            ${featuresList}
          </ul>
        </div>

        <div class="modal-actions">
          <div class="qty-stepper" style="height: 48px; border-radius: var(--radius-sm);">
            <button class="qty-btn" style="width: 38px; height: 100%; font-size: 1.1rem;" onclick="window.apexApp.stepQvQty(-1)">-</button>
            <span id="qv-qty-display" class="qty-value" style="width: 44px; font-size: 1rem;">1</span>
            <button class="qty-btn" style="width: 38px; height: 100%; font-size: 1.1rem;" onclick="window.apexApp.stepQvQty(1)">+</button>
          </div>

          <button class="modal-add-cart-btn" onclick="window.apexApp.addQvToCart('${prod.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            Add To Cart
          </button>

          <button class="modal-buy-now-btn" onclick="window.apexApp.buyNow('${prod.id}')">
            ⚡ Buy Now
          </button>
        </div>
      </div>
    </div>
  `;

  DOM.quickviewModal.classList.add('active');
  DOM.quickviewBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  DOM.quickviewModal?.classList.remove('active');
  DOM.quickviewBackdrop?.classList.remove('active');
  document.body.style.overflow = '';
}

function switchQvThumb(imgSrc, thumbEl) {
  const main = document.getElementById('qv-active-img');
  if (main) main.src = imgSrc;
  document.querySelectorAll('.quickview-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}

let qvQuantity = 1;
function stepQvQty(delta) {
  qvQuantity = Math.max(1, qvQuantity + delta);
  const display = document.getElementById('qv-qty-display');
  if (display) display.textContent = qvQuantity;
}

function addQvToCart(productId) {
  const result = store.addToCart(productId, qvQuantity);
  if (result.success) {
    showToast(`Added ${qvQuantity}x "${result.item.name}" to cart!`, 'success');
    closeQuickView();
    openCartDrawer();
  } else {
    showToast(result.message, 'error');
  }
  qvQuantity = 1;
}

function buyNow(productId) {
  const result = store.addToCart(productId, qvQuantity);
  if (result.success) {
    closeQuickView();
    openCheckoutModal();
  } else {
    showToast(result.message, 'error');
  }
  qvQuantity = 1;
}

async function submitReview(productId) {
  const author = document.getElementById('review-author-input')?.value.trim();
  const rating = document.getElementById('review-rating-select')?.value;
  const comment = document.getElementById('review-comment-input')?.value.trim();
  const garage = store.getGarage();
  const vehicle = garage ? `${garage.year} ${garage.make} ${garage.model}` : 'Verified Driver';

  if (!comment) {
    showToast('Please enter your review comments.', 'error');
    return;
  }

  const res = await submitReviewAPI({
    productId,
    author: author || 'Enthusiast',
    rating: parseInt(rating),
    vehicle,
    comment
  });

  if (res.success) {
    showToast('Review saved to SQLite database!', 'success');
    // Refresh modal
    openQuickView(productId);
    // Refresh catalog products in background
    refreshProductsFromBackend();
  } else {
    showToast(res.error || 'Failed to submit review', 'error');
  }
}

/**
 * Slide-Over Cart Drawer Logic
 */
function openCartDrawer() {
  DOM.cartDrawer?.classList.add('active');
  DOM.drawerBackdrop?.classList.add('active');
  document.body.style.overflow = 'hidden';
  renderCartDrawer();
}

function closeCartDrawer() {
  DOM.cartDrawer?.classList.remove('active');
  DOM.drawerBackdrop?.classList.remove('active');
  document.body.style.overflow = '';
}

function renderCartDrawer() {
  if (!DOM.drawerItemsContainer) return;
  const cart = store.getCart();
  const totals = store.getTotals();

  // Update Free Shipping Bar
  if (totals.hasFreeShipping) {
    DOM.shippingProgressBar.style.width = '100%';
    DOM.shippingProgressMsg.innerHTML = `<span style="color: var(--accent-emerald); font-weight: 700;">🎉 You've unlocked FREE Priority Shipping!</span>`;
  } else {
    const pct = Math.min(100, (totals.subtotal / totals.freeShippingThreshold) * 100);
    DOM.shippingProgressBar.style.width = `${pct}%`;
    DOM.shippingProgressMsg.innerHTML = `Add <strong>$${totals.freeShippingRemaining.toFixed(2)}</strong> more for <strong>Free Shipping</strong>`;
  }

  // Render items
  if (cart.length === 0) {
    DOM.drawerItemsContainer.innerHTML = `
      <div class="cart-empty-box">
        <div class="cart-empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h4>Your Shopping Cart is Empty</h4>
        <p>Explore our track-tested accessories and upgrade your vehicle today.</p>
        <button class="btn-primary" onclick="window.apexApp.closeCartDrawer()">Start Shopping</button>
      </div>
    `;
    DOM.proceedCheckoutBtn.disabled = true;
    DOM.proceedCheckoutBtn.style.opacity = '0.5';
  } else {
    DOM.proceedCheckoutBtn.disabled = false;
    DOM.proceedCheckoutBtn.style.opacity = '1';

    DOM.drawerItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item-row" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.name}</h4>
          ${item.vehicleTag ? `<span class="cart-item-vehicle">For ${item.vehicleTag}</span>` : ''}
          <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>

          <div class="cart-item-controls">
            <div class="qty-stepper">
              <button class="qty-btn" onclick="window.apexApp.updateCartQty('${item.id}', ${item.quantity - 1})">-</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" onclick="window.apexApp.updateCartQty('${item.id}', ${item.quantity + 1})">+</button>
            </div>
          </div>
        </div>

        <button class="remove-item-btn" onclick="window.apexApp.removeFromCart('${item.id}')" title="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `).join('');
  }

  // Update promo coupon box
  if (totals.appliedPromo) {
    DOM.appliedPromoContainer.innerHTML = `
      <div class="applied-promo-tag">
        <span>Code <strong>${totals.appliedPromo.code}</strong> applied (-$${totals.discount.toFixed(2)})</span>
        <span class="remove-promo-btn" onclick="window.apexApp.removePromo()">Remove</span>
      </div>
    `;
  } else {
    DOM.appliedPromoContainer.innerHTML = '';
  }

  // Update numbers
  DOM.cartSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;
  if (totals.discount > 0) {
    DOM.cartDiscountRow.style.display = 'flex';
    DOM.cartDiscount.textContent = `-$${totals.discount.toFixed(2)}`;
  } else {
    DOM.cartDiscountRow.style.display = 'none';
  }
  DOM.cartShipping.textContent = totals.shippingCost === 0 ? 'FREE' : `$${totals.shippingCost.toFixed(2)}`;
  DOM.cartTax.textContent = `$${totals.tax.toFixed(2)}`;
  DOM.cartTotal.textContent = `$${totals.total.toFixed(2)}`;
}

/**
 * Checkout Multi-Step Modal Logic
 */
function openCheckoutModal() {
  const cart = store.getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty. Please select a product first.', 'error');
    return;
  }

  closeCartDrawer();
  currentCheckoutStep = 1;
  setCheckoutStep(1);

  DOM.checkoutModal?.classList.add('active');
  DOM.checkoutBackdrop?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  DOM.checkoutModal?.classList.remove('active');
  DOM.checkoutBackdrop?.classList.remove('active');
  document.body.style.overflow = '';
}

function setCheckoutStep(step) {
  currentCheckoutStep = step;

  // Update step indicators
  DOM.checkoutSteps.forEach((ind, index) => {
    const stepNum = index + 1;
    ind.classList.remove('active', 'completed');
    if (stepNum === step) {
      ind.classList.add('active');
    } else if (stepNum < step) {
      ind.classList.add('completed');
    }
  });

  // Switch step panels
  DOM.checkoutStepPanels.forEach(panel => {
    if (parseInt(panel.dataset.step) === step) {
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
  });

  // Buttons logic
  if (step === 1) {
    DOM.checkoutPrevStepBtn.style.display = 'none';
    DOM.checkoutNextStepBtn.style.display = 'flex';
    DOM.placeOrderBtn.style.display = 'none';
  } else if (step === 2) {
    DOM.checkoutPrevStepBtn.style.display = 'flex';
    DOM.checkoutNextStepBtn.style.display = 'flex';
    DOM.placeOrderBtn.style.display = 'none';
  } else if (step === 3) {
    DOM.checkoutPrevStepBtn.style.display = 'flex';
    DOM.checkoutNextStepBtn.style.display = 'none';
    DOM.placeOrderBtn.style.display = 'flex';
    populateOrderReviewStep();
  } else if (step === 4) {
    DOM.checkoutPrevStepBtn.style.display = 'none';
    DOM.checkoutNextStepBtn.style.display = 'none';
    DOM.placeOrderBtn.style.display = 'none';
  }
}

function validateShippingForm() {
  const name = document.getElementById('ship-name')?.value.trim();
  const email = document.getElementById('ship-email')?.value.trim();
  const address = document.getElementById('ship-address')?.value.trim();
  const city = document.getElementById('ship-city')?.value.trim();
  const zip = document.getElementById('ship-zip')?.value.trim();

  if (!name || !email || !address || !city || !zip) {
    showToast('Please fill out all required shipping fields.', 'error');
    return false;
  }
  return true;
}

function populateOrderReviewStep() {
  const totals = store.getTotals();
  const cart = store.getCart();

  const reviewItemsContainer = document.getElementById('review-items-list');
  if (reviewItemsContainer) {
    reviewItemsContainer.innerHTML = cart.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.85rem;">
        <div>
          <strong style="color: #fff;">${item.quantity}x ${item.name}</strong>
          ${item.vehicleTag ? `<div style="font-size: 0.72rem; color: var(--accent-emerald);">Fits: ${item.vehicleTag}</div>` : ''}
        </div>
        <span style="font-weight: 700; color: #fff;">$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');
  }

  document.getElementById('review-subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
  document.getElementById('review-shipping').textContent = totals.shippingCost === 0 ? 'FREE' : `$${totals.shippingCost.toFixed(2)}`;
  document.getElementById('review-tax').textContent = `$${totals.tax.toFixed(2)}`;
  document.getElementById('review-total').textContent = `$${totals.total.toFixed(2)}`;
}

/**
 * Place Order & Save to SQLite Database
 */
async function placeOrder() {
  const totals = store.getTotals();
  const cart = [...store.getCart()];

  const shippingInfo = {
    name: document.getElementById('ship-name')?.value.trim() || 'Alex Sterling',
    email: document.getElementById('ship-email')?.value.trim() || 'alex@apexgear.com',
    phone: document.getElementById('ship-phone')?.value.trim() || '',
    address: document.getElementById('ship-address')?.value.trim() || '742 Evergreen Terrace',
    city: document.getElementById('ship-city')?.value.trim() || 'Los Angeles',
    zip: document.getElementById('ship-zip')?.value.trim() || '90210'
  };

  const paymentInfo = {
    method: 'Credit Card (•••• 4242)'
  };

  // Submit to Backend REST API
  DOM.placeOrderBtn.disabled = true;
  DOM.placeOrderBtn.textContent = 'Processing Payment & Saving to DB...';

  const response = await submitOrderAPI({
    items: cart,
    shipping: shippingInfo,
    totals: totals,
    payment: paymentInfo
  });

  DOM.placeOrderBtn.disabled = false;
  DOM.placeOrderBtn.textContent = '🔒 Authorize & Place Order';

  if (!response.success) {
    showToast(response.error || 'Failed to place order. Check inventory.', 'error');
    return;
  }

  const orderId = response.orderId;

  // Populate Confirmation Panel
  DOM.orderNumberPill.textContent = `Order Confirmation #${orderId}`;
  
  if (DOM.receiptSummaryList) {
    DOM.receiptSummaryList.innerHTML = cart.map(i => `
      <div class="receipt-item-line">
        <span>${i.quantity}x ${i.name}</span>
        <strong>$${(i.price * i.quantity).toFixed(2)}</strong>
      </div>
    `).join('');
  }

  DOM.receiptGrandTotal.textContent = `$${totals.total.toFixed(2)}`;

  // Clear Cart
  store.clearCart();

  // Move to Step 4
  setCheckoutStep(4);
  showToast(`Success! Order #${orderId} saved to database.`, 'success');

  // Refresh live products in background to reflect decremented stock
  refreshProductsFromBackend();

  // Trigger timeline simulation
  setTimeout(() => {
    const bar = document.querySelector('.timeline-progress-bar');
    if (bar) bar.style.width = '65%';
    const step2 = document.getElementById('timeline-step-2');
    if (step2) step2.classList.add('active');
  }, 1000);
}

/**
 * Track Order Modal Logic
 */
function openTrackOrderModal() {
  DOM.trackOrderModal?.classList.add('active');
  DOM.trackOrderBackdrop?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTrackOrderModal() {
  DOM.trackOrderModal?.classList.remove('active');
  DOM.trackOrderBackdrop?.classList.remove('active');
  document.body.style.overflow = '';
}

async function lookupOrder() {
  const orderId = DOM.trackOrderInput?.value.trim().toUpperCase();
  if (!orderId) {
    showToast('Please enter an order ID (e.g. APX-849204)', 'error');
    return;
  }

  DOM.lookupOrderBtn.disabled = true;
  DOM.lookupOrderBtn.textContent = 'Searching...';

  const res = await fetchOrderAPI(orderId);
  DOM.lookupOrderBtn.disabled = false;
  DOM.lookupOrderBtn.textContent = 'Lookup';

  if (!res.success || !res.order) {
    DOM.trackOrderResult.style.display = 'block';
    DOM.trackOrderResult.innerHTML = `
      <div style="padding: 16px; background: rgba(255, 42, 95, 0.1); border: 1px solid var(--accent-red); border-radius: var(--radius-sm); color: #fff;">
        <strong>Order "${orderId}" Not Found</strong>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Please check the spelling or place a test order first.</p>
      </div>
    `;
    return;
  }

  const o = res.order;
  DOM.trackOrderResult.style.display = 'block';
  DOM.trackOrderResult.innerHTML = `
    <div style="background: var(--bg-surface); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-medium);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
        <span style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--accent-cyan);">#${o.id}</span>
        <span style="background: rgba(0, 230, 118, 0.15); color: var(--accent-emerald); padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 0.78rem;">${o.status}</span>
      </div>

      <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px;">
        <div><strong>Customer:</strong> ${o.customer_name} (${o.customer_email})</div>
        <div><strong>Deliver To:</strong> ${o.shipping_address}, ${o.shipping_city} ${o.shipping_zip}</div>
        <div><strong>Placed On:</strong> ${o.created_at}</div>
        <div><strong>Payment:</strong> ${o.payment_method}</div>
      </div>

      <div style="border-top: 1px solid var(--border-subtle); padding-top: 10px; margin-bottom: 12px;">
        <strong style="font-size: 0.82rem; color: #fff; text-transform: uppercase;">Items Ordered:</strong>
        <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 6px;">
          ${(o.items || []).map(i => `
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
              <span>${i.quantity}x ${i.product_name}</span>
              <span style="color: #fff; font-weight: 600;">$${(i.unit_price * i.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 8px; font-size: 0.95rem; font-weight: 800; color: #fff;">
        <span>Total Paid:</span>
        <span style="color: var(--accent-emerald);">$${o.total.toFixed(2)}</span>
      </div>
    </div>
  `;
}

/**
 * Fetch and refresh products from backend
 */
async function refreshProductsFromBackend() {
  const prods = await fetchProductsAPI();
  if (prods && prods.length > 0) {
    currentProducts = prods;
    renderProducts();
  }
}

/**
 * Event Listeners & Binding
 */
function initEventListeners() {
  // Category tabs
  DOM.categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.cat;
      renderProducts();
    });
  });

  // Search input
  DOM.searchInput?.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim();
    if (currentSearch.length > 0) {
      DOM.clearSearchBtn?.classList.add('active');
    } else {
      DOM.clearSearchBtn?.classList.remove('active');
    }
    renderProducts();
  });

  DOM.clearSearchBtn?.addEventListener('click', () => {
    if (DOM.searchInput) DOM.searchInput.value = '';
    currentSearch = '';
    DOM.clearSearchBtn?.classList.remove('active');
    renderProducts();
  });

  // Sorting
  DOM.sortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderProducts();
  });

  // Checkbox filters
  DOM.inStockFilter?.addEventListener('change', (e) => {
    showOnlyInStock = e.target.checked;
    renderProducts();
  });

  DOM.garageOnlyFilter?.addEventListener('change', (e) => {
    showOnlyGarageFit = e.target.checked;
    if (showOnlyGarageFit && !store.getGarage()) {
      showToast('Please select your vehicle first in the garage bar above.', 'info');
    }
    renderProducts();
  });

  // Cart Drawer open/close
  DOM.cartBtn?.addEventListener('click', openCartDrawer);
  DOM.closeDrawerBtn?.addEventListener('click', closeCartDrawer);
  DOM.drawerBackdrop?.addEventListener('click', closeCartDrawer);

  // Quick View close
  DOM.closeQuickviewBtn?.addEventListener('click', closeQuickView);
  DOM.quickviewBackdrop?.addEventListener('click', closeQuickView);

  // Track Order open/close
  DOM.headerTrackBtn?.addEventListener('click', openTrackOrderModal);
  DOM.closeTrackBtn?.addEventListener('click', closeTrackOrderModal);
  DOM.trackOrderBackdrop?.addEventListener('click', closeTrackOrderModal);
  DOM.lookupOrderBtn?.addEventListener('click', lookupOrder);

  // Promo code apply
  DOM.applyPromoBtn?.addEventListener('click', () => {
    const code = DOM.promoInput?.value;
    if (!code) return;
    const res = store.applyPromo(code);
    if (res.success) {
      showToast(res.message, 'success');
      DOM.promoInput.value = '';
    } else {
      showToast(res.message, 'error');
    }
  });

  // Proceed to Checkout
  DOM.proceedCheckoutBtn?.addEventListener('click', openCheckoutModal);
  DOM.closeCheckoutBtn?.addEventListener('click', closeCheckoutModal);
  DOM.checkoutBackdrop?.addEventListener('click', closeCheckoutModal);

  // Checkout Stepper Navigation
  DOM.checkoutNextStepBtn?.addEventListener('click', () => {
    if (currentCheckoutStep === 1) {
      if (!validateShippingForm()) return;
      setCheckoutStep(2);
    } else if (currentCheckoutStep === 2) {
      setCheckoutStep(3);
    }
  });

  DOM.checkoutPrevStepBtn?.addEventListener('click', () => {
    if (currentCheckoutStep > 1) {
      setCheckoutStep(currentCheckoutStep - 1);
    }
  });

  DOM.placeOrderBtn?.addEventListener('click', placeOrder);

  DOM.continueShoppingBtn?.addEventListener('click', () => {
    closeCheckoutModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  DOM.printReceiptBtn?.addEventListener('click', () => {
    window.print();
  });

  // Interactive Live Card Preview Updates
  DOM.cardNumInput?.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = val;
    DOM.cardPreviewNum.textContent = val || '•••• •••• •••• ••••';
  });

  DOM.cardNameInput?.addEventListener('input', (e) => {
    DOM.cardPreviewName.textContent = e.target.value.toUpperCase() || 'YOUR NAME';
  });

  DOM.cardExpiryInput?.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    e.target.value = val;
    DOM.cardPreviewExpiry.textContent = val || 'MM/YY';
  });

  // Shipping Method Selector in Step 1
  document.querySelectorAll('.shipping-option-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.shipping-option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const method = card.dataset.method;
      store.setShippingMethod(method);
    });
  });

  // Listen to Cart updates
  window.addEventListener('cart:updated', (e) => {
    const count = store.getCartCount();
    if (DOM.cartBadge) {
      DOM.cartBadge.textContent = count;
      DOM.cartBadge.style.display = count > 0 ? 'flex' : 'none';
    }
    renderCartDrawer();
  });

  // Listen to Wishlist updates
  window.addEventListener('wishlist:updated', (e) => {
    const count = store.getWishlist().length;
    if (DOM.wishlistBadge) {
      DOM.wishlistBadge.textContent = count;
      DOM.wishlistBadge.style.display = count > 0 ? 'flex' : 'none';
    }
    renderProducts();
  });

  // Initial cart badge update
  const initialCartCount = store.getCartCount();
  if (DOM.cartBadge) {
    DOM.cartBadge.textContent = initialCartCount;
    DOM.cartBadge.style.display = initialCartCount > 0 ? 'flex' : 'none';
  }

  // Initial wishlist badge update
  const initialWishCount = store.getWishlist().length;
  if (DOM.wishlistBadge) {
    DOM.wishlistBadge.textContent = initialWishCount;
    DOM.wishlistBadge.style.display = initialWishCount > 0 ? 'flex' : 'none';
  }
}

/**
 * Supabase Cloud Modal Logic
 */
async function openSupabaseModal() {
  DOM.supabaseModal?.classList.add('active');
  DOM.supabaseModalBackdrop?.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Fetch current config
  try {
    const res = await fetch('/api/supabase/config');
    const data = await res.json();
    if (data.url && DOM.supabaseUrlInput) {
      DOM.supabaseUrlInput.value = data.url;
    }
  } catch (e) {
    console.warn(e);
  }

  updateSupabaseModalStatus();
}

function closeSupabaseModal() {
  DOM.supabaseModal?.classList.remove('active');
  DOM.supabaseModalBackdrop?.classList.remove('active');
  document.body.style.overflow = '';
}

async function updateSupabaseModalStatus() {
  const health = await checkBackendHealth();
  if (health && DOM.supabaseModalEngine) {
    if (health.engine === 'supabase') {
      DOM.supabaseModalEngine.textContent = '⚡ Connected to Supabase Cloud PostgreSQL';
      DOM.supabaseModalEngine.style.color = '#3ecf8e';
    } else {
      DOM.supabaseModalEngine.textContent = '🟢 Local SQLite Active (Enter credentials below to switch to Supabase)';
      DOM.supabaseModalEngine.style.color = 'var(--accent-amber)';
    }
  }
}

async function saveSupabaseConfig() {
  const url = DOM.supabaseUrlInput?.value.trim();
  const key = DOM.supabaseKeyInput?.value.trim();

  if (!url || !key) {
    showToast('Please enter both Supabase Project URL and API Key.', 'error');
    return;
  }

  DOM.saveSupabaseBtn.disabled = true;
  DOM.saveSupabaseBtn.textContent = 'Connecting...';

  try {
    const res = await fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key })
    });
    const data = await res.json();

    DOM.saveSupabaseBtn.disabled = false;
    DOM.saveSupabaseBtn.textContent = 'Connect & Save';

    if (data.success) {
      showToast('⚡ Connected to Supabase Cloud PostgreSQL!', 'success');
      updateDbStatusUI(await checkBackendHealth());
      updateSupabaseModalStatus();
      refreshProductsFromBackend();
    } else {
      showToast(data.error || 'Connection to Supabase failed.', 'error');
    }
  } catch (e) {
    DOM.saveSupabaseBtn.disabled = false;
    DOM.saveSupabaseBtn.textContent = 'Connect & Save';
    showToast(e.message, 'error');
  }
}

async function syncSupabaseData() {
  DOM.syncSupabaseBtn.disabled = true;
  DOM.syncSupabaseBtn.textContent = 'Syncing...';

  try {
    const res = await fetch('/api/supabase/sync', { method: 'POST' });
    const data = await res.json();

    DOM.syncSupabaseBtn.disabled = false;
    DOM.syncSupabaseBtn.textContent = 'Sync Catalog to Cloud';

    if (data.success) {
      showToast(data.message, 'success');
      refreshProductsFromBackend();
    } else {
      showToast(data.error || 'Sync failed. Make sure supabase_schema.sql was run in Supabase SQL editor.', 'error');
    }
  } catch (e) {
    DOM.syncSupabaseBtn.disabled = false;
    DOM.syncSupabaseBtn.textContent = 'Sync Catalog to Cloud';
    showToast(e.message, 'error');
  }
}

function updateDbStatusUI(health) {
  if (!health || !DOM.dbStatusBadge) return;
  DOM.dbStatusBadge.style.display = 'flex';

  if (health.engine === 'supabase') {
    DOM.dbStatusBadge.style.background = 'rgba(62, 207, 142, 0.18)';
    DOM.dbStatusBadge.style.borderColor = 'rgba(62, 207, 142, 0.5)';
    DOM.dbStatusBadge.style.color = '#3ecf8e';
    if (DOM.dbStatusDot) {
      DOM.dbStatusDot.style.background = '#3ecf8e';
      DOM.dbStatusDot.style.boxShadow = '0 0 10px #3ecf8e';
    }
    if (DOM.dbStatusText) {
      DOM.dbStatusText.textContent = `⚡ Supabase Cloud: Connected (${health.products_count} Items)`;
    }
  } else {
    DOM.dbStatusBadge.style.background = 'rgba(0, 230, 118, 0.12)';
    DOM.dbStatusBadge.style.borderColor = 'rgba(0, 230, 118, 0.3)';
    DOM.dbStatusBadge.style.color = 'var(--accent-emerald)';
    if (DOM.dbStatusDot) {
      DOM.dbStatusDot.style.background = 'var(--accent-emerald)';
      DOM.dbStatusDot.style.boxShadow = '0 0 8px var(--accent-emerald)';
    }
    if (DOM.dbStatusText) {
      DOM.dbStatusText.textContent = `🟢 Database: SQLite (Click for Supabase)`;
    }
  }
}

// Global App API for inline onclick handlers
window.apexApp = {
  openQuickView,
  closeQuickView,
  switchQvThumb,
  stepQvQty,
  addQvToCart,
  buyNow,
  submitReview,
  openTrackOrderModal,
  openSupabaseModal,
  addToCart: (id) => {
    const res = store.addToCart(id, 1);
    if (res.success) {
      showToast(`Added "${res.item.name}" to cart!`, 'success');
      openCartDrawer();
    } else {
      showToast(res.message, 'error');
    }
  },
  removeFromCart: (id) => store.removeFromCart(id),
  updateCartQty: (id, qty) => store.updateQuantity(id, qty),
  removePromo: () => store.removePromo(),
  toggleWishlist: (id) => {
    const added = store.toggleWishlist(id);
    const prod = currentProducts.find(p => p.id === id);
    if (added) {
      showToast(`Saved "${prod?.name || 'Item'}" to your Wishlist!`, 'info');
    } else {
      showToast(`Removed from your Wishlist.`, 'info');
    }
  },
  showToast,
  closeCartDrawer
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  // Wire up Supabase modal triggers
  DOM.dbStatusBadge?.addEventListener('click', openSupabaseModal);
  DOM.closeSupabaseBtn?.addEventListener('click', closeSupabaseModal);
  DOM.supabaseModalBackdrop?.addEventListener('click', closeSupabaseModal);
  DOM.saveSupabaseBtn?.addEventListener('click', saveSupabaseConfig);
  DOM.syncSupabaseBtn?.addEventListener('click', syncSupabaseData);

  // Check backend health & database engine
  const health = await checkBackendHealth();
  updateDbStatusUI(health);

  initGarage();
  initEventListeners();
  renderProducts();

  // Async load fresh products from active DB (Supabase or SQLite)
  refreshProductsFromBackend();
});

