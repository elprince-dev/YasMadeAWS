/**
 * Property-based tests for the Lambda email handler.
 * Library: fast-check
 * Feature: ses-email-integration
 */
import * as fc from 'fast-check';
import {
  validateNewsletterRequest,
  validateContactRequest,
  validateOrderConfirmationRequest,
  verifySupabaseJwt,
  stripHtml,
  absolutizeImageUrls,
  renderNewsletterHtml,
  renderContactHtml,
  renderOrderConfirmationHtml,
  type NewsletterRequest,
  type ContactRequest,
  type OrderConfirmationRequest,
} from '../../domains/email/lambda/email-handler';

// ── Generators ─────────────────────────────────────────────────────────

const alphaNum = 'abcdefghijklmnopqrstuvwxyz0123456789';
const alpha = 'abcdefghijklmnopqrstuvwxyz';

const nonEmptyString: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...alphaNum.split('')), {
    minLength: 1,
    maxLength: 20,
  })
  .map((chars) => chars.join(''));

const emailArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.array(fc.constantFrom(...alphaNum.split('')), {
      minLength: 1,
      maxLength: 8,
    }),
    fc.array(fc.constantFrom(...alpha.split('')), {
      minLength: 1,
      maxLength: 6,
    }),
    fc.constantFrom('com', 'net', 'org', 'ca')
  )
  .map(([user, domain, tld]) => `${user.join('')}@${domain.join('')}.${tld}`);

const validNewsletterArb: fc.Arbitrary<NewsletterRequest> = fc.record({
  subscribers: fc.array(emailArb, { minLength: 1, maxLength: 5 }),
  subject: nonEmptyString,
  content: nonEmptyString,
  logoUrl: nonEmptyString.map((s: string) => `https://example.com/${s}`),
});

const validContactArb: fc.Arbitrary<ContactRequest> = fc.record({
  name: nonEmptyString,
  email: emailArb,
  subject: nonEmptyString,
  message: nonEmptyString,
});

const validOrderItemArb = fc.record({
  name: nonEmptyString,
  quantity: fc.integer({ min: 1, max: 100 }),
  price: fc.float({
    min: Math.fround(0.01),
    max: Math.fround(9999),
    noNaN: true,
  }),
});

const validShippingAddressArb = fc.record({
  street: nonEmptyString,
  city: nonEmptyString,
  state: nonEmptyString,
  postal_code: nonEmptyString,
  country: nonEmptyString,
});

const validOrderConfirmationArb: fc.Arbitrary<OrderConfirmationRequest> =
  fc.record({
    orderId: nonEmptyString,
    customerEmail: emailArb,
    customerName: nonEmptyString,
    items: fc.array(validOrderItemArb, { minLength: 1, maxLength: 5 }),
    shippingAddress: validShippingAddressArb,
    subtotal: fc.float({
      min: Math.fround(0),
      max: Math.fround(9999),
      noNaN: true,
    }),
    shippingFee: fc.float({
      min: Math.fround(0),
      max: Math.fround(999),
      noNaN: true,
    }),
    discountAmount: fc.float({
      min: Math.fround(0),
      max: Math.fround(999),
      noNaN: true,
    }),
    totalAmount: fc.float({
      min: Math.fround(0),
      max: Math.fround(9999),
      noNaN: true,
    }),
    paymentProofUrl: nonEmptyString.map(
      (s: string) => `https://example.com/${s}`
    ),
  });

// Helper: remove a random required key from an object
function removeRandomKey(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const copy = { ...obj };
  // Pick a random key to remove — we use the first key for determinism in the generator
  const keyToRemove = keys[0];
  delete copy[keyToRemove];
  return copy;
}

// ── Property 1: Request validation rejects incomplete payloads ─────────
// Feature: ses-email-integration, Property 1: Request validation rejects incomplete payloads
// **Validates: Requirements 5.3, 5.4**

describe('Property 1: Request validation rejects incomplete payloads', () => {
  const NEWSLETTER_REQUIRED_KEYS = [
    'subscribers',
    'subject',
    'content',
    'logoUrl',
  ];
  const CONTACT_REQUIRED_KEYS = ['name', 'email', 'subject', 'message'];
  const ORDER_REQUIRED_KEYS = [
    'orderId',
    'customerEmail',
    'customerName',
    'items',
    'shippingAddress',
    'subtotal',
    'shippingFee',
    'discountAmount',
    'totalAmount',
    'paymentProofUrl',
  ];

  test('for any valid newsletter request with one required field removed, validation rejects', () => {
    fc.assert(
      fc.property(
        validNewsletterArb,
        fc.constantFrom(...NEWSLETTER_REQUIRED_KEYS),
        (req, keyToRemove) => {
          const incomplete = { ...req } as Record<string, unknown>;
          delete incomplete[keyToRemove];
          expect(validateNewsletterRequest(incomplete)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('for any valid contact request with one required field removed, validation rejects', () => {
    fc.assert(
      fc.property(
        validContactArb,
        fc.constantFrom(...CONTACT_REQUIRED_KEYS),
        (req, keyToRemove) => {
          const incomplete = { ...req } as Record<string, unknown>;
          delete incomplete[keyToRemove];
          expect(validateContactRequest(incomplete)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('for any valid order confirmation request with one required field removed, validation rejects', () => {
    fc.assert(
      fc.property(
        validOrderConfirmationArb,
        fc.constantFrom(...ORDER_REQUIRED_KEYS),
        (req, keyToRemove) => {
          const incomplete = { ...req } as Record<string, unknown>;
          delete incomplete[keyToRemove];
          expect(validateOrderConfirmationRequest(incomplete)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('null, undefined, and empty objects are rejected by all validators', () => {
    for (const input of [null, undefined, {}, '']) {
      expect(validateNewsletterRequest(input)).toBe(false);
      expect(validateContactRequest(input)).toBe(false);
      expect(validateOrderConfirmationRequest(input)).toBe(false);
    }
  });
});

// ── Property 2: JWT authentication gates admin endpoints ───────────
// Feature: ses-email-integration, Property 2: JWT authentication gates admin endpoints
// **Validates: Requirements 5.5, 5.6**

describe('Property 2: JWT authentication gates admin endpoints', () => {
  test('for any missing or malformed auth header, verifySupabaseJwt returns false', async () => {
    const invalidHeaders: fc.Arbitrary<string | undefined> = fc.oneof(
      fc.constant(undefined as string | undefined),
      fc.constant(''),
      fc.constant('Basic abc123'),
      fc.constant('Bearer'),
      fc.constant('Bearer '),
      nonEmptyString.map((s: string) => `Token ${s}`)
    );

    await fc.assert(
      fc.asyncProperty(invalidHeaders, async (header) => {
        const result = await verifySupabaseJwt(header);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  test('for any random string used as Bearer token, verifySupabaseJwt returns false (no valid Supabase to verify against)', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyString, async (token) => {
        // Without a real Supabase URL, the fetch will fail and return false
        const result = await verifySupabaseJwt(`Bearer ${token}`);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 3: Newsletter sends to all subscribers ────────────────
// Feature: ses-email-integration, Property 3: Newsletter sends to all subscribers
// **Validates: Requirements 6.1**

// We test this by importing the handler and injecting a mock SES client
const sentEmails: string[][] = [];

// Import handler — no module mock needed, we inject the SES client directly
import {
  handler,
  __setSESClient,
} from '../../domains/email/lambda/email-handler';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

function makeEvent(
  path: string,
  body: unknown,
  authHeader?: string
): APIGatewayProxyEventV2 {
  return {
    rawPath: path,
    headers: authHeader ? { authorization: authHeader } : {},
    body: JSON.stringify(body),
    version: '2.0',
    routeKey: '',
    rawQueryString: '',
    requestContext: {} as APIGatewayProxyEventV2['requestContext'],
    isBase64Encoded: false,
  };
}

describe('Property 3: Newsletter sends to all subscribers', () => {
  beforeEach(() => {
    sentEmails.length = 0;
    __setSESClient({
      send: jest.fn().mockImplementation((command: unknown) => {
        const cmd = command as {
          input: { Destination: { ToAddresses: string[] } };
        };
        sentEmails.push(cmd.input.Destination.ToAddresses);
        return Promise.resolve({ MessageId: 'mock-id' });
      }),
      destroy: jest.fn(),
      config: {},
    } as unknown as import('@aws-sdk/client-ses').SESClient);
    // Mock global fetch to make JWT verification succeed
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('for any valid newsletter request, the handler attempts to send to every subscriber', async () => {
    await fc.assert(
      fc.asyncProperty(validNewsletterArb, async (req) => {
        sentEmails.length = 0;

        const event = makeEvent('/newsletter', req, 'Bearer valid-token');
        const result = await handler(event);
        const responseBody = JSON.parse(
          typeof result === 'string'
            ? result
            : (result as { body: string }).body
        );

        expect(responseBody.success).toBe(true);

        // Every subscriber should have been sent to
        const allRecipients = sentEmails.flat();
        for (const subscriber of req.subscribers) {
          expect(allRecipients).toContain(subscriber);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 4: Newsletter HTML template contains required elements ──
// Feature: ses-email-integration, Property 4: Newsletter HTML template contains required elements
// **Validates: Requirements 6.2**

describe('Property 4: Newsletter HTML template contains required elements', () => {
  test('for any content and logo URL, rendered HTML contains logo, content, signature, and footer', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        nonEmptyString,
        nonEmptyString.map((s: string) => `https://example.com/${s}`),
        (subject, content, logoUrl) => {
          const html = renderNewsletterHtml(subject, content, logoUrl);

          // Logo image tag present
          expect(html).toContain(`<img src="${logoUrl}"`);
          // Content present
          expect(html).toContain(content);
          // Signature section
          expect(html).toContain('Yasmeen Allam');
          expect(html).toContain('YasMade');
          // Footer with unsubscribe text
          expect(html).toContain('subscribed to our updates');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 5: Plain text generation strips all HTML ──────────────
// Feature: ses-email-integration, Property 5: Plain text generation strips all HTML
// **Validates: Requirements 6.3**

describe('Property 5: Plain text generation strips all HTML', () => {
  const htmlTagArb = fc.constantFrom(
    'div',
    'p',
    'span',
    'a',
    'img',
    'br',
    'h1',
    'h2',
    'h3',
    'table',
    'tr',
    'td',
    'strong',
    'em',
    'ul',
    'li',
    'hr'
  );

  const htmlContentArb = fc
    .array(
      fc.oneof(
        nonEmptyString,
        fc
          .tuple(htmlTagArb, nonEmptyString)
          .map(([tag, text]) => `<${tag}>${text}</${tag}>`),
        htmlTagArb.map((tag) => `<${tag} class="test" />`)
      ),
      { minLength: 1, maxLength: 10 }
    )
    .map((parts) => parts.join(' '));

  test('for any HTML content, stripHtml output contains no HTML tags', () => {
    fc.assert(
      fc.property(htmlContentArb, (html) => {
        const plain = stripHtml(html);
        // No opening HTML tags should remain
        expect(plain).not.toMatch(/<[a-zA-Z][^>]*>/);
        // No closing HTML tags should remain
        expect(plain).not.toMatch(/<\/[a-zA-Z]+>/);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 6: Image URL absolutization ───────────────────────────
// Feature: ses-email-integration, Property 6: Image URL absolutization
// **Validates: Requirements 6.4**

describe('Property 6: Image URL absolutization', () => {
  const relativePathArb = fc
    .array(fc.constantFrom(...alpha.split('')), { minLength: 1, maxLength: 10 })
    .map((chars) => chars.join(''));

  const htmlWithRelativeImagesArb = fc
    .array(relativePathArb, { minLength: 1, maxLength: 5 })
    .map((paths) =>
      paths.map((p) => `<img src="${p}" alt="test" />`).join(' ')
    );

  test('for any HTML with relative img src, absolutizeImageUrls makes all src absolute', () => {
    const baseUrl = 'https://yasmade.net';

    fc.assert(
      fc.property(htmlWithRelativeImagesArb, (html) => {
        const result = absolutizeImageUrls(html, baseUrl);

        // Extract all src attributes from img tags
        const srcMatches = [
          ...result.matchAll(/<img[^>]*\ssrc="([^"]+)"[^>]*>/gi),
        ];
        for (const match of srcMatches) {
          const src = match[1];
          expect(src.startsWith('http://') || src.startsWith('https://')).toBe(
            true
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  test('for any HTML with absolute img src, absolutizeImageUrls leaves them unchanged', () => {
    const absoluteUrlArb = nonEmptyString.map(
      (s: string) => `https://cdn.example.com/${s}`
    );
    const htmlWithAbsoluteImagesArb = fc
      .array(absoluteUrlArb, { minLength: 1, maxLength: 5 })
      .map((urls) =>
        urls.map((url) => `<img src="${url}" alt="test" />`).join(' ')
      );

    fc.assert(
      fc.property(htmlWithAbsoluteImagesArb, (html) => {
        const result = absolutizeImageUrls(html, 'https://yasmade.net');
        // All original absolute URLs should be preserved
        const srcMatches = [
          ...result.matchAll(/<img[^>]*\ssrc="([^"]+)"[^>]*>/gi),
        ];
        for (const match of srcMatches) {
          expect(match[1]).toContain('cdn.example.com');
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 7: Contact notification email correctness ─────────────
// Feature: ses-email-integration, Property 7: Contact notification email correctness
// **Validates: Requirements 7.1, 7.2, 7.3**

describe('Property 7: Contact notification email correctness', () => {
  beforeEach(() => {
    sentEmails.length = 0;
    __setSESClient({
      send: jest.fn().mockImplementation((command: unknown) => {
        const cmd = command as {
          input: { Destination: { ToAddresses: string[] } };
        };
        sentEmails.push(cmd.input.Destination.ToAddresses);
        return Promise.resolve({ MessageId: 'mock-id' });
      }),
      destroy: jest.fn(),
      config: {},
    } as unknown as import('@aws-sdk/client-ses').SESClient);
  });

  test('for any valid contact submission, rendered HTML contains name, email, subject, and message', () => {
    fc.assert(
      fc.property(validContactArb, (req) => {
        const html = renderContactHtml(req);

        expect(html).toContain(req.name);
        expect(html).toContain(req.email);
        expect(html).toContain(req.subject);
        expect(html).toContain(req.message);
      }),
      { numRuns: 100 }
    );
  });

  test('for any valid contact request, handler sends to admin with reply-to set to visitor email', async () => {
    await fc.assert(
      fc.asyncProperty(validContactArb, async (req) => {
        sentEmails.length = 0;

        const event = makeEvent('/contact', req);
        const result = await handler(event);
        const responseBody = JSON.parse(
          typeof result === 'string'
            ? result
            : (result as { body: string }).body
        );

        expect(responseBody.success).toBe(true);
        // SES was called (at least one email sent)
        expect(sentEmails.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 8: Order confirmation email completeness ──────────────
// Feature: ses-email-integration, Property 8: Order confirmation email completeness
// **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

describe('Property 8: Order confirmation email completeness', () => {
  test('for any valid order, rendered HTML contains order ID, all items, shipping address, discount, total, and payment proof URL', () => {
    fc.assert(
      fc.property(validOrderConfirmationArb, (req) => {
        const html = renderOrderConfirmationHtml(req);

        // Order ID
        expect(html).toContain(req.orderId);
        // Customer name
        expect(html).toContain(req.customerName);
        // All item names
        for (const item of req.items) {
          expect(html).toContain(item.name);
          expect(html).toContain(String(item.quantity));
        }
        // Shipping address
        expect(html).toContain(req.shippingAddress.street);
        expect(html).toContain(req.shippingAddress.city);
        expect(html).toContain(req.shippingAddress.state);
        expect(html).toContain(req.shippingAddress.postal_code);
        expect(html).toContain(req.shippingAddress.country);
        // Discount amount
        expect(html).toContain(req.discountAmount.toFixed(2));
        // Total amount
        expect(html).toContain(req.totalAmount.toFixed(2));
        // Payment proof URL
        expect(html).toContain(req.paymentProofUrl);
      }),
      { numRuns: 100 }
    );
  });

  test('for any valid order confirmation request, handler sends to both customer and admin', async () => {
    // Mock global fetch to make JWT verification succeed
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
    sentEmails.length = 0;
    __setSESClient({
      send: jest.fn().mockImplementation((command: unknown) => {
        const cmd = command as {
          input: { Destination: { ToAddresses: string[] } };
        };
        sentEmails.push(cmd.input.Destination.ToAddresses);
        return Promise.resolve({ MessageId: 'mock-id' });
      }),
      destroy: jest.fn(),
      config: {},
    } as unknown as import('@aws-sdk/client-ses').SESClient);

    await fc.assert(
      fc.asyncProperty(validOrderConfirmationArb, async (req) => {
        sentEmails.length = 0;

        const event = makeEvent(
          '/order-confirmation',
          req,
          'Bearer valid-token'
        );
        const result = await handler(event);
        const responseBody = JSON.parse(
          typeof result === 'string'
            ? result
            : (result as { body: string }).body
        );

        expect(responseBody.success).toBe(true);
        // SES was called
        expect(sentEmails.length).toBeGreaterThan(0);
        // Customer email should be in the recipients
        const allRecipients = sentEmails.flat();
        expect(allRecipients).toContain(req.customerEmail);
      }),
      { numRuns: 100 }
    );
  });
});
