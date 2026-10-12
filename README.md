# Galeries Lafayette Doha: Mobile App

iPhone and Android shopping app for galerieslafayette.qa, built with Expo (React Native).

## How it connects

```
Mobile app  --GraphQL-->  Magento 2 (galerieslafayette.qa)  --existing API-->  CEGID
```

The app talks only to Magento, the same backend the website uses. Prices and stock keep
coming from CEGID through the existing integration, so nothing changes on the CEGID side.

## Features

- Home: hero, "Just arrived" carousel, department tiles
- Shop: category tree with sub-categories
- Product listing with paging, sale and sold-out badges
- Product page: image gallery, size selector (out-of-stock sizes disabled), add to bag
- Search
- Bag: change quantity, remove, subtotal
- Checkout: Qatar address (zone / street / building, +974 mobile), delivery method, payment method, place order
- Payment: Cash on Delivery natively; card payment through the gateway's secure page (WebView)
- Account: sign in / register with the website account, order history; guest bag merges into the account bag on sign-in

## Run it on your phone (demo mode)

1. Install Node.js 20+ from nodejs.org.
2. In this folder run:
   ```
   npm install
   npx expo start
   ```
3. Install **Expo Go** on your phone and scan the QR code.

Demo mode (`USE_MOCK: true` in `src/config.ts`) uses sample products so the full shop and checkout flow works without API access.
Demo sign-in: `demo@galerieslafayette.qa` / `demo1234`. Demo data resets when the app reloads.

## Switch to the live store

In `src/config.ts` set `USE_MOCK: false` and check `MAGENTO_URL` and `STORE_CODE`.

Ask the Magento developer to confirm:

| Item | Why |
|---|---|
| `/graphql` endpoint reachable from outside (not blocked by WAF/Cloudflare) | The app calls it directly |
| Magento version (2.4.x) | Queries use the 2.4 schema |
| Store view code | Sent as the `Store` header |
| Delivery methods configured for Qatar | Shown at checkout |
| Postcode optional for Qatar | Otherwise the app sends `00000` |
| Payment method codes | `cashondelivery` is native; card methods go to the gateway page |

## Card payments (to do)

The website currently shows Cash on Delivery. For card payments, wire `getPaymentUrl()` in
`src/api/payment.ts` to the payment gateway module installed on Magento (QPay, CyberSource,
Checkout.com, etc.). The app places the order, opens the gateway's hosted page, and detects the
success or failure return URL. Card details never touch the app.

## Publish to the stores

1. Create an Apple Developer account (company) and a Google Play Console account.
2. `npx eas-cli@latest login`, then `npx eas-cli@latest build --platform all`.
3. `npx eas-cli@latest submit` to send builds to App Store Connect and Google Play.
4. Replace the icons in `assets/` with the brand icon first.

## Project layout

```
src/
  config.ts            settings (demo mode, store URL)
  api/
    magento.ts         live Magento GraphQL calls
    mock.ts            demo data
    payment.ts         card gateway hand-off
  context/AppContext   bag + login state
  components/          shared UI
  app/                 screens (Expo Router: each file is a screen)
```
