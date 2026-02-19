# Meta Pixel Verification Guide
**Pixel ID:** 1775251646567729  
**Website:** https://www.scarletunlimited.net

## Overview

This guide helps you verify that all Meta Pixel events are correctly implemented and firing on your website.

## ✅ Implemented Events

### 1. **PageView** (Automatic)
- **Location:** `components/analytics/MetaPixel.tsx`
- **When:** Every page load and route change
- **Status:** ✅ Implemented

### 2. **ViewContent** (Product Pages)
- **Location:** `app/products/[slug]/ProductDetailClient.tsx`
- **When:** User views a product detail page
- **Data Sent:**
  - `content_name`: Product title
  - `content_ids`: Product ID
  - `content_type`: "product"
  - `value`: Product price
  - `currency`: "BDT"
- **Status:** ✅ Implemented

### 3. **AddToCart**
- **Location:** `lib/context.tsx` (CartProvider)
- **When:** Item added to cart (authenticated & guest)
- **Data Sent:**
  - `content_name`: Product title
  - `content_ids`: Product ID array
  - `content_type`: "product"
  - `value`: Total value (price × quantity)
  - `currency`: "BDT"
  - `contents`: Array with product details
- **Status:** ✅ Implemented

### 4. **InitiateCheckout**
- **Location:** `app/checkout/page.tsx`
- **When:** Checkout page loads
- **Data Sent:**
  - `content_ids`: All product IDs in cart
  - `content_type`: "product"
  - `value`: Total cart value
  - `currency`: "BDT"
  - `num_items`: Total items count
  - `contents`: All cart items with details
- **Status:** ✅ Implemented

### 5. **AddPaymentInfo** ⭐ NEW
- **Location:** `app/checkout/page.tsx`
- **When:** Payment method is selected
- **Data Sent:**
  - `content_ids`: All product IDs in cart
  - `content_type`: "product"
  - `value`: Total cart value
  - `currency`: "BDT"
  - `contents`: All cart items with details
- **Status:** ✅ Just Added

### 6. **Purchase** (Most Important for Sale Ads)
- **Location:** 
  - `app/payment/success/page.tsx` (SSLCommerz payments)
  - `app/checkout/page.tsx` (COD orders)
- **When:** Order is completed
- **Data Sent:**
  - `content_ids`: All product IDs in order
  - `content_type`: "product"
  - `value`: Total order value
  - `currency`: "BDT"
  - `num_items`: Total items count
  - `contents`: All order items with details
  - `order_id`: Order number/ID
- **Status:** ✅ Implemented
- **Format:** Uses advanced format with full product details (recommended by Meta)

### 7. **Search**
- **Location:** `app/search/page.tsx`
- **When:** User searches for products
- **Data Sent:**
  - `search_string`: Search query
- **Status:** ✅ Implemented

### 8. **CompleteRegistration**
- **Location:** `app/register/page.tsx`
- **When:** User creates an account
- **Status:** ✅ Implemented

## 🔍 How to Verify Events Are Firing

### Method 1: Meta Events Manager (Recommended)

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Select your Pixel: **1775251646567729**
3. Click on **"Test Events"** tab
4. Visit your website in another tab
5. Perform actions:
   - View a product → Should see **ViewContent**
   - Add to cart → Should see **AddToCart**
   - Go to checkout → Should see **InitiateCheckout**
   - Select payment method → Should see **AddPaymentInfo**
   - Complete purchase → Should see **Purchase**
6. Events should appear in real-time in the Test Events tab

### Method 2: Browser Console

1. Visit your website: https://www.scarletunlimited.net
2. Open **Developer Tools** (F12)
3. Go to **Console** tab
4. Type: `window.fbq` and press Enter
5. **Expected:** Should see a function, not `undefined`
6. Type: `fbq('track', 'PageView')` and press Enter
7. **Expected:** Should execute without errors

### Method 3: Browser Network Tab

1. Open **Developer Tools** (F12)
2. Go to **Network** tab
3. Filter by: `facebook` or `fbevents`
4. Perform actions on your website
5. Look for requests to:
   - `connect.facebook.net/en_US/fbevents.js` (pixel script)
   - `facebook.com/tr?id=1775251646567729` (event tracking)
6. Click on the requests to see event data

### Method 4: Meta Pixel Helper (Browser Extension)

1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) (Chrome) or [Meta Pixel Helper](https://addons.mozilla.org/en-US/firefox/addon/facebook-pixel-helper/) (Firefox)
2. Visit your website
3. Click the extension icon
4. Should see:
   - ✅ Pixel ID: 1775251646567729
   - ✅ Events firing on different pages
   - ⚠️ Warnings if pixel not loaded or events missing

## 🧪 Testing Checklist

### Test Each Event:

- [ ] **PageView**: Visit homepage → Check Events Manager
- [ ] **ViewContent**: View a product page → Check Events Manager
- [ ] **AddToCart**: Add item to cart → Check Events Manager
- [ ] **InitiateCheckout**: Go to checkout page → Check Events Manager
- [ ] **AddPaymentInfo**: Select payment method → Check Events Manager
- [ ] **Purchase (COD)**: Complete COD order → Check Events Manager
- [ ] **Purchase (SSLCommerz)**: Complete online payment → Check Events Manager
- [ ] **Search**: Search for products → Check Events Manager

## ⚠️ Common Issues & Solutions

### Issue 1: "Pixel not active" or "No events received"

**Possible Causes:**
- Environment variable `NEXT_PUBLIC_META_PIXEL_ID` not set in Vercel
- Wrong Pixel ID in environment variable
- Pixel not deployed (need to redeploy after setting env var)

**Solution:**
1. Check Vercel → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_META_PIXEL_ID=1775251646567729`
3. Ensure it's set for **Production** environment
4. Redeploy the application

### Issue 2: Purchase events not showing

**Possible Causes:**
- Purchase event only fires on payment success page
- SSLCommerz redirect might not be tracking correctly
- Order might not be completing successfully

**Solution:**
1. Test with a small COD order first
2. Check browser console for errors
3. Verify order is actually created in admin panel
4. Check payment success page is loading correctly

### Issue 3: Events firing multiple times

**Possible Causes:**
- useEffect dependencies causing re-renders
- Multiple event tracking calls

**Solution:**
- Already handled with debouncing and guards
- Check console for duplicate event warnings

## 📊 Event Data Format Verification

### Purchase Event Format (Current Implementation)

```javascript
fbq('track', 'Purchase', {
  content_ids: ['product-id-1', 'product-id-2'],
  content_type: 'product',
  value: 500.00,
  currency: 'BDT',
  num_items: 2,
  contents: [
    { id: 'product-id-1', quantity: 1, item_price: 300.00 },
    { id: 'product-id-2', quantity: 1, item_price: 200.00 }
  ],
  order_id: 'ORDER-12345'
});
```

**✅ This format is CORRECT** - It uses Meta's recommended/advanced format with full product details, which is better than the basic format.

### Meta's Basic Format (Minimum Required)

```javascript
fbq('track', 'Purchase', {
  value: 0.00,
  currency: 'GBP'
});
```

**Our implementation exceeds this requirement** by including product details, which helps with:
- Better ad optimization
- Dynamic product ads
- Catalog matching
- Audience building

## 🎯 For Sale Ads Optimization

To optimize your sale ads for conversions:

1. **Ensure Purchase events are firing** - This is the most important
2. **Wait 24-48 hours** after implementation for Meta to collect data
3. **Check Events Manager** → Overview tab → Should see Purchase events
4. **Create Conversion Campaign** → Select "Purchase" as conversion event
5. **Meta will optimize** your ads to show to people likely to purchase

## 📝 Next Steps

1. ✅ Verify Pixel ID is set in Vercel: `NEXT_PUBLIC_META_PIXEL_ID=1775251646567729`
2. ✅ Redeploy application if env var was just added
3. ✅ Test events using Methods 1-4 above
4. ✅ Wait 24-48 hours for Meta to process events
5. ✅ Check Meta Events Manager → Overview for event counts
6. ✅ Create conversion campaign targeting "Purchase" event

## 🔗 Useful Links

- [Meta Events Manager](https://business.facebook.com/events_manager2)
- [Meta Pixel Helper Extension](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [Meta Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Standard Events Reference](https://developers.facebook.com/docs/meta-pixel/reference)









