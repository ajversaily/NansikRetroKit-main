# Nansik Retro Kits

© 2026 Nansik Retro Kit. All rights reserved.

Website coded by GitHub: ajversaily.

A small storefront for retro football jerseys: static HTML/CSS/JS pages, hosted on
Vercel, with checkout handled by an embedded Stripe payment form.

Not the developer? See [docs/OWNER-GUIDE.md](docs/OWNER-GUIDE.md) for a plain-language
explanation of how the site and payments work.

## Project structure

```
nansikretrokit-main/
├── index.html, shop.html, product.html, cart.html, about.html, faq.html
│                                  — the pages themselves (must stay at the project root)
├── css/styles.css                — all site styling
├── js/
│   ├── store.js                  — product catalog (display), cart storage (localStorage)
│   ├── main.js                   — page behavior: product page, cart page, shop grid
│   ├── stripe-config.js          — public Stripe publishable key
│   └── theme.js                  — scroll-reveal animation
├── lib/catalog.js                — the REAL prices, used server-side to charge customers
├── api/
│   └── create-checkout-session.js — the one backend endpoint: prices the cart and
│                                     creates a Stripe embedded Checkout Session
├── images/                       — all product photos
├── docs/
│   └── OWNER-GUIDE.md            — plain-language guide for the business owner
├── vercel.json                   — Vercel rewrite config (clean product URLs)
├── package.json                  — npm dependency (stripe)
└── .gitignore
```

## Clean URLs

Pages are linked with their `.html` extension (e.g. `shop.html`, `about.html`) so the site
also works unmodified on GitHub Pages. Product pages use `/product/<id>` (e.g.
`/product/maradona-jersey`), which `vercel.json` rewrites to `product.html?id=...` when
served from Vercel. `js/store.js`'s `productUrl()` generates these links as
`product.html?id=...` directly, which works on any host.

## Payments (embedded Stripe Checkout + Apple Pay)

Checkout happens directly on this site — customers never leave for checkout.stripe.com.
Card numbers still never touch our server: Stripe's own JS (loaded from `js.stripe.com`)
renders the actual payment form inside a Stripe-controlled iframe embedded in `cart.html`.

Flow:

1. `cart.html` calls `/api/create-checkout-session`, a Vercel serverless function
   (`api/create-checkout-session.js`) that prices the cart using the server-side
   `lib/catalog.js` (never trusting a price from the browser) and asks Stripe to create
   an embedded Checkout Session.
2. Stripe's embedded checkout UI mounts directly into `#checkout` on `cart.html` — the
   customer pays without leaving the site.
3. On completion, Stripe redirects back to `/cart?session_id=...`, which clears the cart
   and shows a thank-you message.

Secrets never go in the repo — `STRIPE_SECRET_KEY` lives only as a Vercel environment
variable.

**Known simplification:** there's no webhook or database here, so `cart.html` trusts the
`session_id` redirect param as proof of payment. That's simple and fine for a small store,
but it means there's no independent server-side record of completed orders — only what's
in your Stripe Dashboard. If you ever want real order history, the next step would be
adding a Stripe webhook that verifies payment server-side before recording anything.

## Setup

1. Create a Stripe account and copy your secret key (`sk_test_...` first, `sk_live_...` later).
2. Import this repo into Vercel. Vercel auto-detects the `api/` folder as serverless
   functions and `vercel.json` for the product URL rewrite.
3. In Vercel → Project → Settings → Environment Variables, add `STRIPE_SECRET_KEY`.
4. Put your Stripe **publishable** key (safe to be public) into `js/stripe-config.js`.
5. In Stripe → Settings → Payment methods, enable Apple Pay.
6. Test with card `4242 4242 4242 4242`, any future expiry, any CVC. Use
   `4000 0000 0000 9995` to test a decline.

For local testing, install the Vercel CLI and run `vercel dev` — it serves the site and
runs the functions locally, reading `STRIPE_SECRET_KEY` from a `.env` file (already
git-ignored).

## Keeping prices in sync

Prices live in two places and must be kept in sync: `js/store.js` (display only) and
`lib/catalog.js` (the amount actually charged, used by
`api/create-checkout-session.js`). The server price is the one that takes the money —
if they ever disagree, the customer is charged whatever `lib/catalog.js` says, not what
the page displays.
