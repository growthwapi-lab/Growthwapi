const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { checkTrialCap } = require('../utils/trialLimits');

const router = express.Router();

const WA_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const WA_HEADERS = {
  Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// ==========================================
// 1. API KEYS MANAGEMENT (Authenticated Dashboard Routes)
// ==========================================

// GET List User API Keys
router.get('/keys', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist in Supabase yet, return empty list gracefully
      return res.json([]);
    }
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Generate New API Key
router.post('/keys', auth, async (req, res) => {
  const { name, permissions } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'API Key name is required.' });
  }

  try {
    const rawKey = `gw_live_${crypto.randomBytes(20).toString('hex')}`;
    const maskedKey = `${rawKey.substring(0, 12)}...${rawKey.substring(rawKey.length - 4)}`;

    const keyRecord = {
      user_id: req.user.id,
      name: name.trim(),
      key: rawKey,
      masked_key: maskedKey,
      permissions: permissions || ['send_message', 'broadcast', 'read'],
      last_used_at: null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .upsert(keyRecord)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('API key save warning (returning generated key):', error.message);
    }

    res.json({
      success: true,
      message: '🎉 API Key generated successfully! Save it now as it will not be shown again.',
      apiKey: rawKey,
      record: data || keyRecord
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Revoke/Delete API Key
router.delete('/keys/:id', auth, async (req, res) => {
  try {
    await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    res.json({ success: true, message: 'API Key revoked successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. WEBHOOK ENDPOINTS MANAGEMENT
// ==========================================

// GET List Webhook Endpoints
router.get('/webhooks', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('external_webhooks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.json([]);
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Add Webhook Endpoint
router.post('/webhooks', auth, async (req, res) => {
  const { name, target_url, events } = req.body;
  if (!target_url || !target_url.trim()) {
    return res.status(400).json({ error: 'Target webhook URL is required.' });
  }

  try {
    const secret = `whsec_${crypto.randomBytes(16).toString('hex')}`;
    const webhookRecord = {
      user_id: req.user.id,
      name: (name || 'Developer Webhook').trim(),
      target_url: target_url.trim(),
      secret,
      events: events || ['message.received', 'message.sent'],
      is_active: true,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('external_webhooks')
      .upsert(webhookRecord)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Webhook save warning:', error.message);
    }

    res.json({
      success: true,
      message: '🎉 Webhook endpoint created successfully!',
      webhook: data || webhookRecord
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Webhook Endpoint
router.delete('/webhooks/:id', auth, async (req, res) => {
  try {
    await supabaseAdmin
      .from('external_webhooks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    res.json({ success: true, message: 'Webhook endpoint removed.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. PUBLIC V1 DEVELOPER API ENDPOINTS
//    Authenticates via Header: `x-api-key: gw_live_...`
// ==========================================

// API Key Middleware
async function apiKeyAuth(req, res, next) {
  const apiKeyHeader = req.headers['x-api-key'] || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);

  if (!apiKeyHeader || !apiKeyHeader.startsWith('gw_live_')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid `x-api-key` header. Include `x-api-key: gw_live_...` in your request headers.'
    });
  }

  try {
    const { data: keyRecord } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('key', apiKeyHeader)
      .maybeSingle();

    if (!keyRecord) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or revoked Growthwapi API Key.' });
    }

    // Update last used timestamp
    await supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id);

    req.user = { id: keyRecord.user_id };
    req.apiKeyRecord = keyRecord;
    next();
  } catch (err) {
    console.error('API key auth error:', err);
    res.status(500).json({ error: 'Authentication error validating API key.' });
  }
}

// POST Public V1 Send Single Message / Template
router.post('/v1/messages/send', apiKeyAuth, async (req, res) => {
  const { to, type, template, text, messageCategory } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Recipient phone number `to` is required (e.g. "919876543210").' });
  }

  const category = messageCategory || 'utility';

  // Check trial cap / quota
  const capCheck = await checkTrialCap(req.user.id, category, 1);
  if (!capCheck.allowed) {
    return res.status(403).json({ error: capCheck.message });
  }

  try {
    let payload = {
      messaging_product: 'whatsapp',
      to: to.trim().replace(/[\+\s\-]/g, ''),
      type: type || (template ? 'template' : 'text')
    };

    if (payload.type === 'template') {
      payload.template = template;
    } else {
      payload.text = text;
    }

    const response = await axios.post(WA_URL, payload, { headers: WA_HEADERS });

    // Log message in database
    await supabaseAdmin.from('messages').insert({
      user_id: req.user.id,
      wa_account_id: process.env.WHATSAPP_WABA_ID,
      from_number: process.env.WHATSAPP_PHONE_NUMBER_ID,
      to_number: to,
      message_type: payload.type,
      direction: 'outbound',
      content: payload,
      billing_category: category,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Message sent successfully!',
      meta_response: response.data
    });
  } catch (error) {
    const errDetails = error.response?.data?.error?.message || error.message;
    console.error('Public API send message error:', error.response?.data || error.message);
    res.status(500).json({ error: `Failed to send WhatsApp message: ${errDetails}` });
  }
});

// GET Public V1 List Approved Templates
router.get('/v1/templates', apiKeyAuth, async (req, res) => {
  try {
    const { data: templates } = await supabaseAdmin
      .from('templates')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'APPROVED');

    res.json({
      success: true,
      count: (templates || []).length,
      templates: templates || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
