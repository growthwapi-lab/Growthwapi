const express = require('express');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { COMMISSION_SCHEDULE } = require('../utils/affiliateEngine');

const router = express.Router();

// Helper to generate unique referral code like GW-RAHUL-789
function generateReferralCode(email, name) {
  const base = (name || email?.split('@')[0] || 'PARTNER')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `GW-${base || 'VIP'}-${rand}`;
}

// 1. GET /api/affiliate/profile - Get or create affiliate partner account
router.get('/profile', auth, async (req, res) => {
  try {
    let { data: profile, error } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!profile) {
      // Auto-create affiliate profile on first visit
      const userEmail = req.user.email;
      const userName = req.user.user_metadata?.name || '';
      let code = generateReferralCode(userEmail, userName);

      // Verify code uniqueness
      const { data: existingCode } = await supabaseAdmin
        .from('affiliate_profiles')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle();

      if (existingCode) {
        code = `${code}${Math.floor(10 + Math.random() * 90)}`;
      }

      const { data: newProfile, error: createErr } = await supabaseAdmin
        .from('affiliate_profiles')
        .insert({
          user_id: req.user.id,
          referral_code: code,
          total_earnings: 0.00,
          pending_balance: 0.00,
          paid_balance: 0.00,
          total_clicks: 0,
          is_approved: true
        })
        .select()
        .single();

      if (createErr) throw createErr;
      profile = newProfile;
    }

    res.json({
      profile,
      commissionSchedule: COMMISSION_SCHEDULE
    });
  } catch (err) {
    console.error('Error fetching affiliate profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. PUT /api/affiliate/payout-settings - Update UPI / Bank payout details
router.put('/payout-settings', auth, async (req, res) => {
  try {
    const { upi_id, bank_account_number, bank_ifsc, bank_account_name } = req.body;

    const { data: updated, error } = await supabaseAdmin
      .from('affiliate_profiles')
      .update({
        upi_id: upi_id ? upi_id.trim() : null,
        bank_account_number: bank_account_number ? bank_account_number.trim() : null,
        bank_ifsc: bank_ifsc ? bank_ifsc.trim().toUpperCase() : null,
        bank_account_name: bank_account_name ? bank_account_name.trim() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, profile: updated });
  } catch (err) {
    console.error('Error updating payout settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/affiliate/dashboard - Get referrals, commissions & payout history
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Profile
    const { data: profile } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // 2. Referrals list (with client profile info)
    const { data: referrals } = await supabaseAdmin
      .from('affiliate_referrals')
      .select('*')
      .eq('affiliate_user_id', userId)
      .order('created_at', { ascending: false });

    // Fetch client names/emails for display
    const clientIds = (referrals || []).map(r => r.referred_client_id);
    let clientMap = {};
    if (clientIds.length > 0) {
      const { data: clients } = await supabaseAdmin
        .from('users')
        .select('id, name, email, package_type, account_status, created_at')
        .in('id', clientIds);
      (clients || []).forEach(c => { clientMap[c.id] = c; });
    }

    const enrichedReferrals = (referrals || []).map(r => ({
      ...r,
      client: clientMap[r.referred_client_id] || { name: 'Client', email: 'masked' }
    }));

    // 3. Commissions list
    const { data: commissions } = await supabaseAdmin
      .from('affiliate_commissions')
      .select('*')
      .eq('affiliate_user_id', userId)
      .order('created_at', { ascending: false });

    // 4. Payouts list
    const { data: payouts } = await supabaseAdmin
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_user_id', userId)
      .order('requested_at', { ascending: false });

    res.json({
      profile,
      referrals: enrichedReferrals,
      commissions: commissions || [],
      payouts: payouts || [],
      commissionSchedule: COMMISSION_SCHEDULE
    });
  } catch (err) {
    console.error('Error fetching affiliate dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/affiliate/request-payout - Request payout withdrawal
router.post('/request-payout', auth, async (req, res) => {
  try {
    const { amount, method = 'upi' } = req.body;
    const requestedAmount = Number(amount);

    if (!requestedAmount || requestedAmount < 500) {
      return res.status(400).json({ error: 'Minimum payout withdrawal amount is Rs 500.' });
    }

    const { data: profile } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Affiliate profile not found.' });
    }

    if (Number(profile.pending_balance) < requestedAmount) {
      return res.status(400).json({
        error: `Insufficient balance. Available balance: Rs ${profile.pending_balance}`
      });
    }

    if (method === 'upi' && !profile.upi_id) {
      return res.status(400).json({ error: 'Please save your UPI ID in settings before requesting payout.' });
    }

    if (method === 'bank' && (!profile.bank_account_number || !profile.bank_ifsc)) {
      return res.status(400).json({ error: 'Please save your Bank account details before requesting payout.' });
    }

    const payoutDetails = method === 'upi'
      ? { upi_id: profile.upi_id }
      : {
          account_number: profile.bank_account_number,
          ifsc: profile.bank_ifsc,
          name: profile.bank_account_name
        };

    // Create payout request
    const { data: payout, error: pErr } = await supabaseAdmin
      .from('affiliate_payouts')
      .insert({
        affiliate_user_id: req.user.id,
        amount: requestedAmount,
        payout_method: method,
        payout_details: payoutDetails,
        status: 'pending'
      })
      .select()
      .single();

    if (pErr) throw pErr;

    // Deduct from pending balance
    const updatedPending = Number(profile.pending_balance) - requestedAmount;
    await supabaseAdmin
      .from('affiliate_profiles')
      .update({ pending_balance: updatedPending })
      .eq('user_id', req.user.id);

    res.json({
      success: true,
      message: 'Payout request submitted successfully! Admin will process your transfer.',
      payout
    });
  } catch (err) {
    console.error('Error requesting payout:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/affiliate/track-click - Non-auth endpoint to increment referral clicks
router.post('/track-click', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.sendStatus(200);

    const cleanCode = code.trim().toUpperCase();
    const { data: profile } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('id, total_clicks')
      .eq('referral_code', cleanCode)
      .maybeSingle();

    if (profile) {
      await supabaseAdmin
        .from('affiliate_profiles')
        .update({ total_clicks: (profile.total_clicks || 0) + 1 })
        .eq('id', profile.id);
    }

    res.json({ tracked: true });
  } catch (err) {
    res.sendStatus(200); // Fail silently for tracking
  }
});

module.exports = router;
