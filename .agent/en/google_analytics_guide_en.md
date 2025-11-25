# Google Analytics 4 Integration Guide

A comprehensive guide for integrating Google Analytics 4 (GA4) into Next.js applications.

---

## Table of Contents

1. [Overview](#overview)
2. [Account Setup](#account-setup)
3. [Installation Methods](#installation-methods)
4. [Next.js Integration](#nextjs-integration)
5. [Environment Configuration](#environment-configuration)
6. [Page View Tracking](#page-view-tracking)
7. [Custom Event Tracking](#custom-event-tracking)
8. [E-commerce Tracking](#e-commerce-tracking)
9. [User Properties](#user-properties)
10. [Debug Mode](#debug-mode)
11. [Troubleshooting](#troubleshooting)
12. [References](#references)

---

## Overview

Google Analytics 4 (GA4) is Google's latest analytics platform, providing:

- **Event-based tracking** - All interactions as events
- **Cross-platform measurement** - Web and app in one property
- **Machine learning insights** - Predictive metrics
- **Privacy-centric design** - Cookieless measurement options

---

## Account Setup

### 1. Create Google Analytics Account

1. Go to [https://analytics.google.com](https://analytics.google.com)
2. Sign in with your Google account
3. Click "Start measuring" or "Create Account"
4. Enter account name (e.g., your company name)
5. Configure data sharing settings
6. Click "Next"

### 2. Create Property

1. Enter property name (e.g., "My Website")
2. Select reporting time zone
3. Select currency
4. Click "Next"

### 3. Configure Business Details

1. Select industry category
2. Select business size
3. Select how you intend to use Analytics
4. Click "Create"

### 4. Create Web Data Stream

1. Select "Web" platform
2. Enter your website URL
3. Enter stream name (e.g., "Production Website")
4. Enable Enhanced Measurement (recommended)
5. Click "Create stream"

### 5. Get Measurement ID

1. In the data stream details, find **Measurement ID**
2. Copy the ID (format: `G-XXXXXXXXXX`)
3. Save this for your environment variables

---

## Installation Methods

### Method 1: gtag.js (Recommended)

The standard Google Tag implementation using script tags.

### Method 2: Google Tag Manager

For advanced tag management needs.

### Method 3: @next/third-parties

Next.js official package for third-party integrations.

```bash
npm install @next/third-parties
```

---

## Next.js Integration

### Option A: Using Script Component (App Router)

Create `components/GoogleAnalytics.tsx`:

```tsx
"use client";

import Script from "next/script";

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
```

Add to `app/layout.tsx`:

```tsx
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics
            measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          />
        )}
      </body>
    </html>
  );
}
```

### Option B: Using @next/third-parties

```tsx
// app/layout.tsx
import { GoogleAnalytics } from "@next/third-parties/google";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
```

### Option C: Manual gtag in Head

For `app/layout.tsx`:

```tsx
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <head>
        {gaId && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script id="gtag-init">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Environment Configuration

Create or update `.env.local`:

```env
# Google Analytics Measurement ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

> **Note**: The `NEXT_PUBLIC_` prefix exposes this variable to the browser, which is required for client-side tracking.

### Environment-Based Configuration

```tsx
// Only enable in production
const GA_MEASUREMENT_ID = process.env.NODE_ENV === "production"
  ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  : undefined;
```

---

## Page View Tracking

### Automatic Page Views

GA4 automatically tracks page views with enhanced measurement enabled. No additional code needed for basic page tracking.

### Manual Page View Tracking (SPA)

For client-side navigation in Next.js App Router:

Create `components/GoogleAnalytics.tsx`:

```tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, Suspense } from "react";

interface GoogleAnalyticsProps {
  measurementId: string;
}

function AnalyticsPageView({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && window.gtag) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      window.gtag("config", measurementId, {
        page_path: url,
      });
    }
  }, [pathname, searchParams, measurementId]);

  return null;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsPageView measurementId={measurementId} />
      </Suspense>
    </>
  );
}
```

### TypeScript Declaration

Add to `types/gtag.d.ts`:

```typescript
interface Window {
  gtag: (
    command: "config" | "event" | "js" | "set",
    targetId: string | Date,
    config?: Record<string, any>
  ) => void;
  dataLayer: any[];
}
```

---

## Custom Event Tracking

### Event Helper Function

Create `lib/analytics.ts`:

```typescript
type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
};

export function trackEvent({ action, category, label, value, ...params }: GTagEvent) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
      ...params,
    });
  }
}

// Predefined event helpers
export const analytics = {
  // Button clicks
  buttonClick: (buttonName: string, location?: string) => {
    trackEvent({
      action: "button_click",
      category: "engagement",
      label: buttonName,
      button_location: location,
    });
  },

  // Form submissions
  formSubmit: (formName: string, success: boolean) => {
    trackEvent({
      action: "form_submit",
      category: "forms",
      label: formName,
      form_success: success,
    });
  },

  // Sign up
  signUp: (method: string) => {
    trackEvent({
      action: "sign_up",
      method: method,
    });
  },

  // Login
  login: (method: string) => {
    trackEvent({
      action: "login",
      method: method,
    });
  },

  // Search
  search: (searchTerm: string) => {
    trackEvent({
      action: "search",
      search_term: searchTerm,
    });
  },

  // Share
  share: (contentType: string, itemId: string, method?: string) => {
    trackEvent({
      action: "share",
      content_type: contentType,
      item_id: itemId,
      method: method,
    });
  },

  // Page scroll depth
  scrollDepth: (percentage: number) => {
    trackEvent({
      action: "scroll",
      category: "engagement",
      label: `${percentage}%`,
      value: percentage,
    });
  },
};
```

### Usage Examples

```tsx
"use client";

import { analytics } from "@/lib/analytics";

export function SignUpForm() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... form logic

    analytics.signUp("email");
    analytics.formSubmit("signup_form", true);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

```tsx
"use client";

import { analytics } from "@/lib/analytics";

export function CTAButton() {
  return (
    <button
      onClick={() => analytics.buttonClick("cta_hero", "homepage")}
    >
      Get Started
    </button>
  );
}
```

---

## E-commerce Tracking

### View Item

```typescript
export function trackViewItem(item: {
  item_id: string;
  item_name: string;
  price: number;
  currency?: string;
  item_category?: string;
}) {
  if (window.gtag) {
    window.gtag("event", "view_item", {
      currency: item.currency || "USD",
      value: item.price,
      items: [item],
    });
  }
}
```

### Add to Cart

```typescript
export function trackAddToCart(item: {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  currency?: string;
}) {
  if (window.gtag) {
    window.gtag("event", "add_to_cart", {
      currency: item.currency || "USD",
      value: item.price * item.quantity,
      items: [item],
    });
  }
}
```

### Begin Checkout

```typescript
export function trackBeginCheckout(items: any[], value: number, currency = "USD") {
  if (window.gtag) {
    window.gtag("event", "begin_checkout", {
      currency,
      value,
      items,
    });
  }
}
```

### Purchase

```typescript
export function trackPurchase(transaction: {
  transaction_id: string;
  value: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  items: any[];
}) {
  if (window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: transaction.transaction_id,
      value: transaction.value,
      currency: transaction.currency || "USD",
      tax: transaction.tax,
      shipping: transaction.shipping,
      items: transaction.items,
    });
  }
}
```

### Complete E-commerce Helper

```typescript
// lib/analytics-ecommerce.ts
export const ecommerce = {
  viewItem: (item: EcommerceItem) => {
    window.gtag?.("event", "view_item", {
      currency: "USD",
      value: item.price,
      items: [item],
    });
  },

  addToCart: (item: EcommerceItem, quantity: number) => {
    window.gtag?.("event", "add_to_cart", {
      currency: "USD",
      value: item.price * quantity,
      items: [{ ...item, quantity }],
    });
  },

  removeFromCart: (item: EcommerceItem, quantity: number) => {
    window.gtag?.("event", "remove_from_cart", {
      currency: "USD",
      value: item.price * quantity,
      items: [{ ...item, quantity }],
    });
  },

  viewCart: (items: EcommerceItem[], value: number) => {
    window.gtag?.("event", "view_cart", {
      currency: "USD",
      value,
      items,
    });
  },

  beginCheckout: (items: EcommerceItem[], value: number) => {
    window.gtag?.("event", "begin_checkout", {
      currency: "USD",
      value,
      items,
    });
  },

  purchase: (transactionId: string, items: EcommerceItem[], value: number) => {
    window.gtag?.("event", "purchase", {
      transaction_id: transactionId,
      currency: "USD",
      value,
      items,
    });
  },
};

interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_brand?: string;
}
```

---

## User Properties

### Set User ID

```typescript
export function setUserId(userId: string) {
  if (window.gtag) {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      user_id: userId,
    });
  }
}
```

### Set User Properties

```typescript
export function setUserProperties(properties: Record<string, any>) {
  if (window.gtag) {
    window.gtag("set", "user_properties", properties);
  }
}

// Example usage
setUserProperties({
  subscription_tier: "premium",
  account_type: "business",
  signup_date: "2024-01-15",
});
```

### On Authentication

```typescript
// Call after successful login
function onUserLogin(user: { id: string; plan: string }) {
  setUserId(user.id);
  setUserProperties({
    subscription_plan: user.plan,
  });
  analytics.login("email");
}
```

---

## Debug Mode

### Enable Debug Mode

Add `debug_mode` parameter:

```typescript
window.gtag("config", "G-XXXXXXXXXX", {
  debug_mode: true,
});
```

### Or via URL Parameter

Add `?debug_mode=true` to any page URL.

### Use DebugView

1. Go to Google Analytics
2. Navigate to **Admin** → **DebugView**
3. View real-time events from debug mode

### Browser Extensions

Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension for detailed console logs.

### Conditional Debug Mode

```tsx
// components/GoogleAnalytics.tsx
const isDebug = process.env.NODE_ENV === "development";

<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}'${isDebug ? ", { debug_mode: true }" : ""});
  `}
</Script>
```

---

## Consent Mode

### Basic Consent Implementation

```typescript
// Initialize with denied consent
window.gtag("consent", "default", {
  analytics_storage: "denied",
  ad_storage: "denied",
});

// Update when user grants consent
export function grantAnalyticsConsent() {
  window.gtag("consent", "update", {
    analytics_storage: "granted",
  });
}

export function grantAdConsent() {
  window.gtag("consent", "update", {
    ad_storage: "granted",
  });
}
```

### With Cookie Banner

```tsx
"use client";

import { useState, useEffect } from "react";
import { grantAnalyticsConsent } from "@/lib/analytics";

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("analytics_consent");
    if (!consent) {
      setShowBanner(true);
    } else if (consent === "granted") {
      grantAnalyticsConsent();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("analytics_consent", "granted");
    grantAnalyticsConsent();
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("analytics_consent", "denied");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4">
      <p>We use cookies to analyze site usage.</p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleDecline}>Decline</button>
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

#### Events not showing in reports

- Events may take 24-48 hours to appear in standard reports
- Use **Realtime** report for immediate verification
- Use **DebugView** for debugging

#### Page views not tracking

- Verify Measurement ID is correct
- Check script is loading (Network tab)
- Ensure `NEXT_PUBLIC_` prefix is used

#### SPA navigation not tracked

- Implement manual page view tracking (see above)
- Verify `usePathname` hook is working
- Check for hydration errors

#### Duplicate page views

- Remove duplicate gtag scripts
- Check for multiple GoogleAnalytics components

### Verification Steps

1. **Check script loading**:
   - Open DevTools → Network
   - Filter by "gtag" or "googletagmanager"
   - Verify scripts load with 200 status

2. **Check dataLayer**:
   - Open DevTools → Console
   - Type `dataLayer` and press Enter
   - Verify events are being pushed

3. **Use Tag Assistant**:
   - Visit [tagassistant.google.com](https://tagassistant.google.com)
   - Connect your website
   - Verify tags are detected

4. **Check Realtime Reports**:
   - Go to GA4 → Reports → Realtime
   - Verify users and events appear

---

## References

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [gtag.js Reference](https://developers.google.com/tag-platform/gtagjs)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [E-commerce Implementation](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [Next.js Third Parties](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries)
- [Tag Assistant](https://tagassistant.google.com)
- [GA4 DebugView](https://support.google.com/analytics/answer/7201382)
