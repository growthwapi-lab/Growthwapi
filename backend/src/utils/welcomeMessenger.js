const axios = require('axios');

/**
 * Send an automated WhatsApp welcome message to a newly registered user
 * via Growthwapi's official Meta WhatsApp Cloud API.
 * 
 * @param {string} phone - User's phone number
 * @param {string} name - User's name
 */
async function sendWelcomeWhatsAppMessage(phone, name = 'Founder') {
  if (!phone) return null;
  
  const cleanPhone = phone.toString().replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    console.warn('Cannot send WhatsApp welcome: WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN missing in ENV');
    return null;
  }

  const welcomeText = `Hi ${name || 'there'}! 🚀 Welcome to Growthwapi!

Aapka 7-Day VIP Free Trial active ho chuka hai!

Apna WhatsApp number connect karke pehla bulk broadcast 2 minute mein bhejne ke liye:
1️⃣ Dashboard open karein: https://www.growthwapi.in/dashboard
2️⃣ Upar orange "Connect Now" button pe click karein
3️⃣ Apna Business Name & Phone number enter karein
4️⃣ OTP verify karein — Done!

📺 Video Tutorial & Step-by-Step Guide:
https://www.growthwapi.in/dashboard/setup-guide

💡 Tip: Grand Launch Special coupon code *LAUNCH50* se aap kisi bhi plan par Flat 50% OFF lock kar sakte hain!

Agar kahin bhi help chahiye ho, toh aap directly is chat par reply kar sakte hain.
- Team Growthwapi 🏏`;

  try {
    const res = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { preview_url: true, body: welcomeText }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    console.log(`WhatsApp Welcome message sent successfully to ${formattedPhone}, message ID:`, res.data?.messages?.[0]?.id);
    return res.data;
  } catch (error) {
    console.error('Failed to send WhatsApp welcome message:', error.response?.data || error.message);
    return null;
  }
}

module.exports = { sendWelcomeWhatsAppMessage };
