# Apple Plus — User Flow Documentation

> All user journeys, decision trees, and interaction paths.  
> Date: 2026-06-04

---

## 1. User Types

| Role | Entry Points | Key Journeys |
|------|-------------|--------------|
| **Guest** | Homepage, Direct URL, Search | Browse → Product → Cart → Register/Checkout |
| **Customer** | Login, Homepage | Browse → Purchase → Order tracking |
| **Admin** | `/admin` | Products CRUD, Order management, Analytics |

---

## 2. Global Navigation Map

```
                        ┌─────────────┐
                        │  Homepage   │
                        └──────┬──────┘
              ┌────────────────┼────────────────────┐
              ↓                ↓                    ↓
     ┌────────────────┐  ┌──────────┐   ┌──────────────────┐
     │  Search Results │  │ Category │   │  Brand Page       │
     └────────┬────────┘  │  Page    │   └────────┬─────────┘
              │           └────┬─────┘            │
              └────────────────┼──────────────────┘
                               ↓
                      ┌────────────────┐
                      │  Product Detail │
                      └───────┬────────┘
                ┌─────────────┼─────────────┐
                ↓             ↓             ↓
         ┌──────────┐  ┌──────────┐  ┌──────────────┐
         │   Cart   │  │ Wishlist │  │  Comparison  │
         └─────┬────┘  └──────────┘  └──────────────┘
               ↓
        ┌──────────────┐
        │   Checkout   │
        └──────┬───────┘
               ↓
     ┌─────────────────────┐
     │  Order Confirmation  │
     └─────────────────────┘
```

---

## 3. Authentication Flows

### 3.1 Registration

```
[Landing Page]
      │
      ↓
[Click "Create Account" or Cart/Wishlist when Guest]
      │
      ↓
┌─────────────────────────────────────────────┐
│  Registration Page                          │
│  First Name, Last Name                      │
│  Email                                      │
│  Password (8+ chars, 1 upper, 1 number)     │
│  Confirm Password                           │
│  ☑ Agree to Terms                           │
│  [Create Account]                           │
│  ── or ──                                   │
│  [Continue with Google]                     │
│  [Continue with Apple]                      │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ↓                   ↓
  [Validation Pass]    [Validation Fail]
         │               Show inline
         ↓               field errors
  [Email Verification Sent]
         │
         ↓
  [Check Email → Click Link]
         │
         ↓
  [Email Verified ✓]
         │
         ↓
  [Redirected to Homepage / Original Page]
         │
         ↓
  [Welcome toast: "Welcome, {Name}!"]
```

### 3.2 Login

```
[Login Page]
      │
      ├── Email + Password → [Submit]
      │         │
      │   ┌─────┴──────────────┐
      │   ↓                    ↓
      │ [Success]        [Wrong credentials]
      │   │                    │
      │   ↓               Show error, offer
      │ [Redirect to       "Forgot Password?"
      │  original page]
      │
      ├── [Continue with Google] → OAuth2 popup → [Success → Redirect]
      │
      └── [Continue with Apple] → OAuth2 → [Success → Redirect]
```

### 3.3 Forgot Password

```
[Forgot Password Page]
      │
      ↓
[Enter email → Submit]
      │
      ↓
[Email with reset link sent]  ← always show success (no user enumeration)
      │
      ↓
[User clicks link in email (valid 1 hour)]
      │
      ├── [Valid token] → [Reset Password Form]
      │                         │
      │                         ↓
      │                   [New password + confirm]
      │                         │
      │                         ↓
      │                   [Password updated ✓]
      │                         │
      │                         ↓
      │                   [Auto-login → Homepage]
      │
      └── [Expired/invalid] → "Link expired. Request a new one." → [Resend]
```

---

## 4. Shopping Flows

### 4.1 Homepage → Product Discovery

```
[Homepage]
      │
      ├── [Search Bar] → type query → [Search Results]
      │
      ├── [Hero Banner CTA] → [Product Page] or [Category]
      │
      ├── [Category Card click]
      │         │
      │         ↓
      │   [Catalog Page: pre-filtered by category]
      │
      ├── [Popular Products → Product Card]
      │         │
      │         ↓
      │   [Product Detail Page]
      │
      ├── [Discount Section → Product Card]
      │         │
      │         ↓
      │   [Product Detail Page: discount badge visible]
      │
      └── [Brand Logo click]
                │
                ↓
          [Brand Page: brand story + filtered products]
```

### 4.2 Search Flow

```
[User types in Search]
      │
      ↓
[300ms debounce]
      │
      ↓
[Instant results dropdown]
      │  ├── Suggested products (3–5 thumbnails)
      │  ├── Category suggestions
      │  ├── Brand suggestions
      │  └── "See all X results for '{query}'"
      │
      ├── [Click suggestion] → [Product Page or Category]
      │
      └── [Press Enter / See all]
                │
                ↓
         [Search Results Page]
                │
                ├── Filter by Category, Brand, Price, Rating
                ├── Sort results
                └── Paginate / Load More
```

### 4.3 Catalog Browsing

```
[Catalog / Category Page]
      │
      ├── [Apply Filter]
      │         │
      │         ↓
      │   [URL updated: ?brand=apple&price=0-1500&rating=4]
      │   [Products re-fetched, grid updates]
      │   [Active filter chips shown above grid]
      │
      ├── [Change Sort]
      │         │
      │         ↓
      │   [URL updated: ?sort=price_asc]
      │   [Grid re-renders]
      │
      ├── [Toggle View: Grid ↔ List]
      │         │
      │         ↓
      │   [Layout switch animation]
      │
      ├── [Product Card hover]
      │   ├── "Add to Cart" button appears
      │   └── Wishlist icon appears
      │
      └── [Product Card click] → [Product Detail Page]
```

### 4.4 Product Detail — Configuration & Add to Cart

```
[Product Detail Page]
      │
      ├── [View gallery image] → zoom / lightbox
      │
      ├── [Select Color variant]
      │         │
      │         ↓
      │   [Main image updates, price may change]
      │
      ├── [Select Storage/Size variant]
      │         │
      │         ↓
      │   [Price updates, stock status updates]
      │
      ├── [Adjust Quantity]
      │         │
      │         ├── [Quantity > stock] → cap at max, show toast warning
      │         └── [Quantity = 0] → disable "Add to Cart"
      │
      ├── [Add to Cart]
      │         │
      │   ┌─────┴──────────────────┐
      │   ↓                        ↓
      │ [Guest]               [Logged In]
      │   │                        │
      │   ↓                        ↓
      │ [Saved to            [Saved to server cart]
      │  localStorage]            │
      │   │                        │
      │   └────────────────────────┘
      │                            │
      │                            ↓
      │                   [Cart drawer slides open]
      │                   [Item count badge updates]
      │                   [Success toast]
      │
      ├── [Buy Now] → [Skip drawer → Go directly to Checkout]
      │
      ├── [Add to Wishlist]
      │         │
      │   ┌─────┴──────────────────┐
      │   ↓                        ↓
      │ [Guest: prompt to login]  [Logged in: saved ✓]
      │
      ├── [Add to Compare]
      │         │
      │         ↓
      │   [Product added to comparison bar]
      │   [If 2+ items: "Compare now" appears]
      │
      └── [See Reviews] → scroll to reviews section
                │
                ├── [Write a Review]
                │         │
                │   ┌─────┴──────────────────┐
                │   ↓                        ↓
                │ [Guest: must login]  [Modal: stars + text + Submit]
                │
                └── [Filter reviews by rating / sort by helpful]
```

---

## 5. Cart Flow

### 5.1 Cart Drawer

```
[Cart Drawer Open]
      │
      ├── [Change item quantity]
      │         │
      │         ↓
      │   [Subtotal recalculates]
      │
      ├── [Remove item]
      │         │
      │         ↓
      │   [Item fades out, subtotal updates]
      │   [If cart empty: "Your cart is empty" + Browse CTA]
      │
      ├── [Apply promo code]
      │         │
      │   ┌─────┴──────────────────┐
      │   ↓                        ↓
      │ [Valid code]          [Invalid code]
      │   │                        │
      │   ↓                        ↓
      │ [Discount applied]    [Error: "Invalid or expired code"]
      │ [Green checkmark]
      │
      ├── [Proceed to Checkout]
      │         │
      │   ┌─────┴──────────────────┐
      │   ↓                        ↓
      │ [Guest]               [Logged In]
      │   │                        │
      │   ↓                        ↓
      │ [Prompt: Sign in       [Go to Checkout]
      │  or continue as guest]
      │
      └── [Continue Shopping] → [Close drawer]
```

### 5.2 Cart Merge (Guest → Login)

```
[Guest adds items to cart]
      │
      ↓
[Guest logs in / registers]
      │
      ↓
[API: merge localStorage cart with server cart]
      │
      ├── [No conflict] → merged seamlessly
      │
      └── [Same product in both] → use higher quantity
```

---

## 6. Checkout Flow

```
[Checkout Entry]
      │
      ↓
Step 1: Contact Information
  ┌─────────────────────────────────────────┐
  │ • Fill name, email, phone               │
  │ • Or: [Use saved account info]          │
  │ • Validate all fields                   │
  └──────────────────┬──────────────────────┘
                     │ [Continue →]
                     ↓
Step 2: Shipping Address
  ┌─────────────────────────────────────────┐
  │ • Select saved address (if logged in)   │
  │   ○ Home: 123 Main St                   │
  │   ○ Work: 456 Office Ave                │
  │   [+ Add New Address]                   │
  │ • Or: fill address form                 │
  └──────────────────┬──────────────────────┘
                     │ [Continue →]
                     ↓
Step 3: Shipping Method
  ┌─────────────────────────────────────────┐
  │ ● Standard (3–5 days)    FREE            │
  │ ○ Express (1–2 days)     $9.99           │
  │ ○ Same Day               $19.99          │
  └──────────────────┬──────────────────────┘
                     │ [Continue →]
                     ↓
Step 4: Payment
  ┌─────────────────────────────────────────┐
  │ [Apple Pay]  [Google Pay]               │
  │ ─────────── or pay by card ──────────── │
  │ Card number, expiry, CVV                │
  │ Billing: same as shipping ☑             │
  │ Save card for future ☑                  │
  └──────────────────┬──────────────────────┘
                     │ [Continue →]
                     ↓
Step 5: Order Review
  ┌─────────────────────────────────────────┐
  │ • All details displayed read-only       │
  │ • Edit links next to each section       │
  │ • Final price breakdown                 │
  │ • [Place Order — $1,248.00]             │
  └──────────────────┬──────────────────────┘
                     │ [Place Order]
                     ↓
               [Processing spinner]
                     │
              ┌──────┴──────────────┐
              ↓                     ↓
      [Payment Success]      [Payment Failed]
              │                     │
              ↓                     ↓
   [Confirmation Page]     [Error: retry or
   [Email sent]             use different card]
   [Order in Account]
```

---

## 7. Order Management (Customer)

```
[Account → Orders]
      │
      ├── [Order list: most recent first]
      │
      ├── [Click order]
      │         │
      │         ↓
      │   [Order Detail Page]
      │   • Order timeline (Placed → Confirmed → Shipped → Delivered)
      │   • Tracking number + link to carrier
      │   • Items ordered + prices
      │   • Delivery address
      │   • Payment method (masked)
      │
      ├── [Cancel Order]
      │         │
      │   Only available if status = "Processing"
      │         │
      │         ↓
      │   [Confirm dialog → Cancel → Refund initiated]
      │
      ├── [Return/Refund]
      │         │
      │   Only available within 30 days of delivery
      │         │
      │         ↓
      │   [Select items → Reason → Submit return request]
      │   [Email with return label sent]
      │
      └── [Reorder] → [All items added to cart]
```

---

## 8. Wishlist Flow

```
[Wishlist Page]
      │
      ├── [Add item to Cart]
      │         │
      │         ↓
      │   [Cart drawer opens briefly]
      │   [Item stays in wishlist (or remove: user preference)]
      │
      ├── [Remove item from Wishlist]
      │         │
      │         ↓
      │   [Fade out animation, undo toast for 3 seconds]
      │
      ├── [Share Wishlist]
      │         │
      │         ↓
      │   [Modal: copy shareable link or send via email]
      │
      └── [Move all to Cart]
                │
                ↓
         [All in-stock items → Cart]
         [Out-of-stock items remain in Wishlist]
         [Toast: "12 items added, 1 unavailable"]
```

---

## 9. Comparison Flow

```
[Any Product Page or Catalog]
      │
      ↓
[Click "Add to Compare" on product]
      │
      ↓
[Floating comparison bar appears at bottom]
  ┌────────────────────────────────────────────────┐
  │ Compare:  [iPhone 16 Pro ×]  [MacBook Air ×]   │
  │                          [+ Add (2 more slots)] │
  │                          [Compare Now →]        │
  └────────────────────────────────────────────────┘
      │
      ├── [Add more products] → click "Add to Compare" on other products
      │
      ├── [Compare Now (2–4 products)]
      │         │
      │         ↓
      │   [Comparison Page: side-by-side spec table]
      │
      └── [Remove from comparison] → [Bar updates, hides if 0 items]
```

---

## 10. Admin Flows

### 10.1 Product Management

```
[Admin → Products]
      │
      ├── [Add New Product]
      │         │
      │         ↓
      │   [Multi-step form]
      │   Step 1: Basic Info (name, description, category, brand)
      │   Step 2: Variants (colors, sizes, SKUs, prices)
      │   Step 3: Media (drag-drop image upload, reorder, alt text)
      │   Step 4: Inventory (stock per variant, warehouse)
      │   Step 5: SEO (slug, meta title, meta desc)
      │         │
      │         ↓
      │   [Save as Draft] or [Publish]
      │
      ├── [Edit Product]
      │         │
      │         ↓
      │   [Same form, pre-populated]
      │   [Auto-save draft every 30s]
      │   [Publish changes]
      │
      ├── [Bulk Actions]
      │   • Select multiple → Archive / Delete / Change Category / Export
      │
      └── [Delete Product]
                │
                ↓
         [Confirm dialog: "This cannot be undone"]
         [Soft delete: product hidden, data retained]
```

### 10.2 Order Management

```
[Admin → Orders]
      │
      ├── [View Order Detail]
      │         │
      │         ↓
      │   [Full order info + customer + timeline]
      │
      ├── [Update Order Status]
      │   Processing → Confirmed → Shipped → Delivered
      │   [Select status → Auto-email customer]
      │
      ├── [Add Tracking Number]
      │         │
      │         ↓
      │   [Input field → Save → Customer notified]
      │
      ├── [Process Refund]
      │         │
      │         ↓
      │   [Select items/amounts → Confirm → Stripe refund initiated]
      │
      └── [Export Orders] → [CSV download with date range filter]
```

### 10.3 User Management

```
[Admin → Users]
      │
      ├── [Search / filter users by name, email, role]
      │
      ├── [View User Profile]
      │   • Order history
      │   • Registered date
      │   • Total spent
      │
      ├── [Change Role] → Customer ↔ Admin
      │
      └── [Suspend Account] → [User cannot login, sees suspension message]
```

---

## 11. Notification Triggers

| Event | Email | In-App Toast | Push (future) |
|-------|-------|-------------|---------------|
| Registration | Welcome email | — | — |
| Order placed | Order confirmation | ✓ | ✓ |
| Payment failed | — | ✓ error | — |
| Order shipped | Tracking info | ✓ | ✓ |
| Order delivered | — | ✓ | ✓ |
| Price drop (wishlist) | Weekly digest | ✓ | ✓ |
| Back in stock | Notification email | ✓ | ✓ |
| Return approved | Confirmation | ✓ | — |
| Admin: new order | — | Dashboard badge | — |

---

## 12. Error States & Recovery

| Error | UI Response | Recovery Path |
|-------|------------|---------------|
| Product out of stock | Disable "Add to Cart", show "Notify Me" | Stock restored → email |
| Payment declined | Inline card error, keep form filled | Retry or different card |
| Session expired | Modal: "Your session expired, please sign in" | Re-login → return to page |
| API timeout | Toast: "Something went wrong. Try again." | Retry button |
| Empty search results | Illustration + suggestions | Edit query or browse |
| Checkout: item sold out | Alert before order confirmation | Remove item, continue |
| Network offline | Banner: "No internet connection" | Auto-retry on reconnect |
