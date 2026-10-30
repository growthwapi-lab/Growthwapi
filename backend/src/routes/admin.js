const express = require('express');
const axios = require('axios');
const { adminAuth } = require('../middleware/adminAuth');
const { supabaseAdmin } = require('../config/supabase');
const { PLAN_QUOTAS } = require('../utils/trialLimits');

const router = express.Router();

// Apply adminAuth middleware to all endpoints in this router
router.use(adminAuth);

// 1. Verify Admin Status
router.get('/verify', (req, res) => {
  res.json({ isAdmin: true, email: req.user.email });
});

// 2. Platform Overview Metrics
router.get('/metrics', async (req, res) => {
  try {
    // A. Users count & breakdown
    const { data: users, error: uErr } = await supabaseAdmin
      .from('users')
      .select('id, package_type, account_status, whatsapp_phone_number_id, created_at');

    if (uErr) throw uErr;

    const totalUsers = users?.length || 0;
    let trialUsers = 0;
    let paidUsers = 0;
    let pausedUsers = 0;
    let whatsappConnectedCount = 0;

    users?.forEach(u => {
      if (u.whatsapp_phone_number_id) whatsappConnectedCount++;
      if (u.account_status === 'paused' || u.account_status === 'suspended') pausedUsers++;
      if (['starter', 'growth', 'pro'].includes(u.package_type) && u.account_status !== 'trial') {
        paidUsers++;
      } else {
        trialUsers++;
      }
    });

    // B. Subscriptions & Revenue
    const { data: subs, error: sErr } = await supabaseAdmin
      .from('subscriptions')
      .select('amount, status, plan_type');

    let totalRevenue = 0;
    let activeSubscriptionsCount = 0;

    if (!sErr && subs) {
      subs.forEach(s => {
        if (s.amount) totalRevenue += Number(s.amount);
        if (s.status === 'active') activeSubscriptionsCount++;
      });
    }

    // C. Total Messages Sent Platform-Wide
    const { count: totalMessages, error: mErr } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true });

    const { count: outboundMessages } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('direction', 'outbound');

    const { count: inboundMessages } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('direction', 'inbound');

    // D. Total AI Agents Platform-Wide
    const { count: totalAiAgents } = await supabaseAdmin
      .from('ai_agents')
      .select('*', { count: 'exact', head: true });

    res.json({
      totalUsers,
      trialUsers,
      paidUsers,
      pausedUsers,
      whatsappConnectedCount,
      activeSubscriptionsCount,
      totalRevenue,
      totalMessages: totalMessages || 0,
      outboundMessages: outboundMessages || 0,
      inboundMessages: inboundMessages || 0,
      totalAiAgents: totalAiAgents || 0,
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get All Clients (with Subscription, Usage, and WhatsApp details)
router.get('/clients', async (req, res) => {
  try {
    // 1. Fetch all users
    const { data: users, error: uErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (uErr) throw uErr;

    // 2. Fetch all active subscriptions
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    const subByUser = {};
    subs?.forEach(s => {
      if (!subByUser[s.user_id] || s.status === 'active') {
        subByUser[s.user_id] = s;
      }
    });

    // 3. Fetch AI agents
    const { data: agents } = await supabaseAdmin
      .from('ai_agents')
      .select('id, user_id, name, status, website_url, pages_crawled');

    const agentByUser = {};
    agents?.forEach(a => {
      agentByUser[a.user_id] = a;
    });

    // 4. Fetch message counts grouped by user_id
    const { data: msgStats } = await supabaseAdmin
      .from('messages')
      .select('user_id, direction');

    const msgCountByUser = {};
    msgStats?.forEach(m => {
      if (!msgCountByUser[m.user_id]) {
        msgCountByUser[m.user_id] = { total: 0, outbound: 0, inbound: 0 };
      }
      msgCountByUser[m.user_id].total++;
      if (m.direction === 'outbound') msgCountByUser[m.user_id].outbound++;
      if (m.direction === 'inbound') msgCountByUser[m.user_id].inbound++;
    });

    // Combine into complete client profiles
    const clients = (users || []).map(u => {
      const activeSub = subByUser[u.id] || null;
      const agent = agentByUser[u.id] || null;
      const msgStats = msgCountByUser[u.id] || { total: 0, outbound: 0, inbound: 0 };

      // Compute trial days remaining
      let trialDaysRemaining = 0;
      if (u.trial_end_date) {
        const diff = new Date(u.trial_end_date) - new Date();
        trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      return {
        ...u,
        subscription: activeSub,
        aiAgent: agent,
        messageStats: msgStats,
        trialDaysRemaining
      };
    });

    res.json(clients);
  } catch (error) {
    console.error('Admin clients fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Update Client Plan Manually (e.g. Upgrade to Pro, Grant Lifetime or X days)
router.patch('/clients/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const { planType, days = 30 } = req.body;

    if (!['trial', 'starter', 'growth', 'pro'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    if (planType === 'trial') {
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + days * 24 * 60 * 60 * 1000);

      await supabaseAdmin
        .from('users')
        .update({
          package_type: 'trial',
          account_status: 'trial',
          trial_start_date: trialStart.toISOString(),
          trial_end_date: trialEnd.toISOString()
        })
        .eq('id', id);

      // Cancel any active subscriptions
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', id)
        .eq('status', 'active');
    } else {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

      // Update user record
      await supabaseAdmin
        .from('users')
        .update({
          package_type: planType,
          account_status: 'active'
        })
        .eq('id', id);

      // Cancel previous active subscriptions
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', id)
        .eq('status', 'active');

      // Insert new active subscription
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: id,
          plan_type: planType,
          status: 'active',
          amount: PLAN_QUOTAS[planType]?.price || 0,
          payment_for: 'manual_admin_grant',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });
    }

    res.json({ success: true, message: `Successfully updated client to ${planType.toUpperCase()} plan for ${days} days.` });
  } catch (error) {
    console.error('Admin plan update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Update Client Account Status (active, paused, suspended, trial)
router.patch('/clients/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'trial', 'paused', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid account status' });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ account_status: status })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: `Account status updated to ${status}.` });
  } catch (error) {
    console.error('Admin status update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Extend Client Trial Days
router.post('/clients/:id/extend-trial', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.body;

    const { data: user, error: uErr } = await supabaseAdmin
      .from('users')
      .select('trial_end_date')
      .eq('id', id)
      .single();

    if (uErr) throw uErr;

    const baseDate = user.trial_end_date && new Date(user.trial_end_date) > new Date()
      ? new Date(user.trial_end_date)
      : new Date();

    const newEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        trial_end_date: newEndDate.toISOString(),
        package_type: 'trial',
        account_status: 'trial'
      })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: `Trial extended by ${days} days! New end date: ${newEndDate.toLocaleDateString()}` });
  } catch (error) {
    console.error('Admin extend trial error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Update Client WhatsApp Credentials (Tech Support Assistance)
router.patch('/clients/:id/whatsapp', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone_number_id, waba_id, display_phone } = req.body;

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        whatsapp_phone_number_id: phone_number_id?.trim() || null,
        whatsapp_waba_id: waba_id?.trim() || null,
        whatsapp_display_phone: display_phone?.trim() || null
      })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'WhatsApp configuration updated for client.' });
  } catch (error) {
    console.error('Admin WhatsApp update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Get All Subscriptions & Transactions
router.get('/subscriptions', async (req, res) => {
  try {
    const { data: subs, error: sErr } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sErr) throw sErr;

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email, business_name, phone');

    const userMap = {};
    users?.forEach(u => {
      userMap[u.id] = u;
    });

    const enrichedSubs = (subs || []).map(s => ({
      ...s,
      user: userMap[s.user_id] || { email: 'Unknown', name: 'Unknown' }
    }));

    res.json(enrichedSubs);
  } catch (error) {
    console.error('Admin subscriptions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. System Health & External Service Monitors
router.get('/system-health', async (req, res) => {
  const health = {
    database: { status: 'unknown' },
    metaGraphApi: { status: 'unknown' },
    openAi: { status: 'unknown' },
    timestamp: new Date().toISOString()
  };

  // Check Database
  try {
    const start = Date.now();
    await supabaseAdmin.from('users').select('id').limit(1);
    health.database = { status: 'healthy', latencyMs: Date.now() - start };
  } catch (err) {
    health.database = { status: 'unhealthy', error: err.message };
  }

  // Check Meta Graph API
  try {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (token) {
      const metaRes = await axios.get('https://graph.facebook.com/v18.0/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      health.metaGraphApi = { status: 'healthy', app: metaRes.data?.name || 'Growthwapi Meta App' };
    } else {
      health.metaGraphApi = { status: 'warning', message: 'No global token configured in ENV' };
    }
  } catch (err) {
    health.metaGraphApi = { status: 'error', error: err.response?.data?.error?.message || err.message };
  }

  // Check OpenAI API
  try {
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      const oaiRes = await axios.get('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${openAiKey}` }
      });
      health.openAi = { status: 'healthy', modelsCount: oaiRes.data?.data?.length || 0 };
    } else {
      health.openAi = { status: 'warning', message: 'OPENAI_API_KEY not configured in ENV' };
    }
  } catch (err) {
    health.openAi = { status: 'error', error: err.response?.data?.error?.message || err.message };
  }

  res.json(health);
});

// 10. Get All Affiliate Partners & Payouts (Admin View)
router.get('/affiliates', async (req, res) => {
  try {
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('*')
      .order('total_earnings', { ascending: false });

    if (pErr) throw pErr;

    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone');

    const userMap = {};
    users?.forEach(u => { userMap[u.id] = u; });

    // Fetch referral counts
    const { data: referrals } = await supabaseAdmin
      .from('affiliate_referrals')
      .select('affiliate_user_id, status');

    const refCountMap = {};
    referrals?.forEach(r => {
      refCountMap[r.affiliate_user_id] = (refCountMap[r.affiliate_user_id] || 0) + 1;
    });

    const enrichedProfiles = (profiles || []).map(p => ({
      ...p,
      user: userMap[p.user_id] || { name: 'Partner', email: 'unknown' },
      referralCount: refCountMap[p.user_id] || 0
    }));

    // Fetch all payouts
    const { data: payouts } = await supabaseAdmin
      .from('affiliate_payouts')
      .select('*')
      .order('requested_at', { ascending: false });

    const enrichedPayouts = (payouts || []).map(po => ({
      ...po,
      user: userMap[po.affiliate_user_id] || { name: 'Partner', email: 'unknown' }
    }));

    res.json({
      affiliates: enrichedProfiles,
      payouts: enrichedPayouts
    });
  } catch (err) {
    console.error('Admin affiliates error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. Process Affiliate Payout (Approve & Mark Paid)
router.patch('/payouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transaction_ref, admin_notes } = req.body;

    const { data: payout, error: pErr } = await supabaseAdmin
      .from('affiliate_payouts')
      .select('*')
      .eq('id', id)
      .single();

    if (pErr || !payout) {
      return res.status(404).json({ error: 'Payout request not found' });
    }

    const { data: updatedPayout, error: upErr } = await supabaseAdmin
      .from('affiliate_payouts')
      .update({
        status: status || 'completed',
        transaction_ref: transaction_ref || null,
        admin_notes: admin_notes || null,
        processed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (upErr) throw upErr;

    // If marked completed, add to paid_balance in affiliate_profiles
    if (status === 'completed' && payout.status !== 'completed') {
      const { data: profile } = await supabaseAdmin
        .from('affiliate_profiles')
        .select('paid_balance')
        .eq('user_id', payout.affiliate_user_id)
        .single();

      if (profile) {
        const newPaid = Number(profile.paid_balance || 0) + Number(payout.amount);
        await supabaseAdmin
          .from('affiliate_profiles')
          .update({ paid_balance: newPaid })
          .eq('user_id', payout.affiliate_user_id);
      }
    } else if (status === 'rejected' && payout.status !== 'rejected') {
      // Refund back to pending_balance if rejected
      const { data: profile } = await supabaseAdmin
        .from('affiliate_profiles')
        .select('pending_balance')
        .eq('user_id', payout.affiliate_user_id)
        .single();

      if (profile) {
        const newPending = Number(profile.pending_balance || 0) + Number(payout.amount);
        await supabaseAdmin
          .from('affiliate_profiles')
          .update({ pending_balance: newPending })
          .eq('user_id', payout.affiliate_user_id);
      }
    }

    res.json({ success: true, payout: updatedPayout });
  } catch (err) {
    console.error('Admin payout update error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
