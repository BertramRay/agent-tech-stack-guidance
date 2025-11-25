# Creem Payment Integration Guide

A comprehensive guide for integrating Creem payments into Next.js applications.

---

## Table of Contents

1. [Overview](#overview)
2. [Account Setup](#account-setup)
3. [Installation](#installation)
4. [Environment Variables](#environment-variables)
5. [Creating Products](#creating-products)
6. [Checkout Sessions](#checkout-sessions)
7. [Webhooks](#webhooks)
8. [Subscription Management](#subscription-management)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)
11. [References](#references)

---

## Overview

Creem is a developer-focused payment platform that provides simple APIs for handling:

- **One-time payments** - Single transaction purchases
- **Subscriptions** - Recurring billing
- **Checkout sessions** - Dynamic payment flows
- **Webhooks** - Real-time payment notifications

---

## Account Setup

### 1. Create Creem Account

1. Go to [https://creem.io](https://creem.io)
2. Click "Get Started" or "Sign Up"
3. Create your account

### 2. Create a Store

1. After login, create your first store
2. Configure store settings:
   - Store name
   - Currency
   - Payout settings

### 3. Get API Credentials

1. Go to **Dashboard** → **Developers** tab (top navbar)
2. Click the eye icon to reveal your API key
3. Copy and save the API key securely

### 4. Get Webhook Secret

1. Go to **Dashboard** → **Developers** → **Webhooks**
2. Create a new webhook endpoint
3. Copy the webhook secret for signature verification

---

## Installation

### Using the Next.js Adapter (Recommended)

```bash
# npm
npm install @creem_io/nextjs

# pnpm
pnpm add @creem_io/nextjs

# yarn
yarn add @creem_io/nextjs
```

### Using Direct API Calls

No package installation needed - use `fetch` or any HTTP client.

---

## Environment Variables

Create or update `.env.local`:

```env
# Required
CREEM_API_KEY=your-api-key

# For webhook verification
CREEM_WEBHOOK_SECRET=your-webhook-secret

# API Base URL (optional, defaults to production)
CREEM_API_URL=https://api.creem.io/v1
```

---

## Creating Products

### Via Dashboard

1. Go to **Dashboard** → **Products**
2. Click "Create Product"
3. Configure:
   - **Name**: Product display name
   - **Price**: Amount to charge
   - **Billing type**: One-time or Subscription
   - **Success URL**: Redirect after successful payment
4. Save and copy the **Product ID**

### Via API

```typescript
const response = await fetch("https://api.creem.io/v1/products", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.CREEM_API_KEY!,
  },
  body: JSON.stringify({
    name: "Pro Plan",
    price: 2999, // in cents ($29.99)
    currency: "usd",
    billing_type: "recurring", // or "one_time"
    billing_period: "monthly", // for recurring
  }),
});

const product = await response.json();
console.log("Product ID:", product.id);
```

### Get Product ID

1. Go to **Dashboard** → **Products**
2. Click the options menu (⋮) on your product
3. Select "Copy ID"

---

## Checkout Sessions

### Create Checkout Session (API Route)

Create `app/api/checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { productId, customerId, email } = await request.json();

    const response = await fetch("https://api.creem.io/v1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CREEM_API_KEY!,
      },
      body: JSON.stringify({
        product_id: productId,
        request_id: `order_${Date.now()}`, // Your internal reference
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
          customerId: customerId,
        },
        customer: {
          email: email, // Pre-fill customer email
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const session = await response.json();
    return NextResponse.json({ checkout_url: session.checkout_url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
```

### Checkout Button Component

```tsx
"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  productId: string;
  customerId: string;
  email: string;
}

export function CheckoutButton({ productId, customerId, email }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, customerId, email }),
      });

      const data = await response.json();

      if (data.checkout_url) {
        // Redirect to Creem checkout
        window.location.href = data.checkout_url;
      } else {
        console.error("Checkout failed:", data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? "Loading..." : "Subscribe Now"}
    </button>
  );
}
```

### Checkout Session Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_id` | string | Yes | Product identifier from dashboard |
| `request_id` | string | No | Your internal order/request ID |
| `success_url` | string | No | Override product's default success URL |
| `metadata` | object | No | Custom data attached to subscription |
| `customer.email` | string | No | Pre-fill customer email |
| `discount_code` | string | No | Pre-apply discount code |
| `units` | number | No | Quantity for seat-based pricing |

---

## Webhooks

### Create Webhook Endpoint

Create `app/api/webhooks/creem/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-creem-signature") || "";

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, process.env.CREEM_WEBHOOK_SECRET!)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(payload);

    // Handle different event types
    switch (event.type) {
      case "checkout.completed":
        await handleCheckoutCompleted(event.data);
        break;

      case "subscription.created":
        await handleSubscriptionCreated(event.data);
        break;

      case "subscription.updated":
        await handleSubscriptionUpdated(event.data);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(event.data);
        break;

      case "payment.succeeded":
        await handlePaymentSucceeded(event.data);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.data);
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(data: any) {
  const { request_id, customer, subscription_id, metadata } = data;
  console.log("Checkout completed:", {
    requestId: request_id,
    customerEmail: customer?.email,
    subscriptionId: subscription_id,
    customerId: metadata?.customerId,
  });

  // Update your database
  // await db.users.update({
  //   where: { id: metadata.customerId },
  //   data: { subscriptionId: subscription_id, plan: "pro" },
  // });
}

async function handleSubscriptionCreated(data: any) {
  console.log("Subscription created:", data.id);
}

async function handleSubscriptionUpdated(data: any) {
  console.log("Subscription updated:", data.id);
}

async function handleSubscriptionCanceled(data: any) {
  console.log("Subscription canceled:", data.id);
  // Update user's subscription status
}

async function handlePaymentSucceeded(data: any) {
  console.log("Payment succeeded:", data.id);
}

async function handlePaymentFailed(data: any) {
  console.log("Payment failed:", data.id);
  // Notify user or retry logic
}
```

### Configure Webhook in Dashboard

1. Go to **Dashboard** → **Developers** → **Webhooks**
2. Click "Add Webhook"
3. Enter:
   - **Name**: e.g., "Production Webhook"
   - **URL**: `https://yourdomain.com/api/webhooks/creem`
4. Select events to receive:
   - `checkout.completed`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `payment.succeeded`
   - `payment.failed`
5. Save and copy the webhook secret

### Webhook Events

| Event | Description |
|-------|-------------|
| `checkout.completed` | Customer completed checkout |
| `subscription.created` | New subscription started |
| `subscription.updated` | Subscription plan changed |
| `subscription.canceled` | Subscription canceled |
| `payment.succeeded` | Payment processed successfully |
| `payment.failed` | Payment failed |

---

## Subscription Management

### Get Subscription Details

```typescript
async function getSubscription(subscriptionId: string) {
  const response = await fetch(
    `https://api.creem.io/v1/subscriptions/${subscriptionId}`,
    {
      headers: {
        "x-api-key": process.env.CREEM_API_KEY!,
      },
    }
  );

  return response.json();
}
```

### Cancel Subscription

```typescript
async function cancelSubscription(subscriptionId: string) {
  const response = await fetch(
    `https://api.creem.io/v1/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        "x-api-key": process.env.CREEM_API_KEY!,
      },
    }
  );

  return response.json();
}
```

### Update Subscription

```typescript
async function updateSubscription(subscriptionId: string, newProductId: string) {
  const response = await fetch(
    `https://api.creem.io/v1/subscriptions/${subscriptionId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CREEM_API_KEY!,
      },
      body: JSON.stringify({
        product_id: newProductId,
      }),
    }
  );

  return response.json();
}
```

---

## API Reference

### Base URL

```
https://api.creem.io/v1
```

### Authentication

All requests require the `x-api-key` header:

```typescript
headers: {
  "x-api-key": "your-api-key",
  "Content-Type": "application/json",
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/checkouts` | Create checkout session |
| GET | `/checkouts/:id` | Get checkout session |
| POST | `/products` | Create product |
| GET | `/products` | List products |
| GET | `/products/:id` | Get product |
| GET | `/subscriptions/:id` | Get subscription |
| PATCH | `/subscriptions/:id` | Update subscription |
| POST | `/subscriptions/:id/cancel` | Cancel subscription |
| GET | `/customers/:id` | Get customer |

### Payment States

| State | Description |
|-------|-------------|
| `pending` | Payment initiated but not completed |
| `paid` | Payment successfully processed |
| `refunded` | Payment fully refunded |
| `partially_refunded` | Payment partially refunded |

---

## Success Page

Create `app/success/page.tsx`:

```tsx
import { redirect } from "next/navigation";

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/");
  }

  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold">Payment Successful!</h1>
      <p className="mt-4 text-gray-600">
        Thank you for your purchase. Your subscription is now active.
      </p>
      <a href="/dashboard" className="mt-8 inline-block text-blue-600">
        Go to Dashboard →
      </a>
    </div>
  );
}
```

---

## Troubleshooting

### Common Errors

#### "Invalid API Key"

- Verify API key is correct in environment variables
- Check for extra whitespace
- Ensure you're using the correct environment (test/live)

#### "Product not found"

- Verify product ID is correct
- Ensure product exists in dashboard
- Check product is active

#### "Webhook signature invalid"

- Verify webhook secret is correct
- Ensure you're reading the raw body, not parsed JSON
- Check signature header name: `x-creem-signature`

#### "Checkout session expired"

- Sessions expire after a set time
- Create a new session for the user

### Debug Tips

```typescript
// Log API responses for debugging
const response = await fetch("https://api.creem.io/v1/checkouts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.CREEM_API_KEY!,
  },
  body: JSON.stringify(checkoutData),
});

console.log("Status:", response.status);
console.log("Response:", await response.json());
```

---

## References

- [Creem Documentation](https://docs.creem.io)
- [Creem Dashboard](https://creem.io/dashboard)
- [Checkout Sessions](https://docs.creem.io/learn/checkout-session/introduction)
- [Webhooks Guide](https://docs.creem.io/integrations/webhooks)
- [API Reference](https://docs.creem.io/api-reference)
