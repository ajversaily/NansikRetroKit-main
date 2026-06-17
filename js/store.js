// Fallback products used if Supabase is unreachable
const PRODUCTS_FALLBACK = {
  "juventus-9798": {
    id: "juventus-9798",
    name: "Juventus 97-98",
    image: "images/juventus9798.JPG",
    images: ["images/juventus9798.JPG"],
    price: 29.99,
    description: "Classic Retro Jersey"
  },
  "kaka-ac-milan-06-07": {
    id: "kaka-ac-milan-06-07",
    name: "KAKA AC Milan 06-07",
    image: "images/redkappa.jpeg",
    images: ["images/redkappa.jpeg", "images/kakafront.jpg"],
    price: 42.99,
    description: "Premium Retro Jersey"
  },
  "juventus-pink": {
    id: "juventus-pink",
    name: "Juventus 97-98 Pink",
    image: "images/juventuspink.PNG",
    images: ["images/juventuspink.PNG", "images/kappamenspinkteeitaly.jpg"],
    price: 29.99,
    description: "Premium Retro Jersey"
  },
  "brazil-jersey": {
    id: "brazil-jersey",
    name: "Brazil 98-99 X R9",
    image: "images/brazil.PNG",
    images: ["images/brazil.PNG", "images/ronaldobrazilfront.jpg", "images/brazilronaldbrazil.jpg"],
    price: 34.99,
    description: "Iconic Retro Jersey"
  },
  "japan-jersey": {
    id: "japan-jersey",
    name: "Japan Concept Jersey",
    image: "images/japan.PNG",
    images: ["images/japan.PNG"],
    price: 32.99,
    description: "Premium Retro Jersey"
  },
  "maradona-jersey": {
    id: "maradona-jersey",
    name: "Maradona x Argentina",
    image: "images/maradona.PNG",
    images: ["images/maradona.PNG", "images/maradonafront.jpg", "images/maradonaback.jpg"],
    price: 39.99,
    description: "Legend Retro Jersey"
  },
  "santos-jersey": {
    id: "santos-jersey",
    name: "Santos x Neymar JR 12-13",
    image: "images/santos.PNG",
    images: ["images/santos.PNG", "images/neymarbmgfront.jpg", "images/neymarbmgback.jpg"],
    price: 35.99,
    description: "Classic Retro Jersey"
  }
};

// Live products loaded from Supabase via /api/products
let PRODUCTS = { ...PRODUCTS_FALLBACK };

(async function loadLiveProducts() {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) return;
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return;

    // Replace PRODUCTS with live data from Supabase
    PRODUCTS = {};
    list.forEach(p => { PRODUCTS[p.id] = p; });

    // Re-render any page that called renderProducts() before data arrived
    if (typeof window.__onProductsLoaded === "function") {
      window.__onProductsLoaded(PRODUCTS);
    }
  } catch (_) {
    // Network failed — fallback already in place
  }
})();

const imageFixes = {
  "IMG_3076.jpeg": "images/redkappa.jpeg",
  "redkappa.jpeg": "images/redkappa.jpeg",
  "IMG_3079.jpeg": "images/juventuspink.PNG",
  "juventuspink.PNG": "images/juventuspink.PNG",
  "brazil.PNG": "images/brazil.PNG",
  "japan.PNG": "images/japan.PNG",
  "maradona.PNG": "images/maradona.PNG",
  "santos.PNG": "images/santos.PNG",
  "Photoroom_20250318_152243.JPG": "images/sportinglisbon0203.JPG",
  "sportinglisbon0203.JPG": "images/sportinglisbon0203.JPG",
  "Photoroom_20250318_152823.JPG": "images/juventus9798.JPG",
  "juventus9798.JPG": "images/juventus9798.JPG"
};

function assetImagePath(image) {
  if (!image) return "";
  return imageFixes[image] || image;
}

function productSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function productDesc(product) {
  return `${product.name} | Price: ${formatMoney(product.price)} | ${product.description}`;
}

function getProduct(id) {
  return PRODUCTS[id] || null;
}

function productUrl(id) {
  const product = getProduct(id);
  if (!product) return "shop.html";

  return "product.html?id=" + product.id;
}

function getCart() {
  const saved = JSON.parse(localStorage.getItem("cart") || "[]");

  const normalized = saved.map((item) => {
    // support two storage shapes:
    // - legacy/composite id: { id: 'product-id::M', ... }
    // - preferred shape: { id: 'product-id', size: 'M', ... }
    let baseId = null;
    let size = null;

    if (item && item.id && String(item.id).includes("::") && !item.size) {
      const parts = String(item.id).split("::");
      baseId = parts[0];
      size = parts[1] || "M";
    } else {
      baseId = item.id || productSlug(item.name);
      size = item.size || "M";
    }

    const id = `${baseId}::${size}`;
    const knownProduct = getProduct(baseId);
    const priceMatch = String(item.desc || "").match(/Price:\s*\$(\d+(\.\d+)?)/);
    const price = knownProduct ? knownProduct.price : Number(priceMatch ? priceMatch[1] : item.price || 0);

    return {
      id,
      baseId,
      size,
      name: knownProduct ? knownProduct.name : item.name,
      image: assetImagePath(knownProduct ? knownProduct.image : item.image),
      desc: knownProduct ? `${productDesc(knownProduct)} | Size: ${size}` : item.desc,
      price,
      quantity: Math.max(1, Number(item.quantity || 1))
    };
  });

  return normalized.reduce((items, item) => {
    const existing = items.find((savedItem) => savedItem.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push(item);
    }
    return items;
  }, []);
}

function saveCart(cart) {
  // Persist in a compact shape: base id + size fields (not composite id)
  const toSave = (cart || []).map((item) => ({
    id: item.baseId || (item.id ? String(item.id).split("::")[0] : undefined),
    size: item.size || (item.id && String(item.id).includes("::") ? String(item.id).split("::")[1] : undefined),
    quantity: item.quantity || 1,
    name: item.name,
    image: item.image,
    desc: item.desc,
    price: item.price
  }));

  localStorage.setItem("cart", JSON.stringify(toSave));
  updateCartBadges();
}

function cartItemCount(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal(cart = getCart()) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateCartBadges() {
  document.querySelectorAll("[data-cart-count], #cartCount").forEach((badge) => {
    badge.textContent = cartItemCount();
    badge.classList.add("cart-count-pop");
    window.setTimeout(() => badge.classList.remove("cart-count-pop"), 250);
  });
}

function addToCart(id, quantity = 1, size = "M") {
  const product = getProduct(id);
  if (!product) return null;

  const cart = getCart();
  const key = `${id}::${size}`;
  const existing = cart.find((item) => item.id === key);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: key,
      baseId: id,
      size,
      name: product.name,
      image: product.image,
      desc: `${productDesc(product)} | Size: ${size}`,
      price: product.price,
      quantity
    });
  }

  saveCart(cart);
  return product;
}

function setCartQuantity(id, quantity) {
  const cart = getCart()
    .map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)
    .filter((item) => item.quantity > 0);
  saveCart(cart);
}

function removeFromCart(id) {
  saveCart(getCart().filter((item) => item.id !== id));
}

function clearCart() {
  saveCart([]);
}

// Orders (simple in-site storage)
function getOrders() {
  return JSON.parse(localStorage.getItem('orders') || '[]');
}

function saveOrder(order) {
  const existing = getOrders();
  existing.push(order);
  localStorage.setItem('orders', JSON.stringify(existing));
}

function getOrder(id) {
  return getOrders().find(o => o.id === id) || null;
}

document.addEventListener("DOMContentLoaded", updateCartBadges);
