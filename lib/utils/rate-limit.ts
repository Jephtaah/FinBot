/**
 * Simple in-memory rate limiter for API endpoints
 * In production, consider using Redis or a more robust solution
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (identifier: string) => string
}

interface RateLimitEntry {
  requests: number
  resetTime: number
}

// In-memory store for rate limit data
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Rate limiting function
 * @param identifier - unique identifier (e.g., user ID, IP address)
 * @param config - rate limit configuration
 * @returns Promise<{success: boolean, limit: number, remaining: number, resetTime: number}>
 */
export async function rateLimit(
  identifier: string, 
  config: RateLimitConfig
): Promise<{
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}> {
  const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier
  const now = Date.now()
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    for (const [k, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
  }
  
  let entry = rateLimitStore.get(key)
  
  // If no entry exists or the window has expired, create a new one
  if (!entry || entry.resetTime < now) {
    entry = {
      requests: 0,
      resetTime: now + config.windowMs
    }
  }
  
  // Check if limit is exceeded
  if (entry.requests >= config.maxRequests) {
    rateLimitStore.set(key, entry)
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }
  }
  
  // Increment request count
  entry.requests += 1
  rateLimitStore.set(key, entry)
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.requests,
    resetTime: entry.resetTime
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  CHAT_API: {
    maxRequests: 10, // 10 requests per hour per user
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (userId: string) => `chat:${userId}`
  },
  CHAT_API_STRICT: {
    maxRequests: 10, // 10 requests per 5 minutes for heavy usage
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyGenerator: (userId: string) => `chat:strict:${userId}`
  },
  GENERAL_API: {
    maxRequests: 100, // 100 requests per hour
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  FILE_UPLOAD: {
    maxRequests: 20, // 20 file uploads per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (userId: string) => `upload:${userId}`
  }
} as const

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: Request, rateLimitResult: Awaited<ReturnType<typeof rateLimit>>) => Promise<Response>
) {
  return async (req: Request, identifier: string) => {
    const rateLimitResult = await rateLimit(identifier, config)
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          retryAfter: rateLimitResult.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        }
      )
    }
    
    return handler(req, rateLimitResult)
  }
}

/**
 * Validate message content for potential abuse
 */
export function validateChatMessage(content: string): { valid: boolean; reason?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, reason: 'Message content is required and must be a string' }
  }
  
  if (content.length > 4000) {
    return { valid: false, reason: 'Message is too long (maximum 4000 characters)' }
  }
  
  if (content.trim().length === 0) {
    return { valid: false, reason: 'Message cannot be empty' }
  }
  
  // Check for potential spam patterns
  const repeatedCharPattern = /(.)\1{20,}/
  if (repeatedCharPattern.test(content)) {
    return { valid: false, reason: 'Message contains excessive repeated characters' }
  }
  
  // Check for excessive capitalization (potential spam)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (content.length > 50 && capsRatio > 0.7) {
    return { valid: false, reason: 'Message contains excessive capitalization' }
  }
  
  return { valid: true }
}

/**
 * Validate messages array for chat API
 */
export function validateChatMessages(messages: any[]): { valid: boolean; reason?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, reason: 'Messages must be an array' }
  }
  
  if (messages.length === 0) {
    return { valid: false, reason: 'At least one message is required' }
  }
  
  if (messages.length > 50) {
    return { valid: false, reason: 'Too many messages in conversation (maximum 50)' }
  }
  
  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      return { valid: false, reason: 'Each message must be an object' }
    }
    
    if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
      return { valid: false, reason: 'Each message must have a valid role (user, assistant, or system)' }
    }
    
    if (!message.content) {
      return { valid: false, reason: 'Each message must have content' }
    }
    
    const contentValidation = validateChatMessage(message.content)
    if (!contentValidation.valid) {
      return contentValidation
    }
  }
  
  return { valid: true }
}