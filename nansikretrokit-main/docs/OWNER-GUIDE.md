# Nansik Retro Kits — Guide for the Business Owner

This explains, in plain language, how your website works, where your money goes, and
what you need to do to keep it running. No coding knowledge needed to read this.

## What this website actually is

```
Your website
├── The storefront        — pages customers browse (home, shop, product, about)
├── The cart               — where items a customer picked get totaled up
└── The checkout           — where the customer actually pays, powered by Stripe
```

It's a normal website (no monthly "store builder" subscription like Shopify). It's
hosted for free on a service called **Netlify**, and payments are handled by **Stripe**,
a payment company most online stores use.

## How a sale actually happens, step by step

1. A customer browses the shop and adds jerseys to their cart.
2. They click checkout. A payment form appears **directly on your site** — they never
   get sent to another website to pay.
3. They type their card number into that form. Important: **that card number never
   touches your website or your server** — it goes straight to Stripe, who are
   specifically built and audited to handle that safely. Your site never sees or stores
   card numbers, which means you don't carry that risk or responsibility.
4. Stripe charges the card and tells your site "this worked."
5. The money lands in **your Stripe account** (not in some account I control, not in a
   Netlify account — it's directly yours). From there, Stripe automatically transfers it
   to your linked bank account on a schedule you set (usually every few days).

## Where to actually see your sales and money

You don't look at this website's code to see sales — you look at your **Stripe
Dashboard** (dashboard.stripe.com). That shows you every payment, every customer email,
refunds, and your payout schedule to your bank. That's your real "order history."

## What it costs you

- **Hosting (Netlify): $0/month** on the free plan, which is enough for a store this size.
- **Stripe's fee**: roughly 2.9% + $0.30 per successful card payment (Stripe sets this,
  it's industry-standard, not something this site adds on top). No fee on failed/declined
  attempts.
- **No other subscriptions.** Unlike Shopify/Squarespace, there's no monthly platform fee.

## Things you (or whoever maintains the site for you) need to set up once

1. A Stripe account, with your bank account linked so payouts land somewhere.
2. Two values from Stripe get entered into Netlify's settings — one is safe to be public
   (already in the code), the other is a private key that must **never** be shared,
   posted publicly, or emailed. Whoever manages the Netlify account should be the only
   one who has it.
3. Apple Pay can be turned on inside Stripe's settings if you want it as an option.

## How to change things yourself (no coding required)

- **Change a price or add/remove a product**: this currently requires a small code edit
  (in two files that must match each other, by design — one is what customers see, the
  other is what actually gets charged, so they can't be tricked into paying less). Ask
  your developer to make this change rather than editing it directly, so the two stay in
  sync.
- **Issue a refund**: done entirely inside the Stripe Dashboard — no code involved.
- **See how many people visited the site**: Netlify has basic visitor stats in its
  dashboard; for more detail you'd add a free tool like Google Analytics.

## If something looks wrong

- **A customer says they were charged but didn't get their order**: check Stripe
  Dashboard first — if the payment shows "succeeded" there, it's real and you should
  fulfill it. If it shows "failed," nothing was charged.
- **Checkout button doesn't work at all**: this is a code/configuration issue (e.g. a
  Stripe key wasn't entered correctly) — this is the one thing that needs your developer,
  not something to debug yourself.
