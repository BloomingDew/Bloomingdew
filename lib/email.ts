import { Resend } from 'resend';

export function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  return new Resend(process.env.RESEND_API_KEY);
}

export const FROM_EMAIL = 'Bloomingdew <orders@bloomingdew.com>';

export function orderEmailBase(body: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#FAF7F4;">
      <div style="max-width:600px;margin:0 auto;padding:48px 24px;font-family:Helvetica,sans-serif;">

        <!-- Logo -->
        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:500;color:#2C2C2C;letter-spacing:0.08em;margin:0;">
            Bloomingdew
          </h1>
        </div>

        ${body}

        <!-- Footer -->
        <div style="text-align:center;border-top:1px solid #E8DDD3;padding-top:32px;margin-top:40px;">
          <p style="font-size:12px;font-weight:300;color:#9A8F87;line-height:1.7;margin:0;">
            Made with love.<br>
            <a href="https://bloomingdew.com" style="color:#C9A882;text-decoration:none;">bloomingdew.com</a>
            &nbsp;·&nbsp;
            <a href="mailto:hello@bloomingdew.com" style="color:#C9A882;text-decoration:none;">hello@bloomingdew.com</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}
