const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const trialCheck = require('../middleware/trialCheck');
const { supabaseAdmin } = require('../config/supabase');
const { handleIncomingAiReply } = require('../utils/aiAutoReply');

const router = express.Router();

// Helper to resolve WhatsApp credentials for a given user
async function getUserWhatsAppConfig(userId, userEmail) {
  const { data: userProfile } = await supabaseAdmin
    .from('users')
    .select('whatsapp_phone_number_id, whatsapp_waba_id, email')
    .eq('id', userId)
    .maybeSingle();

  const phoneId = userProfile?.whatsapp_phone_number_id;
  const wabaId = userProfile?.whatsapp_waba_id;
  const email = (userProfile?.email || userEmail || '').toLowerCase();

  // 1. If user has connected their own WhatsApp Business account
  if (phoneId) {
    return {
      phoneId,
      wabaId: wabaId || process.env.WHATSAPP_WABA_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      isConnected: true,
    };
  }

  // 2. Fallback ONLY for system admin (sauravrai8757@gmail.com)
  if (email === 'sauravrai8757@gmail.com' && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return {
      phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      wabaId: process.env.WHATSAPP_WABA_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      isConnected: true,
      isAdminDefault: true,
    };
  }

  // 3. User has NOT connected WhatsApp
  return {
    phoneId: null,
    wabaId: null,
    accessToken: null,
    isConnected: false,
  };
}

// Send single message
router.post('/send', auth, trialCheck, async (req, res) => {
  const { to, type, template, text } = req.body;
  const user = req.user;

  try {
    const waConfig = await getUserWhatsAppConfig(user.id, user.email);
    if (!waConfig.isConnected) {
      return res.status(400).json({
        error: 'Please connect your WhatsApp Business account first from the Dashboard or Settings to send messages.'
      });
    }

    const waUrl = `https://graph.facebook.com/v18.0/${waConfig.phoneId}/messages`;
    const waHeaders = {
      Authorization: `Bearer ${waConfig.accessToken}`,
      'Content-Type': 'application/json',
    };

    let data = {
      messaging_product: 'whatsapp',
      to: to,
      type: type,
    };

    if (type === 'template') {
      data.template = template;
    } else if (type === 'text') {
      data.text = text;
    }

    const response = await axios.post(waUrl, data, { headers: waHeaders });

    // Store in DB
    await supabaseAdmin.from('messages').insert({
      user_id: user.id,
      wa_account_id: waConfig.wabaId,
      from_number: waConfig.phoneId,
      to_number: to,
      message_type: type,
      direction: 'outbound',
      content: data,
      billing_category: req.body.messageCategory || 'utility',
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Send message error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || 'Failed to send message' });
  }
});

// Broadcast (Supports free-text and template broadcasts)
router.post('/broadcast', auth, trialCheck, async (req, res) => {
  const { numbers, type, template, text, name, useTemplate, templateName, languageCode, components } = req.body;

  const waConfig = await getUserWhatsAppConfig(req.user.id, req.user.email);
  if (!waConfig.isConnected) {
    return res.status(400).json({
      error: 'Please connect your WhatsApp Business account first from Dashboard or Settings before sending broadcasts.'
    });
  }

  const waUrl = `https://graph.facebook.com/v18.0/${waConfig.phoneId}/messages`;
  const waHeaders = {
    Authorization: `Bearer ${waConfig.accessToken}`,
    'Content-Type': 'application/json',
  };

  const results = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const to of numbers) {
    try {
      let data = {
        messaging_product: 'whatsapp',
        to: to,
      };

      if (useTemplate || type === 'template') {
        data.type = 'template';
        data.template = template || {
          name: templateName,
          language: { code: languageCode || 'en_US' },
          ...(components && components.length > 0 ? { components } : {})
        };
      } else {
        data.type = 'text';
        data.text = text;
      }

      const response = await axios.post(waUrl, data, { headers: waHeaders });

      await supabaseAdmin.from('messages').insert({
        user_id: req.user.id,
        wa_account_id: waConfig.wabaId,
        from_number: waConfig.phoneId,
        to_number: to,
        message_type: data.type,
        direction: 'outbound',
        content: data,
        billing_category: req.body.messageCategory || 'utility',
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      results.push({ number: to, success: true, data: response.data });
      sentCount++;
    } catch (error) {
      results.push({ number: to, success: false, error: error.response?.data || error.message });
      failedCount++;
    }
  }

  // Save campaign to broadcasts table
  try {
    await supabaseAdmin.from('broadcasts').insert({
      user_id: req.user.id,
      name: name || `Broadcast - ${new Date().toLocaleDateString()}`,
      message_text: useTemplate ? `Template: ${templateName}` : (typeof text === 'string' ? text : (text?.body || 'Template message')),
      message_type: req.body.messageCategory || 'utility',
      recipient_count: numbers.length,
      sent_count: sentCount,
      failed_count: failedCount,
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to log broadcast record:', err.message);
  }

  res.json({ results, sentCount, failedCount });
});

// GET user broadcasts
router.get('/broadcasts', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('broadcasts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// TEMPLATE MANAGEMENT ENDPOINTS
// ==========================================

// Helper to parse Meta template components into local format
function parseMetaComponents(components) {
  let header_type = 'none';
  let header_content = null;
  let body_text = '';
  let footer_text = null;
  let buttons = [];

  if (Array.isArray(components)) {
    for (const comp of components) {
      if (comp.type === 'HEADER') {
        header_type = (comp.format || 'text').toLowerCase();
        header_content = comp.text || comp.url || null;
      } else if (comp.type === 'BODY') {
        body_text = comp.text || '';
      } else if (comp.type === 'FOOTER') {
        footer_text = comp.text || null;
      } else if (comp.type === 'BUTTONS' && Array.isArray(comp.buttons)) {
        buttons = comp.buttons;
      }
    }
  }

  return { header_type, header_content, body_text, footer_text, buttons };
}

// 1. GET User Templates from DB
router.get('/templates', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('templates')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist yet in Supabase, return empty array gracefully
      return res.json([]);
    }
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. CREATE Template and Submit to Meta Graph API
router.post('/templates', auth, async (req, res) => {
  const { name, category, language, header_type, header_content, body_text, footer_text, buttons } = req.body;

  if (!name || !category || !body_text) {
    return res.status(400).json({ error: 'Template name, category, and body text are required.' });
  }

  // Validate name format: lowercase letters, numbers, underscores only
  const formattedName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!/^[a-z0-9_]+$/.test(formattedName)) {
    return res.status(400).json({ error: 'Template name can only contain lowercase letters, numbers, and underscores.' });
  }

  try {
    const waConfig = await getUserWhatsAppConfig(req.user.id, req.user.email);
    if (!waConfig.isConnected || !waConfig.wabaId) {
      return res.status(400).json({ error: 'Please connect your WhatsApp Business Account (WABA) before creating templates.' });
    }
    const wabaId = waConfig.wabaId;
    const metaUrl = `https://graph.facebook.com/v20.0/${wabaId}/message_templates`;

    // Construct Meta components array
    const components = [];

    // Header
    if (header_type && header_type !== 'none') {
      if (header_type === 'text') {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: header_content || ''
        });
      } else {
        const sampleMediaUrl = header_content || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809';
        components.push({
          type: 'HEADER',
          format: header_type.toUpperCase(), // IMAGE, VIDEO, DOCUMENT
          example: {
            header_handle: [sampleMediaUrl]
          }
        });
      }
    }

    // Body
    components.push({
      type: 'BODY',
      text: body_text
    });

    // Footer
    if (footer_text && footer_text.trim()) {
      components.push({
        type: 'FOOTER',
        text: footer_text.trim()
      });
    }

    // Buttons
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      const formattedButtons = buttons.map(b => {
        if (b.type === 'QUICK_REPLY') {
          return { type: 'QUICK_REPLY', text: b.text };
        } else if (b.type === 'URL') {
          return { type: 'URL', text: b.text, url: b.url };
        } else if (b.type === 'PHONE_NUMBER') {
          return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phone_number };
        }
        return b;
      });
      components.push({
        type: 'BUTTONS',
        buttons: formattedButtons
      });
    }

    const payload = {
      name: formattedName,
      category: category.toUpperCase(),
      language: language || 'en_US',
      components: components
    };

    // Call Meta API
    const metaRes = await axios.post(metaUrl, payload, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const metaTemplateId = metaRes.data.id;
    const metaStatus = metaRes.data.status || 'PENDING';

    // Store or Upsert into Supabase templates table
    const templateRecord = {
      user_id: req.user.id,
      name: formattedName,
      category: category.toUpperCase(),
      language: language || 'en_US',
      header_type: header_type || 'none',
      header_content: header_content || null,
      body_text,
      footer_text: footer_text || null,
      buttons: buttons || [],
      meta_template_id: metaTemplateId,
      status: metaStatus,
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: savedTemplate, error: dbError } = await supabaseAdmin
      .from('templates')
      .upsert(templateRecord, { onConflict: 'user_id, name' })
      .select()
      .maybeSingle();

    if (dbError) {
      console.warn('Database save warning (template submitted to Meta):', dbError.message);
    }

    res.json({
      success: true,
      message: '🎉 Template submitted to Meta for approval!',
      template: savedTemplate || templateRecord
    });
  } catch (error) {
    const metaErr = error.response?.data?.error?.message || error.message;
    console.error('Create template Meta error:', error.response?.data || error.message);
    res.status(400).json({ error: `Meta Error: ${metaErr}` });
  }
});

// 3. SYNC / IMPORT Templates from Meta WABA
router.post('/templates/sync', auth, async (req, res) => {
  try {
    const waConfig = await getUserWhatsAppConfig(req.user.id, req.user.email);
    if (!waConfig.isConnected || !waConfig.wabaId) {
      return res.status(400).json({ error: 'Please connect your WhatsApp Business Account (WABA) before syncing templates.' });
    }
    const wabaId = waConfig.wabaId;
    const metaUrl = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?limit=100`;

    const metaRes = await axios.get(metaUrl, {
      headers: { Authorization: `Bearer ${waConfig.accessToken}` }
    });

    const metaTemplates = metaRes.data?.data || [];
    const syncedTemplates = [];

    for (const item of metaTemplates) {
      const { header_type, header_content, body_text, footer_text, buttons } = parseMetaComponents(item.components);

      const record = {
        user_id: req.user.id,
        name: item.name,
        category: (item.category || 'MARKETING').toUpperCase(),
        language: item.language || 'en_US',
        header_type,
        header_content,
        body_text: body_text || `Template: ${item.name}`,
        footer_text,
        buttons,
        meta_template_id: item.id,
        status: item.status || 'APPROVED',
        rejection_reason: item.rejected_reason || null,
        updated_at: new Date().toISOString()
      };

      const { data: upserted } = await supabaseAdmin
        .from('templates')
        .upsert(record, { onConflict: 'user_id, name' })
        .select()
        .maybeSingle();

      syncedTemplates.push(upserted || record);
    }

    res.json({
      success: true,
      count: syncedTemplates.length,
      templates: syncedTemplates
    });
  } catch (error) {
    console.error('Sync templates error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || 'Failed to sync templates from Meta WABA.' });
  }
});

// 4. DELETE Template from Meta & DB
router.delete('/templates/:name', auth, async (req, res) => {
  const templateName = req.params.name;
  try {
    const waConfig = await getUserWhatsAppConfig(req.user.id, req.user.email);
    const wabaId = waConfig.wabaId || process.env.WHATSAPP_WABA_ID;
    const metaUrl = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?name=${templateName}`;

    try {
      await axios.delete(metaUrl, {
        headers: { Authorization: `Bearer ${waConfig.accessToken || process.env.WHATSAPP_ACCESS_TOKEN}` }
      });
    } catch (metaErr) {
      console.warn('Meta delete warning:', metaErr.response?.data || metaErr.message);
    }

    await supabaseAdmin
      .from('templates')
      .delete()
      .eq('user_id', req.user.id)
      .eq('name', templateName);

    res.json({ success: true, message: 'Template deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receive incoming messages & Template Status Webhooks
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    if (body.object) {
      if (body.entry && body.entry[0].changes && body.entry[0].changes[0]) {
        const change = body.entry[0].changes[0];
        const value = change.value;

        // Handle Template Status Update Webhook
        if (change.field === 'message_template_status_update' || value.event) {
          const statusMap = {
            APPROVED: 'APPROVED',
            REJECTED: 'REJECTED',
            PENDING: 'PENDING',
            PAUSED: 'PAUSED',
            DISABLED: 'REJECTED'
          };
          const newStatus = statusMap[value.event || value.status] || value.event || 'APPROVED';
          await supabaseAdmin
            .from('templates')
            .update({
              status: newStatus,
              rejection_reason: value.reason || null,
              updated_at: new Date().toISOString()
            })
            .or(`meta_template_id.eq.${value.message_template_id},name.eq.${value.message_template_name}`);
        }

        // Handle incoming messages
        if (value.messages && value.messages[0]) {
          const message = value.messages[0];
          const toNumber = value.metadata ? value.metadata.display_phone_number : 'unknown';
          const metaPhoneId = value.metadata ? value.metadata.phone_number_id : null;

          // Find the exact user who owns this phone_number_id
          let matchedUser = null;
          if (metaPhoneId) {
            const { data: userByPhone } = await supabaseAdmin
              .from('users')
              .select('id, whatsapp_phone_number_id, whatsapp_waba_id')
              .eq('whatsapp_phone_number_id', metaPhoneId)
              .maybeSingle();
            matchedUser = userByPhone;
          }

          // Fallback to admin if metaPhoneId matches default ENV number
          if (!matchedUser && metaPhoneId === process.env.WHATSAPP_PHONE_NUMBER_ID) {
            const { data: adminUser } = await supabaseAdmin
              .from('users')
              .select('id, whatsapp_phone_number_id, whatsapp_waba_id')
              .eq('email', 'sauravrai8757@gmail.com')
              .maybeSingle();
            matchedUser = adminUser;
          }

          // Last fallback: first user in DB if still unmatched (for initial setup)
          if (!matchedUser) {
            const { data: fallbackUser } = await supabaseAdmin
              .from('users')
              .select('id, whatsapp_phone_number_id, whatsapp_waba_id')
              .limit(1)
              .maybeSingle();
            matchedUser = fallbackUser;
          }

          if (matchedUser) {
            await supabaseAdmin.from('messages').insert({
              user_id: matchedUser.id,
              wa_account_id: matchedUser.whatsapp_waba_id || process.env.WHATSAPP_WABA_ID,
              from_number: message.from,
              to_number: toNumber,
              message_type: message.type,
              direction: 'inbound',
              content: message,
              status: 'received',
              sent_at: new Date(message.timestamp * 1000).toISOString()
            });

            // Non-blocking trigger for AI Agent Auto-Reply
            handleIncomingAiReply(matchedUser.id, message, metaPhoneId).catch((err) => {
              console.error('AI Auto-reply background error:', err);
            });
          }
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// GET user messages
router.get('/messages', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('user_id', req.user.id)
      .order('sent_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark needs_human as resolved for a phone number or specific message ID
router.patch('/messages/resolve-number', auth, async (req, res) => {
  try {
    const { number } = req.body;
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ needs_human: false })
      .eq('user_id', req.user.id)
      .or(`from_number.eq.${number},to_number.eq.${number}`);

    if (error) throw error;
    res.json({ success: true, message: 'Conversation marked as resolved.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/messages/:id/resolve', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({ needs_human: false })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Message marked as resolved.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET analytics summary
router.get('/analytics', auth, async (req, res) => {
  try {
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;

    const totalSent = (messages || []).filter(m => m.direction === 'outbound').length;
    const delivered = (messages || []).filter(m => m.status === 'delivered' || m.status === 'sent' || m.status === 'read').length;
    const readCount = (messages || []).filter(m => m.status === 'read').length;
    const inboundReplies = (messages || []).filter(m => m.direction === 'inbound').length;

    const utilityCount = (messages || []).filter(m => m.billing_category === 'utility').length;
    const marketingCount = (messages || []).filter(m => m.billing_category === 'marketing').length;

    res.json({
      totalSent,
      delivered,
      readRate: totalSent > 0 ? Math.round((readCount / totalSent) * 100) : 0,
      replyRate: totalSent > 0 ? Math.round((inboundReplies / totalSent) * 100) : 0,
      utilityCount,
      marketingCount,
      totalMessages: (messages || []).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Embedded Signup Callback
router.post('/embedded-signup-callback', auth, async (req, res) => {
  const { code, waba_id, phone_number_id } = req.body;
  const user = req.user;

  try {
    let finalPhoneId = phone_number_id;
    let finalWabaId = waba_id;
    let displayPhoneNumber = '';

    if (code) {
      try {
        const tokenRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
          params: {
            client_id: process.env.WHATSAPP_APP_ID || '1628000222058652',
            client_secret: process.env.WHATSAPP_APP_SECRET || '',
            code: code,
          }
        });
        const userToken = tokenRes.data.access_token;

        if (userToken && !finalWabaId) {
          const debugRes = await axios.get('https://graph.facebook.com/v18.0/debug_token', {
            params: { input_token: userToken, access_token: userToken }
          });
          const targetIds = debugRes.data.data?.target_ids || [];
          if (targetIds.length > 0) finalWabaId = targetIds[0];
        }
      } catch (err) {
        console.warn('Token exchange warning (continuing with returned IDs):', err.response?.data || err.message);
      }
    }

    if (finalPhoneId) {
      try {
        const phoneRes = await axios.get(`https://graph.facebook.com/v18.0/${finalPhoneId}`, {
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
        });
        displayPhoneNumber = phoneRes.data.display_phone_number || '';
      } catch (e) {
        // ignore
      }
    }

    // Build update payload — whatsapp_display_phone is optional (column may not exist in older DBs)
    const updatePayload = {
      whatsapp_phone_number_id: finalPhoneId || null,
      whatsapp_waba_id: finalWabaId || null,
      updated_at: new Date().toISOString(),
    };

    // First attempt includes display phone; fallback without it
    let updatedUser;
    {
      const firstPayload = displayPhoneNumber
        ? { ...updatePayload, whatsapp_display_phone: displayPhoneNumber }
        : updatePayload;

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(firstPayload)
        .eq('id', user.id)
        .select()
        .single();

      if (error && displayPhoneNumber) {
        // Retry without the optional column
        console.warn('Retrying update without whatsapp_display_phone:', error.message);
        const { data: data2, error: error2 } = await supabaseAdmin
          .from('users')
          .update(updatePayload)
          .eq('id', user.id)
          .select()
          .single();
        if (error2) throw error2;
        updatedUser = data2;
      } else {
        if (error) throw error;
        updatedUser = data;
      }
    }

    res.json({
      success: true,
      message: 'WhatsApp Business account connected successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Embedded signup callback error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete Embedded Signup connection' });
  }
});

module.exports = router;
