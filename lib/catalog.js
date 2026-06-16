// The REAL prices, in cents. Shared by create-payment-intent.js and stripe-webhook.js
// so both functions trust the same numbers. Keep in sync with js/store.js PRODUCTS.
module.exports = {
  "kaka-ac-milan-06-07":   { name: "KAKA AC Milan 06-07",       amount: 4299 },
  "juventus-9798":         { name: "Juventus 97-98",            amount: 2999 },
  "juventus-pink":         { name: "Juventus 97-98 Pink",       amount: 2999 },
  "brazil-jersey":         { name: "Brazil 98-99 X R9",         amount: 3499 },
  "japan-jersey":          { name: "Japan Concept Jersey",      amount: 3299 },
  "maradona-jersey":       { name: "Maradona x Argentina",      amount: 3999 },
  "santos-jersey":         { name: "Santos x Neymar JR 12-13",  amount: 3599 }
};
