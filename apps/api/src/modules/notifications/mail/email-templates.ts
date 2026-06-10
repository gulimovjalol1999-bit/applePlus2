import { escapeHtml, sanitizeUrl } from '../../../common/utils/escape-html.util';

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f7;
  margin: 0;
  padding: 0;
`;

const CARD_STYLE = `
  max-width: 560px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 20px rgba(0,0,0,0.08);
`;

const HEADER = `
  <div style="background:#1d1d1f;padding:32px 40px;text-align:center;">
    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
      Apple<span style="color:#0071e3;">+</span>
    </span>
  </div>
`;

const FOOTER = `
  <div style="padding:24px 40px;text-align:center;border-top:1px solid #e8e8ed;">
    <p style="margin:0;font-size:12px;color:#86868b;">
      Apple Plus — Premium Electronics Store<br/>
      <a href="https://apple-plus.com/unsubscribe" style="color:#0071e3;text-decoration:none;">Unsubscribe</a>
    </p>
  </div>
`;

function wrap(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="${BASE_STYLE}">
      <div style="${CARD_STYLE}">
        ${HEADER}
        ${content}
        ${FOOTER}
      </div>
    </body>
    </html>
  `;
}

export function welcomeTemplate(firstName: string): string {
  const name = escapeHtml(firstName);
  return wrap(`
    <div style="padding:40px;">
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1d1d1f;">
        Welcome, ${name}!
      </h1>
      <p style="margin:0 0 24px;font-size:16px;color:#515154;line-height:1.6;">
        Your Apple Plus account has been created. You can now shop the latest Apple
        products with fast delivery and 2-year warranty coverage.
      </p>
      <a href="https://apple-plus.com/products"
         style="display:inline-block;background:#0071e3;color:#fff;font-size:14px;
                font-weight:600;padding:14px 32px;border-radius:980px;text-decoration:none;">
        Start Shopping
      </a>
      <p style="margin:32px 0 0;font-size:13px;color:#86868b;">
        If you didn't create this account, please ignore this email.
      </p>
    </div>
  `);
}

export function orderConfirmationTemplate(params: {
  firstName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  total: number;
  shippingAddress: string;
}): string {
  const firstName = escapeHtml(params.firstName);
  const orderNumber = escapeHtml(params.orderNumber);
  const shippingAddress = escapeHtml(params.shippingAddress);

  const rows = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;font-size:14px;color:#1d1d1f;border-bottom:1px solid #f0f0f0;">
          ${escapeHtml(item.name)}
        </td>
        <td style="padding:10px 0;font-size:14px;color:#515154;text-align:center;border-bottom:1px solid #f0f0f0;">
          ×${escapeHtml(item.quantity)}
        </td>
        <td style="padding:10px 0;font-size:14px;color:#1d1d1f;text-align:right;border-bottom:1px solid #f0f0f0;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `,
    )
    .join('');

  return wrap(`
    <div style="padding:40px;">
      <div style="display:inline-block;background:#e3f5e1;border-radius:8px;padding:6px 14px;
                  font-size:12px;font-weight:600;color:#1a7f37;margin-bottom:20px;">
        Order Confirmed
      </div>
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#1d1d1f;">
        Thank you, ${firstName}!
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#515154;">
        Order <strong>#${orderNumber}</strong> has been received and is being processed.
      </p>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;font-size:12px;color:#86868b;font-weight:600;
                       text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #e8e8ed;">
              Product
            </th>
            <th style="text-align:center;font-size:12px;color:#86868b;font-weight:600;
                       text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #e8e8ed;">
              Qty
            </th>
            <th style="text-align:right;font-size:12px;color:#86868b;font-weight:600;
                       text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #e8e8ed;">
              Price
            </th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top:14px;font-size:15px;color:#515154;font-weight:600;">
              Total
            </td>
            <td style="padding-top:14px;font-size:18px;color:#1d1d1f;font-weight:700;text-align:right;">
              $${params.total.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:28px;padding:16px 20px;background:#f5f5f7;border-radius:12px;">
        <p style="margin:0;font-size:12px;font-weight:600;color:#86868b;text-transform:uppercase;
                  letter-spacing:0.5px;">Shipping to</p>
        <p style="margin:4px 0 0;font-size:14px;color:#1d1d1f;">${shippingAddress}</p>
      </div>

      <a href="https://apple-plus.com/orders/${orderNumber}"
         style="display:inline-block;margin-top:28px;background:#0071e3;color:#fff;font-size:14px;
                font-weight:600;padding:14px 32px;border-radius:980px;text-decoration:none;">
        Track Your Order
      </a>
    </div>
  `);
}

export function orderStatusTemplate(params: {
  firstName: string;
  orderNumber: string;
  status: string;
  statusMessage: string;
}): string {
  const statusColors: Record<string, string> = {
    processing: '#0071e3',
    confirmed: '#1a7f37',
    shipping: '#7d4aff',
    delivered: '#1a7f37',
    cancelled: '#d93025',
    refunded: '#d93025',
  };

  const firstName = escapeHtml(params.firstName);
  const orderNumber = escapeHtml(params.orderNumber);
  const status = escapeHtml(params.status);
  const statusMessage = escapeHtml(params.statusMessage);
  const color = statusColors[params.status.toLowerCase()] ?? '#515154';

  return wrap(`
    <div style="padding:40px;">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1d1d1f;">
        Order Update
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#515154;">
        Hi ${firstName}, here's an update on your order <strong>#${orderNumber}</strong>.
      </p>
      <div style="padding:20px 24px;border-left:4px solid ${color};background:#f9f9fb;border-radius:0 12px 12px 0;">
        <p style="margin:0;font-size:13px;font-weight:600;color:${color};text-transform:uppercase;
                  letter-spacing:0.5px;">${status}</p>
        <p style="margin:6px 0 0;font-size:15px;color:#1d1d1f;">${statusMessage}</p>
      </div>
      <a href="https://apple-plus.com/orders/${orderNumber}"
         style="display:inline-block;margin-top:28px;background:#0071e3;color:#fff;font-size:14px;
                font-weight:600;padding:14px 32px;border-radius:980px;text-decoration:none;">
        View Order Details
      </a>
    </div>
  `);
}

export function passwordResetTemplate(params: {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): string {
  const firstName = escapeHtml(params.firstName);
  const resetUrl = sanitizeUrl(params.resetUrl);
  const minutes = Math.floor(params.expiresInMinutes);

  return wrap(`
    <div style="padding:40px;">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1d1d1f;">
        Reset Your Password
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#515154;line-height:1.6;">
        Hi ${firstName}, we received a request to reset the password for your Apple Plus account.
        Click the button below to choose a new password.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;background:#0071e3;color:#fff;font-size:14px;
                font-weight:600;padding:14px 32px;border-radius:980px;text-decoration:none;">
        Reset Password
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        This link expires in ${minutes} minutes.
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `);
}
