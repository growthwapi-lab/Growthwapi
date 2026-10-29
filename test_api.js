const axios = require('axios');

async function sendWhatsAppMessage() {
  try {
    const response = await axios.post('http://localhost:5000/api/v1/messages/send', {
      to: '919876543210', // 👈 Put your WhatsApp phone number here (with 91 prefix)
      type: 'text',
      text: { body: 'Hello! Growthwapi API Automation Test Successful! 🚀' },
      messageCategory: 'utility'
    }, {
      headers: {
        'x-api-key': 'gw_live_c81a35a80e011b894042e8e4af816da178833ed9',
        'Content-Type': 'application/json'
      }
    });

    console.log('🎉 Message sent via Growthwapi API:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

sendWhatsAppMessage();
