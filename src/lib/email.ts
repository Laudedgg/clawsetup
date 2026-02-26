import { Resend } from 'resend';

const ADMIN_EMAILS = ['gptcharlesgpt@gmail.com', 'admin@clawsetup.xyz'];
const FROM = 'ClawSetup <bookings@clawsetup.xyz>';

export async function sendBookingNotificationToAdmin({
  userName,
  userEmail,
  scheduledAt,
  notes,
}: {
  userName?: string | null;
  userEmail: string;
  scheduledAt: Date;
  notes?: string | null;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const formattedDate = scheduledAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const formattedTime = scheduledAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });

  const notesRow = notes
    ? `<tr>
        <td style="padding:8px 0;color:#999;vertical-align:top;width:110px;">Notes</td>
        <td style="padding:8px 0;white-space:pre-wrap;">${notes}</td>
       </tr>`
    : '';

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0a0b10;color:#fff;border-radius:16px;">
  <div style="display:inline-block;background:linear-gradient(135deg,#ff4f5a,#ff8a5c);color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;margin-bottom:20px;">
    New Booking
  </div>
  <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;">📅 New call request</h2>
  <p style="margin:0 0 24px;color:#888;font-size:14px;">Someone has booked a call on ClawSetup.</p>

  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:#999;width:110px;">Name</td>
        <td style="padding:8px 0;font-weight:600;">${userName || 'Unknown'}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#999;">Email</td>
        <td style="padding:8px 0;"><a href="mailto:${userEmail}" style="color:#ff8a5c;">${userEmail}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#999;">Date</td>
        <td style="padding:8px 0;font-weight:600;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#999;">Time</td>
        <td style="padding:8px 0;">${formattedTime}</td>
      </tr>
      ${notesRow}
    </table>
  </div>

  <div style="margin-top:24px;">
    <a href="https://clawsetup.xyz/dashboard/admin" style="display:inline-block;background:linear-gradient(135deg,#ff4f5a,#ff8a5c);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">
      View in Admin Dashboard →
    </a>
  </div>

  <p style="margin-top:28px;font-size:12px;color:#444;">This is an automated notification from ClawSetup.</p>
</div>`;

  const result = await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAILS,
    subject: `New booking — ${formattedDate}`,
    html,
  });

  return result;
}

