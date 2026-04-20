import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

// ── Types ──────────────────────────────────────────────────────────────

export interface NewsletterRequest {
  subscribers: string[];
  subject: string;
  content: string;
  logoUrl: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface OrderConfirmationRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentProofUrl: string;
}

export interface EmailApiResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  failedRecipients?: string[];
}

// ── Environment ────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const DOMAIN_NAME = process.env.DOMAIN_NAME ?? '';
const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const FROM_ADDRESS = `YasMade <no-reply@${DOMAIN_NAME}>`;

let ses = new SESClient({});

/** @internal Test-only: replace the SES client instance */
export function __setSESClient(client: SESClient): void {
  ses = client;
}

// ── Validation helpers ─────────────────────────────────────────────────

export function validateNewsletterRequest(
  body: unknown
): body is NewsletterRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.subscribers) &&
    b.subscribers.length > 0 &&
    b.subscribers.every(
      (s: unknown) => typeof s === 'string' && s.length > 0
    ) &&
    typeof b.subject === 'string' &&
    b.subject.trim().length > 0 &&
    typeof b.content === 'string' &&
    b.content.trim().length > 0 &&
    typeof b.logoUrl === 'string' &&
    b.logoUrl.trim().length > 0
  );
}

export function validateContactRequest(body: unknown): body is ContactRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === 'string' &&
    b.name.trim().length > 0 &&
    typeof b.email === 'string' &&
    b.email.trim().length > 0 &&
    typeof b.subject === 'string' &&
    b.subject.trim().length > 0 &&
    typeof b.message === 'string' &&
    b.message.trim().length > 0
  );
}

export function validateOrderConfirmationRequest(
  body: unknown
): body is OrderConfirmationRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (
    typeof b.orderId !== 'string' ||
    b.orderId.trim().length === 0 ||
    typeof b.customerEmail !== 'string' ||
    b.customerEmail.trim().length === 0 ||
    typeof b.customerName !== 'string' ||
    b.customerName.trim().length === 0 ||
    !Array.isArray(b.items) ||
    b.items.length === 0 ||
    typeof b.subtotal !== 'number' ||
    typeof b.shippingFee !== 'number' ||
    typeof b.discountAmount !== 'number' ||
    typeof b.totalAmount !== 'number' ||
    typeof b.paymentProofUrl !== 'string' ||
    b.paymentProofUrl.trim().length === 0
  )
    return false;

  const addr = b.shippingAddress;
  if (!addr || typeof addr !== 'object') return false;
  const a = addr as Record<string, unknown>;
  if (
    typeof a.street !== 'string' ||
    a.street.trim().length === 0 ||
    typeof a.city !== 'string' ||
    a.city.trim().length === 0 ||
    typeof a.state !== 'string' ||
    a.state.trim().length === 0 ||
    typeof a.postal_code !== 'string' ||
    a.postal_code.trim().length === 0 ||
    typeof a.country !== 'string' ||
    a.country.trim().length === 0
  )
    return false;

  return (b.items as unknown[]).every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    const i = item as Record<string, unknown>;
    return (
      typeof i.name === 'string' &&
      i.name.trim().length > 0 &&
      typeof i.quantity === 'number' &&
      i.quantity > 0 &&
      typeof i.price === 'number'
    );
  });
}

// ── JWT validation ─────────────────────────────────────────────────────

export async function verifySupabaseJwt(
  authHeader: string | undefined
): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  if (!token) return false;

  try {
    // Decode the JWT payload (base64url) and verify via Supabase's /auth/v1/user
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ── HTML / text helpers ────────────────────────────────────────────────

/** Strip HTML tags to produce a plain text version */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convert relative image src URLs to absolute using the domain */
export function absolutizeImageUrls(html: string, baseUrl: string): string {
  return html.replace(
    /(<img[^>]*\ssrc=")([^"]+)("[^>]*>)/gi,
    (_match, before: string, src: string, after: string) => {
      if (src.startsWith('http://') || src.startsWith('https://')) {
        return `${before}${src}${after}`;
      }
      const absolute = src.startsWith('/')
        ? `${baseUrl}${src}`
        : `${baseUrl}/${src}`;
      return `${before}${absolute}${after}`;
    }
  );
}

// ── Newsletter template ────────────────────────────────────────────────

export function renderNewsletterHtml(
  subject: string,
  content: string,
  logoUrl: string
): string {
  const processedContent = absolutizeImageUrls(
    content,
    `https://${DOMAIN_NAME}`
  );
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa;">
  <center style="width: 100%; background-color: #f8f9fa; padding: 20px 0;">
    <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-family: Arial, sans-serif; margin: 0 auto;">
      <tr>
        <td align="center" style="padding: 10px;">
          <img src="${logoUrl}" alt="YasMade Logo" style="width: 170px; height: auto; display: block;" />
        </td>
      </tr>
      <tr>
        <td style="padding: 0px 24px 5px; color: #333; font-size: 15px; line-height: 1.5;">
          ${processedContent}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 24px 0; color: #333; font-size: 14px;">
          <p style="margin: 20px 0 4px;">Best regards,</p>
          <p style="font-weight: bold; margin: 0;">Yasmeen Allam</p>
          <p style="margin: 0;">Founder, YasMade</p>
          <p style="margin: 0;"><a href="https://${DOMAIN_NAME}" style="color: #007BFF; text-decoration: none;">${DOMAIN_NAME}</a></p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; font-size: 11px; color: #777; text-align: center;">
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="margin: 0;">You received this email because you subscribed to our updates.</p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

// ── Contact notification template ──────────────────────────────────────

export function renderContactHtml(req: ContactRequest): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
  <h2 style="color: #333;">New Contact Form Submission</h2>
  <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
    <tr><td style="font-weight: bold; border-bottom: 1px solid #eee;">Name</td><td style="border-bottom: 1px solid #eee;">${req.name}</td></tr>
    <tr><td style="font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="border-bottom: 1px solid #eee;">${req.email}</td></tr>
    <tr><td style="font-weight: bold; border-bottom: 1px solid #eee;">Subject</td><td style="border-bottom: 1px solid #eee;">${req.subject}</td></tr>
  </table>
  <h3 style="margin-top: 20px;">Message</h3>
  <p style="white-space: pre-wrap;">${req.message}</p>
</body>
</html>`;
}

// ── Order confirmation template ────────────────────────────────────────

export function renderOrderConfirmationHtml(
  req: OrderConfirmationRequest
): string {
  const itemRows = req.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${
            item.name
          }</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${
            item.quantity
          }</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(
            2
          )}</td>
        </tr>`
    )
    .join('');

  const addr = req.shippingAddress;
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
  <h2>Order Confirmation — #${req.orderId}</h2>
  <p>Hi ${req.customerName},</p>
  <p>Thank you for your order! Here are your order details:</p>

  <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 16px 0;">
    <thead>
      <tr style="background-color: #f8f9fa;">
        <th style="padding: 8px; text-align: left;">Item</th>
        <th style="padding: 8px; text-align: center;">Qty</th>
        <th style="padding: 8px; text-align: right;">Price</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table cellpadding="4" cellspacing="0" style="width: 100%; max-width: 600px;">
    <tr><td>Subtotal</td><td style="text-align: right;">$${req.subtotal.toFixed(
      2
    )}</td></tr>
    <tr><td>Shipping</td><td style="text-align: right;">$${req.shippingFee.toFixed(
      2
    )}</td></tr>
    <tr><td>Discount</td><td style="text-align: right;">-$${req.discountAmount.toFixed(
      2
    )}</td></tr>
    <tr style="font-weight: bold; font-size: 16px;"><td>Total</td><td style="text-align: right;">$${req.totalAmount.toFixed(
      2
    )} CAD</td></tr>
  </table>

  <h3 style="margin-top: 24px;">Shipping Address</h3>
  <p>${addr.street}<br/>${addr.city}, ${addr.state} ${addr.postal_code}<br/>${
    addr.country
  }</p>

  <h3>Payment Instructions</h3>
  <p>Please send an Interac e-Transfer for <strong>$${req.totalAmount.toFixed(
    2
  )} CAD</strong> to complete your order.</p>
  <p>After sending the e-Transfer, please upload your proof of payment here:<br/>
    <a href="${req.paymentProofUrl}" style="color: #007BFF;">${
    req.paymentProofUrl
  }</a>
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="font-size: 12px; color: #777;">This is an automated message from YasMade. If you have questions, reply to this email.</p>
</body>
</html>`;
}

// ── SES sending helpers ────────────────────────────────────────────────

async function sendEmail(
  to: string[],
  subject: string,
  htmlBody: string,
  replyTo?: string[]
): Promise<string | undefined> {
  const command = new SendEmailCommand({
    Source: FROM_ADDRESS,
    Destination: { ToAddresses: to },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: htmlBody, Charset: 'UTF-8' },
        Text: { Data: stripHtml(htmlBody), Charset: 'UTF-8' },
      },
    },
    ReplyToAddresses: replyTo,
  });
  const result = await ses.send(command);
  return result.MessageId;
}

// ── Route handlers ─────────────────────────────────────────────────────

async function handleNewsletter(
  body: unknown,
  authHeader: string | undefined
): Promise<APIGatewayProxyResultV2> {
  const authenticated = await verifySupabaseJwt(authHeader);
  if (!authenticated) {
    return jsonResponse(401, { success: false, error: 'Unauthorized' });
  }

  if (!validateNewsletterRequest(body)) {
    return jsonResponse(400, {
      success: false,
      error:
        'Invalid request: requires subscribers[], subject, content, and logoUrl',
    });
  }

  const html = renderNewsletterHtml(body.subject, body.content, body.logoUrl);
  const failedRecipients: string[] = [];

  for (const subscriber of body.subscribers) {
    try {
      await sendEmail([subscriber], body.subject, html);
    } catch {
      failedRecipients.push(subscriber);
    }
  }

  const response: EmailApiResponse = { success: true };
  if (failedRecipients.length > 0) {
    response.failedRecipients = failedRecipients;
  }
  return jsonResponse(200, response as unknown as Record<string, unknown>);
}

async function handleContact(body: unknown): Promise<APIGatewayProxyResultV2> {
  if (!validateContactRequest(body)) {
    return jsonResponse(400, {
      success: false,
      error: 'Invalid request: requires name, email, subject, and message',
    });
  }

  const html = renderContactHtml(body);
  const messageId = await sendEmail(
    [ADMIN_EMAIL],
    `Contact Form: ${body.subject}`,
    html,
    [body.email]
  );

  return jsonResponse(200, { success: true, messageId });
}

async function handleOrderConfirmation(
  body: unknown,
  authHeader: string | undefined
): Promise<APIGatewayProxyResultV2> {
  const authenticated = await verifySupabaseJwt(authHeader);
  if (!authenticated) {
    return jsonResponse(401, { success: false, error: 'Unauthorized' });
  }

  if (!validateOrderConfirmationRequest(body)) {
    return jsonResponse(400, {
      success: false,
      error:
        'Invalid request: requires orderId, customerEmail, customerName, items[], shippingAddress, subtotal, shippingFee, discountAmount, totalAmount, and paymentProofUrl',
    });
  }

  const html = renderOrderConfirmationHtml(body);
  const messageId = await sendEmail(
    [body.customerEmail, ADMIN_EMAIL],
    `YasMade Order Confirmation — #${body.orderId}`,
    html
  );

  return jsonResponse(200, { success: true, messageId });
}

// ── Response helper ────────────────────────────────────────────────────

function jsonResponse(
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── Lambda entry point ─────────────────────────────────────────────────

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const path = event.rawPath ?? '';
    const authHeader =
      event.headers?.authorization ?? event.headers?.Authorization;

    let body: unknown;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      return jsonResponse(400, { success: false, error: 'Invalid JSON body' });
    }

    if (path.endsWith('/newsletter')) {
      return await handleNewsletter(body, authHeader);
    }
    if (path.endsWith('/contact')) {
      return await handleContact(body);
    }
    if (path.endsWith('/order-confirmation')) {
      return await handleOrderConfirmation(body, authHeader);
    }

    return jsonResponse(404, { success: false, error: 'Not found' });
  } catch (err) {
    console.error('Unhandled error:', err);
    return jsonResponse(500, {
      success: false,
      error: 'Internal server error',
    });
  }
}
