# FinBot Rate Limiting Implementation Guide

*Last Updated: 2025-07-12*

## Overview

FinBot implements comprehensive rate limiting to protect against API abuse, ensure fair usage, and maintain system stability. This document outlines the rate limiting strategy, implementation details, and usage guidelines.

## Rate Limiting Strategy

### Design Principles

1. **Fair Usage**: Prevent individual users from consuming excessive resources
2. **API Protection**: Shield expensive operations (like AI chat) from abuse
3. **System Stability**: Maintain consistent performance under load
4. **User Experience**: Provide clear feedback when limits are reached
5. **Security**: Prevent DoS attacks and automated abuse

### Implementation Architecture

- **In-Memory Store**: Simple Map-based storage for development/small deployments
- **User-Based Limiting**: Rate limits applied per authenticated user ID
- **Endpoint-Specific Limits**: Different limits for different API endpoints
- **Graceful Degradation**: Clear error messages with retry information

## Current Rate Limits

### Chat API (`/api/chat`)

**Primary Limit:**
- **10 requests per hour** per user
- **Window**: 60 minutes rolling window
- **Scope**: Per authenticated user

**Use Case**: Prevents excessive AI API costs and ensures fair access to chat functionality.

```typescript
CHAT_API: {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (userId: string) => `chat:${userId}`
}
```

**User Experience**: When the limit is reached, users receive a Sonner toast notification explaining they have reached their 10 message per hour limit and should wait before sending more messages.

**Strict Limit (Available for Heavy Usage Detection):**
- **10 requests per 5 minutes** per user
- **Window**: 5 minutes rolling window
- **Purpose**: Detect and throttle rapid successive requests

```typescript
CHAT_API_STRICT: {
  maxRequests: 10,
  windowMs: 5 * 60 * 1000, // 5 minutes
  keyGenerator: (userId: string) => `chat:strict:${userId}`
}
```

### Other API Endpoints (Configurable)

**General API Limit:**
```typescript
GENERAL_API: {
  maxRequests: 100, // 100 requests per hour
  windowMs: 60 * 60 * 1000, // 1 hour
}
```

**File Upload Limit:**
```typescript
FILE_UPLOAD: {
  maxRequests: 20, // 20 file uploads per hour
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (userId: string) => `upload:${userId}`
}
```

## Implementation Details

### Core Rate Limiting Function

```typescript
export async function rateLimit(
  identifier: string, 
  config: RateLimitConfig
): Promise<{
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}>
```

### Rate Limit Response Headers

When rate limits are applied, the following HTTP headers are included:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 23
X-RateLimit-Reset: 1673567890000
Retry-After: 3600
```

### Error Response Format

When rate limit is exceeded (HTTP 429):

```json
{
  "error": "Rate limit exceeded. Please wait before sending more messages.",
  "limit": 50,
  "remaining": 0,
  "resetTime": 1673567890000,
  "retryAfter": 3600
}
```

## Message Validation

### Chat Message Validation

In addition to rate limiting, the chat API implements comprehensive message validation:

#### Content Validation
- **Maximum length**: 4,000 characters per message
- **Minimum length**: Non-empty after trimming
- **Character patterns**: Blocks excessive repeated characters (20+ in a row)
- **Spam detection**: Flags messages with >70% capitalization

#### Message Array Validation
- **Maximum messages**: 50 messages per conversation
- **Required fields**: Each message must have `role` and `content`
- **Valid roles**: `user`, `assistant`, `system` only

### Validation Examples

```typescript
// Valid message
{
  "role": "user",
  "content": "What's my spending this month?"
}

// Invalid - too long
{
  "role": "user", 
  "content": "a".repeat(4001) // Blocked
}

// Invalid - spam pattern
{
  "role": "user",
  "content": "AAAAAAAAAAAAAAAAAAAAAA" // Blocked
}
```

## Usage Examples

### Implementing Rate Limiting

```typescript
// Basic usage in API route
export async function POST(req: NextRequest) {
  const { user } = await authenticate(req)
  
  const rateLimitResult = await rateLimit(user.id, RATE_LIMITS.CHAT_API)
  
  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      }),
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
        }
      }
    )
  }
  
  // Process request...
}
```

### Using the Wrapper Function

```typescript
import { withRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit'

const handler = withRateLimit(
  RATE_LIMITS.CHAT_API,
  async (req, rateLimitResult) => {
    // Your API logic here
    // rateLimitResult contains limit information
    return new Response('Success')
  }
)

export const POST = (req: Request) => handler(req, userId)
```

## Client-Side Handling

### Recommended Client Implementation

```typescript
async function sendChatMessage(message: string) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: message }] })
    })
    
    if (response.status === 429) {
      const errorData = await response.json()
      const retryAfter = response.headers.get('Retry-After')
      
      // Show user-friendly message
      showRateLimitMessage(errorData.error, retryAfter)
      return
    }
    
    // Handle successful response
    return await response.json()
    
  } catch (error) {
    console.error('Chat API error:', error)
  }
}

function showRateLimitMessage(error: string, retryAfter: string) {
  const minutes = Math.ceil(parseInt(retryAfter) / 60)
  toast.error(`Rate limit exceeded. Please wait ${minutes} minutes before sending more messages.`)
}
```

### Rate Limit Information Display

```typescript
// Extract rate limit info from successful responses
const rateLimitInfo = {
  limit: parseInt(response.headers.get('X-RateLimit-Limit')),
  remaining: parseInt(response.headers.get('X-RateLimit-Remaining')),
  resetTime: parseInt(response.headers.get('X-RateLimit-Reset'))
}

// Show remaining requests to user
if (rateLimitInfo.remaining < 5) {
  showWarning(`Only ${rateLimitInfo.remaining} requests remaining this hour`)
}
```

## Configuration and Tuning

### Environment-Based Configuration

For production deployments, consider these adjustments:

```typescript
// Production settings (more restrictive)
const PRODUCTION_LIMITS = {
  CHAT_API: {
    maxRequests: 30, // Reduced for cost control
    windowMs: 60 * 60 * 1000
  }
}

// Development settings (more permissive)
const DEVELOPMENT_LIMITS = {
  CHAT_API: {
    maxRequests: 100, // Higher for testing
    windowMs: 60 * 60 * 1000
  }
}
```

### Custom Rate Limit Configurations

```typescript
// Create custom limits for specific endpoints
const CUSTOM_LIMITS = {
  ADMIN_API: {
    maxRequests: 200, // Higher limits for admin users
    windowMs: 60 * 60 * 1000,
    keyGenerator: (adminId: string) => `admin:${adminId}`
  },
  PUBLIC_API: {
    maxRequests: 10, // Very restrictive for public endpoints
    windowMs: 60 * 1000, // 1 minute window
  }
}
```

## Monitoring and Analytics

### Rate Limit Metrics

Track these metrics for system health:

- **Request volume** per endpoint per hour
- **Rate limit hit rate** (429 responses / total requests)
- **User distribution** (requests per user)
- **Peak usage times** and patterns

### Logging

Rate limit events are logged for monitoring:

```typescript
// Successful rate limit check
console.log('Rate limit check:', {
  userId: user.id,
  endpoint: '/api/chat',
  remaining: rateLimitResult.remaining,
  resetTime: rateLimitResult.resetTime
})

// Rate limit exceeded
console.log('Rate limit exceeded:', {
  userId: user.id,
  endpoint: '/api/chat',
  limit: rateLimitResult.limit,
  retryAfter: rateLimitResult.retryAfter
})
```

## Scaling Considerations

### Current Limitations

- **In-Memory Storage**: Limited to single server instance
- **No Persistence**: Rate limit counters reset on server restart
- **Memory Usage**: Grows with number of active users

### Production Recommendations

For production deployments at scale:

1. **Redis Integration**: Replace in-memory store with Redis
2. **Distributed Rate Limiting**: Use Redis for multi-server deployments
3. **Persistent Storage**: Maintain rate limit state across restarts
4. **Advanced Algorithms**: Consider token bucket or sliding window algorithms

### Redis Implementation Example

```typescript
// Example Redis-based rate limiter
export async function redisRateLimit(key: string, limit: number, window: number) {
  const client = redis.createClient()
  
  const current = await client.incr(key)
  
  if (current === 1) {
    await client.expire(key, window)
  }
  
  const ttl = await client.ttl(key)
  
  return {
    success: current <= limit,
    remaining: Math.max(0, limit - current),
    resetTime: Date.now() + (ttl * 1000)
  }
}
```

## Security Considerations

### Rate Limit Bypass Prevention

- **Authentication Required**: All rate limits are applied to authenticated users
- **User ID Based**: Cannot be bypassed by changing IP addresses
- **Server-Side Enforcement**: Rate limits are enforced server-side only

### Additional Security Measures

- **Message Content Validation**: Prevents spam and abuse
- **Request Size Limits**: Enforced at API gateway level
- **Authentication Rate Limiting**: Separate limits for login attempts

## Troubleshooting

### Common Issues

**Rate limit not working:**
- Check user authentication
- Verify rate limit configuration
- Check server logs for errors

**Users hitting limits too quickly:**
- Review limit settings for the use case
- Check for client-side retry loops
- Monitor for potential abuse

**Memory usage growing:**
- Implement periodic cleanup
- Consider moving to Redis
- Monitor rate limit store size

### Debug Tools

```typescript
// Rate limit store inspection
console.log('Current rate limit store:', rateLimitStore.size)

// User-specific rate limit status
const userKey = `chat:${userId}`
const userLimit = rateLimitStore.get(userKey)
console.log('User rate limit status:', userLimit)
```

## Future Enhancements

### Planned Improvements

1. **Dynamic Rate Limiting**: Adjust limits based on system load
2. **User Tier Support**: Different limits for premium vs free users
3. **Geographic Rate Limiting**: Region-specific limits
4. **Machine Learning**: Adaptive limits based on usage patterns

### API Extensions

```typescript
// Future: Per-user rate limit customization
interface UserRateLimit {
  userId: string
  customLimits: {
    chatApi: number
    fileUpload: number
  }
  tier: 'free' | 'premium' | 'enterprise'
}
```

---

## Summary

FinBot's rate limiting implementation provides:

- ✅ **Comprehensive Protection** against API abuse
- ✅ **Fair Usage** enforcement across all users  
- ✅ **Clear Communication** when limits are reached
- ✅ **Flexible Configuration** for different use cases
- ✅ **Security Integration** with authentication system

The system is designed to be both protective and user-friendly, ensuring system stability while providing clear feedback to users about their usage limits.

For questions or suggestions about rate limiting, please refer to the implementation in `/lib/utils/rate-limit.ts` or contact the development team.