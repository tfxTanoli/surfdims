# SurfDims Architecture Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    React Application (Vite)                          │  │
│  │                                                                      │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                      App.tsx                                │   │  │
│  │  │  - State Management                                        │   │  │
│  │  │  - Route Handling                                          │   │  │
│  │  │  - Firebase Integration                                   │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │  │
│  │  │  Components      │  │  Pages           │  │  Utils           │  │  │
│  │  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  │  │
│  │  │ Header           │  │ LoginPage        │  │ imageUtils       │  │  │
│  │  │ ListingForm      │  │ SignupPage       │  │ locationUtils    │  │  │
│  │  │ ListingDetail    │  │                  │  │ imageCompression │  │  │
│  │  │ PaymentModal     │  │                  │  │                  │  │  │
│  │  │ StripePaymentForm│  │                  │  │                  │  │  │
│  │  │ StagedBoardsCart │  │                  │  │                  │  │  │
│  │  │ AdminPage        │  │                  │  │                  │  │  │
│  │  │ ... (40+ more)   │  │                  │  │                  │  │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Configuration Files                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │ firebase.ts  │  │ stripe.ts    │  │ types.ts                 │  │  │
│  │  │              │  │              │  │ constants.ts             │  │  │
│  │  │ - Auth       │  │ - Publishable│  │ - Enums                  │  │  │
│  │  │ - Firestore  │  │   Key        │  │ - Interfaces             │  │  │
│  │  │ - Storage    │  │ - loadStripe │  │ - Mock Data              │  │  │
│  │  │ - Functions  │  │              │  │                          │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
        │  Firebase Auth   │  │  Firestore   │  │  Stripe API  │
        │                  │  │              │  │              │
        │ - Login/Signup   │  │ - boards     │  │ - Payment    │
        │ - Email Verify   │  │ - users      │  │ - Webhooks   │
        │ - User Mgmt      │  │ - discounts  │  │ - Charges    │
        │                  │  │ - ads        │  │              │
        └──────────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔄 Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW DIAGRAM                                │
└─────────────────────────────────────────────────────────────────────────────┘

CLIENT SIDE                          SERVER SIDE                    STRIPE
─────────────────────────────────────────────────────────────────────────────

User fills form
    │
    ▼
Clicks "Save & List Another"
    │
    ▼
Board added to cart (localStorage)
    │
    ▼
User clicks "Proceed to Payment"
    │
    ▼
PaymentModal opens
    │
    ▼
StripePaymentForm renders
    │
    ▼
User enters card details
    │
    ▼
User clicks "Pay"
    │
    ├─────────────────────────────────────────────────────────────────────────┐
    │                                                                         │
    ▼                                                                         │
POST /api/create-payment-intent                                              │
{                                                                             │
  amount: 19.99,                                                              │
  currency: "usd",                                                            │
  boardId: "board-123"                                                        │
}                                                                             │
    │                                                                         │
    ├──────────────────────────────────────────────────────────────────────┐ │
    │                                                                      │ │
    │                                                                      ▼ │
    │                                                    stripe.paymentIntents.create()
    │                                                            │         │
    │                                                            ▼         │
    │                                                    PaymentIntent     │
    │                                                    created on Stripe │
    │                                                            │         │
    │                                                            ▼         │
    │                                                    Return clientSecret
    │                                                            │         │
    │                                                            ▼         │
    │                                                    {                 │
    │                                                      clientSecret: "pi_..._secret_...",
    │                                                      id: "pi_..."    │
    │                                                    }                 │
    │                                                            │         │
    │                                                            ▼         │
    │◄──────────────────────────────────────────────────────────┘         │
    │                                                                      │
    ▼                                                                      │
stripe.confirmCardPayment(clientSecret, {                                 │
  payment_method: {                                                        │
    card: cardElement                                                      │
  }                                                                        │
})                                                                         │
    │                                                                      │
    ├──────────────────────────────────────────────────────────────────────┐
    │                                                                      │
    ▼                                                                      │
    │                                                                      ▼
    │                                                    Stripe processes payment
    │                                                            │
    │                                                            ▼
    │                                                    Payment succeeds/fails
    │                                                            │
    │                                                            ▼
    │                                                    Webhook event triggered
    │                                                            │
    │                                                            ▼
    │                                                    POST /api/webhook
    │                                                    {
    │                                                      type: "payment_intent.succeeded",
    │                                                      data: {
    │                                                        object: {
    │                                                          id: "pi_...",
    │                                                          metadata: {
    │                                                            boardId: "board-123"
    │                                                          }
    │                                                        }
    │                                                      }
    │                                                    }
    │                                                            │
    │                                                            ▼
    │                                                    Verify signature
    │                                                            │
    │                                                            ▼
    │                                                    Update Firestore:
    │                                                    boards/board-123 {
    │                                                      status: "Live",
    │                                                      isPaid: true,
    │                                                      paymentVerified: true,
    │                                                      expiresAt: now + 365 days
    │                                                    }
    │                                                            │
    │                                                            ▼
    │◄──────────────────────────────────────────────────────────┘
    │
    ▼
{
  status: "succeeded",
  paymentIntent: { id: "pi_..." }
}
    │
    ▼
onSuccess(paymentIntentId)
    │
    ▼
Save boards to Firebase
    │
    ▼
Clear cart
    │
    ▼
Show success message
    │
    ▼
User sees boards as "Live"
```

---

## 🗄️ Database Schema

```
FIRESTORE DATABASE: "surfdims"
│
├── boards/
│   └── {boardId}
│       ├── id: string
│       ├── type: "board"
│       ├── sellerId: string
│       ├── brand: string
│       ├── model: string
│       ├── dimensions: [
│       │   {
│       │     length: number,
│       │     width: number,
│       │     thickness: number,
│       │     volume: number
│       │   }
│       │ ]
│       ├── finSystem: string
│       ├── finSetup: string
│       ├── condition: string
│       ├── price: number
│       ├── description: string
│       ├── images: [string]
│       ├── listedDate: string
│       ├── expiresAt: string
│       ├── isPaid: boolean
│       ├── status: "Live" | "Expired" | "Sold" | "PaymentFailed"
│       ├── paymentIntentId: string
│       ├── paymentVerified: boolean
│       └── ... (other fields)
│
├── users/
│   └── {userId}
│       ├── id: string
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── location: string
│       ├── country: string
│       ├── avatar: string
│       ├── favs: [string]
│       ├── alerts: [
│       │   {
│       │     id: string,
│       │     brand: string,
│       │     model: string,
│       │     volumeMin: number,
│       │     volumeMax: number,
│       │     ... (other filter fields)
│       │   }
│       │ ]
│       ├── notifications: [
│       │   {
│       │     id: string,
│       │     type: string,
│       │     message: string,
│       │     boardId: string,
│       │     isRead: boolean,
│       │     createdAt: string
│       │   }
│       │ ]
│       ├── isBlocked: boolean
│       ├── isVerified: boolean
│       ├── role: "admin" | "user"
│       └── createdAt: string
│
├── discountCodes/
│   └── {codeId}
│       ├── id: string
│       ├── name: string
│       ├── percentageOff: number
│       ├── appliesTo: "Used" | "New"
│       ├── country: string
│       ├── expiryDate: string
│       ├── usageLimit: number
│       ├── usageCount: number
│       └── createdAt: string
│
├── ads/
│   └── {adId}
│       ├── id: string
│       ├── name: string
│       ├── imageUrl: string
│       ├── linkUrl: string
│       └── isActive: boolean
│
└── branding/
    └── settings
        ├── desktopLogo: string
        └── mobileLogo: string
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

USER SIGNUP
───────────
User enters email/password
    │
    ▼
Click "Sign Up"
    │
    ▼
firebase.auth().createUserWithEmailAndPassword(email, password)
    │
    ▼
User created in Firebase Auth
    │
    ▼
Create user document in Firestore
    │
    ▼
Send verification email
    │
    ▼
User sees "Verify your email" banner


USER LOGIN
──────────
User enters email/password
    │
    ▼
Click "Log In"
    │
    ▼
firebase.auth().signInWithEmailAndPassword(email, password)
    │
    ▼
onAuthStateChanged() fires
    │
    ▼
Fetch user document from Firestore
    │
    ▼
Check if email verified
    │
    ▼
Check if user is admin (hardcoded: eyemac2@gmail.com)
    │
    ▼
Check if user is blocked
    │
    ▼
Set currentUser state
    │
    ▼
User logged in


EMAIL VERIFICATION
──────────────────
User clicks "Verify Email"
    │
    ▼
sendEmailVerification(auth.currentUser)
    │
    ▼
Verification email sent
    │
    ▼
User clicks link in email
    │
    ▼
Firebase marks email as verified
    │
    ▼
onAuthStateChanged() fires
    │
    ▼
Update user document: isVerified = true
    │
    ▼
User can now list boards
```

---

## 🔄 Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── Navigation
│   ├── Cart Button (with badge)
│   ├── Notifications Dropdown
│   └── User Menu
│
├── Main Content
│   ├── FilterPanel
│   │   ├── Brand Filter
│   │   ├── Fin System Filter
│   │   ├── Dimension Sliders
│   │   └── Save Search Button
│   │
│   └── BoardList
│       ├── BoardCard (repeated)
│       │   ├── Image
│       │   ├── Title
│       │   ├── Price
│       │   ├── Dimensions
│       │   ├── Favorite Button
│       │   └── Share Button
│       │
│       └── Ad (every 15 items)
│
├── Modals
│   ├── AuthModal
│   │   ├── LoginForm
│   │   └── SignupForm
│   │
│   ├── ListingForm
│   │   ├── Board Details
│   │   ├── Image Upload
│   │   ├── Pricing
│   │   └── Save/List Another/Pay
│   │
│   ├── PaymentModal
│   │   └── StripePaymentForm
│   │       ├── CardElement
│   │       ├── Error Display
│   │       └── Pay Button
│   │
│   ├── StagedBoardsCart
│   │   ├── Cart Items
│   │   ├── Remove Buttons
│   │   ├── Clear All Button
│   │   └── Proceed to Payment
│   │
│   ├── ListingDetail
│   │   ├── Images
│   │   ├── Details
│   │   ├── Seller Info
│   │   ├── Favorite Button
│   │   ├── Share Button
│   │   └── Contact Seller
│   │
│   ├── AdminPage
│   │   ├── User Management
│   │   ├── Listing Management
│   │   ├── Ad Management
│   │   └── Branding Settings
│   │
│   └── ... (other modals)
│
└── Footer
    ├── Links
    └── Social Media
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION DEPLOYMENT                                │
└─────────────────────────────────────────────────────────────────────────────┘

GITHUB REPOSITORY
    │
    ├─ main branch
    │
    ▼
VERCEL (Automatic Deployment)
    │
    ├─ Build: npm run build
    ├─ Output: dist/
    ├─ Framework: Vite
    │
    ├─ Frontend
    │   └─ https://yourdomain.vercel.app
    │
    └─ Serverless Functions
        ├─ /api/create-payment-intent
        ├─ /api/webhook
        ├─ /api/apply-discount
        └─ /api/contact


EXTERNAL SERVICES
    │
    ├─ Firebase
    │   ├─ Authentication
    │   ├─ Firestore Database
    │   └─ Cloud Storage
    │
    ├─ Stripe
    │   ├─ Payment Processing
    │   ├─ Webhook Events
    │   └─ Dashboard
    │
    └─ Email Service
        └─ Nodemailer (Gmail)


WEBHOOK FLOW
    │
    Stripe Event
        │
        ▼
    POST https://yourdomain.vercel.app/api/webhook
        │
        ▼
    Verify Signature
        │
        ▼
    Process Event
        │
        ▼
    Update Firestore
        │
        ▼
    Return 200 OK
```

---

## 📊 Data Flow

```
USER ACTION → COMPONENT → STATE → FIREBASE → COMPONENT UPDATE → UI RENDER

Example: Create Listing
──────────────────────

User fills form
    │
    ▼
ListingForm component
    │
    ▼
handleAddUsedBoard() in App.tsx
    │
    ▼
Create board object
    │
    ▼
setDoc(doc(db, "boards", boardId), boardData)
    │
    ▼
Firebase Firestore
    │
    ▼
onSnapshot listener fires
    │
    ▼
setBoards() updates state
    │
    ▼
filteredBoards computed
    │
    ▼
BoardList re-renders
    │
    ▼
New board appears in list
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 1: AUTHENTICATION
├─ Firebase Auth
├─ Email verification required
├─ Password hashing
└─ Session management

LAYER 2: AUTHORIZATION
├─ User role checking (admin/user)
├─ Ownership verification
├─ Firestore security rules
└─ Admin-only endpoints

LAYER 3: DATA PROTECTION
├─ HTTPS/TLS encryption
├─ Firebase security rules
├─ Storage rules
└─ Firestore rules

LAYER 4: PAYMENT SECURITY
├─ Stripe webhook signature verification
├─ Secret key on server only
├─ Publishable key on client
├─ PaymentIntent metadata tracking
└─ PCI compliance (Stripe handles)

LAYER 5: API SECURITY
├─ CORS headers
├─ Rate limiting (recommended)
├─ Input validation
└─ Error handling
```

---

## 📈 Scalability

```
CURRENT ARCHITECTURE
────────────────────
- Vercel serverless (auto-scales)
- Firestore (auto-scales)
- Firebase Storage (auto-scales)
- Stripe (handles payments)

BOTTLENECKS
───────────
- Firestore read/write limits
- Firebase Storage bandwidth
- Stripe API rate limits

OPTIMIZATION OPPORTUNITIES
──────────────────────────
- Add caching layer (Redis)
- Implement pagination
- Optimize images
- Add CDN for static assets
- Batch Firestore operations
```

