const express = require('express');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const {
  getTrialUsage,
  TRIAL_CAPS,
  PLAN_QUOTAS,
  getActiveSubscription,
  hasActiveSubscription,
  getMonthlyUsage,
  checkTrialEligibility
} = require('../utils/trialLimits');

const router = express.Router();

// Helper to safely get or create user record in Supabase users table
async function getOrCreateUser(reqUser) {
  let { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', reqUser.id)
    .maybeSingle();

  if (!user) {
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const newProfile = {
      id: reqUser.id,
      email: reqUser.email,
      name: reqUser.user_metadata?.name || reqUser.email?.split('@')[0] || 'User',
      business_name: reqUser.user_metadata?.business_name || '',
      phone: reqUser.user_metadata?.phone || '',
      package_type: 'trial',
      trial_start_date: trialStart.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      account_status: 'trial',
      created_at: new Date().toISOString()
    };

    const { data: upsertedUser, error: upsertErr } = await supabaseAdmin
      .from('users')
      .upsert(newProfile, { onConflict: 'id' })
      .select()
      .single();

    if (upsertErr) {
      console.error('Error auto-creating user profile:', upsertErr);
      return newProfile;
    }
    user = upsertedUser;
  }

  return user;
}

// GET Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Profile
router.put('/profile', auth, async (req, res) => {
  const { name, phone, business_name } = req.body;
  try {
    let formattedPhone = phone ? phone.trim().replace(/[\s\-\(\)]/g, '') : '';
    if (formattedPhone) {
      if (!formattedPhone.startsWith('+')) {
        if (/^\d{10}$/.test(formattedPhone)) {
          formattedPhone = '+91' + formattedPhone;
        } else if (/^\d{11,14}$/.test(formattedPhone)) {
          formattedPhone = '+' + formattedPhone;
        }
      }
      if (!/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
        return res.status(400).json({ error: 'Please enter a valid phone number with country code (e.g. +919876543210)' });
      }

      const check = await checkTrialEligibility(formattedPhone, null, req.user.id);
      if (!check.eligible) {
        return res.status(400).json({ error: check.message });
      }
    }

    await getOrCreateUser(req.user);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        name: name ? name.trim() : undefined,
        phone: formattedPhone || undefined,
        business_name: business_name ? business_name.trim() : undefined
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET WhatsApp Business Configuration for current user
router.get('/whatsapp-config', auth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    res.json({
      phone_number_id: user.whatsapp_phone_number_id || null,
      waba_id: user.whatsapp_waba_id || null,
      display_phone: user.whatsapp_display_phone || null,
      is_connected: Boolean(user.whatsapp_phone_number_id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT WhatsApp Business Configuration (Manual connection or disconnect)
router.put('/whatsapp-config', auth, async (req, res) => {
  const { phone_number_id, waba_id } = req.body;
  // Allow empty strings to disconnect; but if one is provided the other must be too
  const isDisconnect = !phone_number_id && !waba_id;
  if (!isDisconnect && (!phone_number_id || !waba_id)) {
    return res.status(400).json({ error: 'Both Phone Number ID and WABA ID are required.' });
  }
  try {
    await getOrCreateUser(req.user);

    // Build update object — null clears the value (for disconnect)
    const updatePayload = {
      whatsapp_phone_number_id: (phone_number_id && phone_number_id.trim()) ? phone_number_id.trim() : null,
      whatsapp_waba_id: (waba_id && waba_id.trim()) ? waba_id.trim() : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'WhatsApp configuration saved successfully!', user: data });
  } catch (error) {
    console.error('whatsapp-config PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST Check Trial Eligibility
router.post('/check-eligibility', auth, async (req, res) => {
  const { phone } = req.body;
  try {
    const check = await checkTrialEligibility(phone, null, req.user.id);
    res.json(check);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Active Plan & Quotas info for Dashboard, Wallet, Settings & Sidebar
router.get('/active-plan', auth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const activeSub = await getActiveSubscription(req.user.id);
    const { utilityUsed, marketingUsed } = await getMonthlyUsage(req.user.id);
    const now = new Date();

    if (activeSub) {
      const endDate = new Date(activeSub.end_date);
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      const pkg = activeSub.plan_type || user.package_type || 'starter';
      const quota = PLAN_QUOTAS[pkg] || PLAN_QUOTAS.starter;

      return res.json({
        plan: pkg.toUpperCase(),
        planName: pkg.toUpperCase(),
        packageType: pkg,
        status: activeSub.status === 'active' ? 'Active' : 'Expired',
        price: quota.price,
        startDate: activeSub.start_date,
        endDate: activeSub.end_date,
        daysRemaining,
        utilityUsed,
        utilityQuota: quota.utility,
        marketingUsed,
        marketingQuota: quota.marketing,
        isPaid: true,
        isTrial: false,
        isExpired: activeSub.status === 'expired' || now > endDate,
        isHighestPlan: pkg === 'pro',
        badgeText: `${pkg.toUpperCase()} Plan`
      });
    }

    // Trial or Paused Account
    const trialEnd = user.trial_end_date ? new Date(user.trial_end_date) : new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
    const isExpired = user.account_status === 'paused' || (user.account_status === 'trial' && now > trialEnd);

    return res.json({
      plan: 'Free Trial',
      planName: 'Free Trial',
      packageType: 'trial',
      status: isExpired ? 'Expired' : (user.account_status === 'paused' ? 'Paused' : 'Trial'),
      price: 0,
      startDate: user.trial_start_date,
      endDate: user.trial_end_date,
      daysRemaining,
      utilityUsed,
      utilityQuota: TRIAL_CAPS.utility,
      marketingUsed,
      marketingQuota: TRIAL_CAPS.marketing,
      isPaid: false,
      isTrial: !isExpired && user.account_status === 'trial',
      isExpired,
      isHighestPlan: false,
      badgeText: isExpired ? 'Expired' : `Trial (${daysRemaining}d left)`
    });
  } catch (error) {
    console.error('Active plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET Trial Status
router.get('/trial-status', auth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);
    const isPaid = await hasActiveSubscription(req.user.id);
    const { utilityUsed, marketingUsed } = await getMonthlyUsage(req.user.id);

    const now = new Date();
    const end = new Date(user.trial_end_date || Date.now());
    let daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) daysRemaining = 0;

    res.json({
      status: isPaid ? 'active' : user.account_status,
      daysRemaining,
      utilityUsed,
      utilityCap: TRIAL_CAPS.utility,
      marketingUsed,
      marketingCap: TRIAL_CAPS.marketing,
      isPaid,
      isTrial: !isPaid && user.account_status === 'trial'
    });
  } catch (error) {
    console.error('Trial status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST Pause Check
router.post('/pause-check', auth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user);

    if (user.account_status === 'paused') {
      return res.json({ paused: true });
    }

    const now = new Date();
    const trialEnd = new Date(user.trial_end_date);

    if (user.account_status === 'trial' && now > trialEnd) {
      await supabaseAdmin.from('users').update({ account_status: 'paused' }).eq('id', req.user.id);
      return res.json({ paused: true });
    }

    res.json({ paused: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
