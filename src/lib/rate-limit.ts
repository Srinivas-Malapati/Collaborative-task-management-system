type RateLimitRecord = {
    tokens: number;
    lastRefill: number;
};

const LIMIT = 20; // Max requests
const REFILL_RATE = 1000; // Refill 1 token per second (roughly)
const store = new Map<string, RateLimitRecord>();

export function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = store.get(ip) || { tokens: LIMIT, lastRefill: now };

    // Refill tokens based on time passed
    const elapsed = now - record.lastRefill;
    if (elapsed > REFILL_RATE) {
        const refillAmount = Math.floor(elapsed / REFILL_RATE);
        record.tokens = Math.min(LIMIT, record.tokens + refillAmount);
        record.lastRefill = now;
    }

    if (record.tokens > 0) {
        record.tokens--;
        store.set(ip, record);
        return true; // Allowed
    }

    return false; // Blocked
}
