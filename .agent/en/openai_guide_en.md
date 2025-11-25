# OpenAI SDK Integration Guide

A comprehensive guide for integrating LLM capabilities using the OpenAI SDK with vendor flexibility.

---

## Table of Contents

1. [Overview](#overview)
2. [Account Setup](#account-setup)
3. [Installation](#installation)
4. [Environment Variables](#environment-variables)
5. [Client Configuration](#client-configuration)
6. [Chat Completions](#chat-completions)
7. [Streaming Responses](#streaming-responses)
8. [Function Calling / Tools](#function-calling--tools)
9. [Embeddings](#embeddings)
10. [Alternative Providers](#alternative-providers)
11. [Error Handling](#error-handling)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)
14. [References](#references)

---

## Overview

The OpenAI SDK provides a standardized interface for LLM interactions. Thanks to the `baseURL` configuration, you can use the same SDK with:

- **OpenAI** - GPT-4, GPT-3.5, etc.
- **Azure OpenAI** - Microsoft's hosted OpenAI
- **Local models** - Ollama, LM Studio, vLLM
- **Other providers** - Any OpenAI-compatible API

This guide emphasizes vendor flexibility to avoid lock-in.

---

## Account Setup

### OpenAI (Default Provider)

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click "Create new secret key"
5. Name your key (e.g., "My App Production")
6. Copy and save the key securely (shown only once)

### Billing Setup

1. Go to **Settings** → **Billing**
2. Add payment method
3. Set usage limits to control costs

---

## Installation

```bash
# npm
npm install openai

# pnpm
pnpm add openai

# yarn
yarn add openai

# bun
bun add openai
```

**TypeScript**: The SDK includes TypeScript definitions. Requires TypeScript >= 4.9.

---

## Environment Variables

Create or update `.env.local`:

```env
# Required
OPENAI_API_KEY=sk-your-api-key-here

# Optional: For alternative providers
OPENAI_BASE_URL=https://api.openai.com/v1

# Optional: Default model
OPENAI_MODEL=gpt-4o
```

> **Security**: Never expose `OPENAI_API_KEY` to the client. Always make API calls from server-side code.

---

## Client Configuration

### Basic Client

Create `lib/openai.ts`:

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // baseURL defaults to https://api.openai.com/v1
});
```

### Vendor-Flexible Client

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});
```

### With Custom Configuration

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  defaultHeaders: {
    "X-Custom-Header": "value",
  },
});
```

---

## Chat Completions

### Basic Usage

```typescript
import { openai } from "@/lib/openai";

async function chat(userMessage: string) {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return completion.choices[0].message.content;
}
```

### With Conversation History

```typescript
import OpenAI from "openai";

type Message = OpenAI.Chat.ChatCompletionMessageParam;

async function chatWithHistory(messages: Message[]) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return completion.choices[0].message;
}
```

### API Route Example

Create `app/api/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        ...messages,
      ],
    });

    return NextResponse.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
```

### Parameters Reference

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | string | Model ID (e.g., "gpt-4o", "gpt-3.5-turbo") |
| `messages` | array | Conversation messages |
| `temperature` | number | Randomness (0-2, default 1) |
| `max_tokens` | number | Maximum response length |
| `top_p` | number | Nucleus sampling (0-1) |
| `frequency_penalty` | number | Reduce repetition (-2 to 2) |
| `presence_penalty` | number | Encourage new topics (-2 to 2) |
| `stop` | string[] | Stop sequences |

---

## Streaming Responses

### Basic Streaming

```typescript
import { openai } from "@/lib/openai";

async function streamChat(userMessage: string) {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: userMessage }],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    process.stdout.write(content);
  }
}
```

### Streaming API Route

Create `app/api/chat/stream/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      ...messages,
    ],
    stream: true,
  });

  // Create a readable stream
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Client-Side Streaming

```tsx
"use client";

import { useState } from "react";

export function StreamingChat() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (message: string) => {
    setLoading(true);
    setResponse("");

    const res = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            const data = JSON.parse(line.slice(6));
            setResponse((prev) => prev + data.content);
          }
        }
      }
    }

    setLoading(false);
  };

  return (
    <div>
      <div>{response}</div>
      {loading && <span>Generating...</span>}
    </div>
  );
}
```

---

## Function Calling / Tools

### Define Tools

```typescript
import OpenAI from "openai";

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather in a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
          },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search for products in the catalog",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          category: {
            type: "string",
            description: "Product category",
          },
        },
        required: ["query"],
      },
    },
  },
];
```

### Use Tools in Chat

```typescript
async function chatWithTools(userMessage: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: userMessage }],
    tools,
    tool_choice: "auto", // or "none", or specific function
  });

  const message = completion.choices[0].message;

  // Check if model wants to call a function
  if (message.tool_calls) {
    const toolResults = await Promise.all(
      message.tool_calls.map(async (toolCall) => {
        const args = JSON.parse(toolCall.function.arguments);

        // Execute the function
        let result;
        if (toolCall.function.name === "get_weather") {
          result = await getWeather(args.location, args.unit);
        } else if (toolCall.function.name === "search_products") {
          result = await searchProducts(args.query, args.category);
        }

        return {
          tool_call_id: toolCall.id,
          role: "tool" as const,
          content: JSON.stringify(result),
        };
      })
    );

    // Continue conversation with tool results
    const followUp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: userMessage },
        message,
        ...toolResults,
      ],
    });

    return followUp.choices[0].message.content;
  }

  return message.content;
}

// Example function implementations
async function getWeather(location: string, unit?: string) {
  // Your weather API call here
  return { temperature: 72, condition: "sunny", location };
}

async function searchProducts(query: string, category?: string) {
  // Your product search here
  return [{ name: "Product 1", price: 29.99 }];
}
```

---

## Embeddings

### Generate Embeddings

```typescript
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small", // or "text-embedding-3-large"
    input: text,
  });

  return response.data[0].embedding;
}
```

### Batch Embeddings

```typescript
async function generateEmbeddings(texts: string[]) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}
```

### Embedding Models

| Model | Dimensions | Use Case |
|-------|------------|----------|
| `text-embedding-3-small` | 1536 | Cost-effective, general purpose |
| `text-embedding-3-large` | 3072 | Higher accuracy, more expensive |
| `text-embedding-ada-002` | 1536 | Legacy model |

---

## Alternative Providers

### Azure OpenAI

```env
OPENAI_API_KEY=your-azure-api-key
OPENAI_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment
```

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  defaultQuery: { "api-version": "2024-02-15-preview" },
  defaultHeaders: { "api-key": process.env.OPENAI_API_KEY },
});
```

### Ollama (Local)

```env
OPENAI_API_KEY=ollama  # Any non-empty value
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=llama3.2
```

```typescript
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "ollama",
  baseURL: process.env.OPENAI_BASE_URL || "http://localhost:11434/v1",
});

// Usage remains the same
const completion = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL || "llama3.2",
  messages: [{ role: "user", content: "Hello!" }],
});
```

### LM Studio (Local)

```env
OPENAI_API_KEY=lm-studio
OPENAI_BASE_URL=http://localhost:1234/v1
OPENAI_MODEL=local-model
```

### OpenRouter

```env
OPENAI_API_KEY=your-openrouter-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3-opus
```

### Provider-Agnostic Pattern

```typescript
// lib/openai.ts
import OpenAI from "openai";

export function createLLMClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
}

export const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
```

---

## Error Handling

### Error Types

```typescript
import OpenAI from "openai";

async function safeChat(message: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: message }],
    });
    return completion.choices[0].message.content;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("Status:", error.status);
      console.error("Message:", error.message);

      switch (error.status) {
        case 401:
          throw new Error("Invalid API key");
        case 429:
          throw new Error("Rate limit exceeded. Please try again later.");
        case 500:
          throw new Error("OpenAI server error. Please try again.");
        case 503:
          throw new Error("Service unavailable. Please try again later.");
        default:
          throw new Error(`API error: ${error.message}`);
      }
    }
    throw error;
  }
}
```

### Retry Logic

The SDK includes automatic retries. Configure with:

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3, // Default is 2
  timeout: 60000, // 60 seconds
});
```

---

## Best Practices

### 1. Environment-Based Configuration

```typescript
// Support different providers per environment
const config = {
  development: {
    baseURL: "http://localhost:11434/v1", // Ollama
    model: "llama3.2",
  },
  production: {
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o",
  },
};

const env = process.env.NODE_ENV || "development";
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || config[env].baseURL,
});
```

### 2. Cost Control

```typescript
// Track token usage
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: message }],
});

console.log("Tokens used:", {
  prompt: completion.usage?.prompt_tokens,
  completion: completion.usage?.completion_tokens,
  total: completion.usage?.total_tokens,
});
```

### 3. Rate Limiting

```typescript
// Simple rate limiter
const rateLimiter = {
  lastCall: 0,
  minInterval: 100, // ms between calls

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minInterval) {
      await new Promise((r) => setTimeout(r, this.minInterval - elapsed));
    }
    this.lastCall = Date.now();
  },
};

async function rateLimitedChat(message: string) {
  await rateLimiter.wait();
  return openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: message }],
  });
}
```

---

## Troubleshooting

### Common Errors

#### "Invalid API Key"

- Verify key starts with `sk-`
- Check for extra whitespace
- Ensure key hasn't been revoked

#### "Rate limit exceeded"

- Implement exponential backoff
- Use `maxRetries` configuration
- Consider upgrading API tier

#### "Context length exceeded"

- Reduce message history
- Use shorter system prompts
- Consider using a model with larger context

#### "Model not found"

- Verify model name is correct
- Check model availability in your region
- Ensure you have access to the model

### Debug Mode

```typescript
// Log all requests
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add request logging
openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "test" }],
}).then(console.log).catch(console.error);
```

---

## References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [OpenAI Cookbook](https://cookbook.openai.com)
- [API Reference](https://platform.openai.com/docs/api-reference)
- [Pricing](https://openai.com/pricing)
- [Ollama](https://ollama.ai) - Local LLM
- [LM Studio](https://lmstudio.ai) - Local LLM GUI
