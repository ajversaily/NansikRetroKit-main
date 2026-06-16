const Stripe = require("stripe");
const CATALOG = require("../../lib/catalog");

const CURRENCY = "usd";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server is missing STRIPE_SECRET_KEY." }) };
  }

  const stripe = Stripe(secretKey);

  try {
    const body = JSON.parse(event.body || "{}");
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
      return { statusCode: 400, body: JSON.stringify({ error: "Cart is empty or has no valid items." }) };
    }

    const origin = body.origin || event.headers.origin || "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      line_items: lineItems,
      return_url: `${origin}/cart?session_id={CHECKOUT_SESSION_ID}`
    });

    return { statusCode: 200, body: JSON.stringify({ clientSecret: session.client_secret }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Could not start checkout. Please try again." }) };
  }
};
