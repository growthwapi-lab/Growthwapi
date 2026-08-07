import { serve } from 'https://deno.land/x/sift@0.5.0/mod.ts';
import { Resend } from '@resend/resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

enum TemplateType {
  WHATSAPP_TRIAL = 'whatsapp_trial',
  COMBO_ACTIVATED = 'combo_activated',
  WEBSITE_UPDATE = 'website_update',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
}

type RequestBody = {
  email: string;
  template_type: keyof typeof TemplateType;
  data: Record<string, any>;
};

async function sendEmail(body: RequestBody) {
  const { email, template_type, data } = body;
  let subject = '';
  let html = '';
  switch (template_type) {
    case TemplateType.WHATSAPP_TRIAL:
      subject = 'Your 2-Day WhatsApp Trial is Live! 🚀';
      html = `<p>Hi there,</p>
<p>We’re excited to let you know that your 2‑Day WhatsApp Trial is now active. You can send up to <strong>50 messages</strong> during this period.</p>
<p>Visit your dashboard to start using it: <a href="${data.dashboard_url}">GrowthWapi Dashboard</a></p>
<p>Happy chatting!</p>`;
      break;
    case TemplateType.COMBO_ACTIVATED:
      subject = 'Welcome to GrowthWapi Combo! 🎉';
      html = `<p>Hi ${data.business_name},</p>
<p>Thank you for activating the <strong>${data.plan_name}</strong> Combo. You now have:</p>
<ul>
<li>${data.whatsapp_utility} utility WhatsApp messages</li>
<li>${data.whatsapp_marketing} marketing WhatsApp messages</li>
<li>${data.ai_minutes} AI Calling minutes</li>
</ul>
<p>Access your dashboard to manage everything: <a href="${data.dashboard_url}">GrowthWapi Dashboard</a></p>`;
      break;
    case TemplateType.WEBSITE_UPDATE:
      subject = `Your Website Project: ${data.stage}`;
      html = `<p>Hi ${data.business_name},</p>
<p>Your website project is now at the <strong>${data.stage}</strong> stage.</p>
<p>Check the latest status here: <a href="${data.dashboard_url}">GrowthWapi Dashboard</a></p>`;
      break;
    case TemplateType.PAYMENT_CONFIRMATION:
      subject = 'Payment Received ✅';
      html = `<p>Hi ${data.business_name},</p>
<p>We’ve received your payment of <strong>₹${data.amount}</strong>. Your subscription is now active until <strong>${data.end_date}</strong>.</p>
<p>View your subscription details: <a href="${data.dashboard_url}">GrowthWapi Dashboard</a></p>`;
      break;
    default:
      throw new Error('Unsupported template type');
  }

  const result = await resend.emails.send({
    from: 'GrowthWapi <noreply@resend.dev>',
    to: email,
    subject,
    html,
  });
  return result;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const body: RequestBody = await req.json();
    await sendEmail(body);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
