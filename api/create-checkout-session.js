const Stripe = require("stripe");
const CATALOG = require("../lib/catalog");

const CURRENCY = "usd";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: "Server is missing STRIPE_SECRET_KEY." });
  }

  const stripe = Stripe(secretKey);

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const items = Array.isArray(body.items) ? body.items : [];

    // Price the cart using OUR prices, ignoring whatever the browser sent.
    const lineItems = [];
    for (const item of items) {
      const product = CATALOG[item.id];
      if (!product) continue; // skip anything we don't actually sell

      const quantity = Math.min(20, Math.max(1, parseInt(item.quantity, 10) || 1));
      const size = String(item.size || "M").slice(0, 3);

      lineItems.push({
        quantity,
        price_data: {
          currency: CURRENCY,
          unit_amount: product.amount,
          product_data: { name: `${product.name} (Size ${size})` }
        }
      });
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty or has no valid items." });
    }

    const origin = body.origin || req.headers.origin || "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["US"] },
      return_url: `${origin}/cart?session_id={CHECKOUT_SESSION_ID}`
    });

    return res.status(200).json({ clientSecret: session.client_secret });
  } catch (err) {
    return res.status(500).json({ error: "Could not start checkout. Please try again." });
  }
};
