const express = require('express');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { COMMISSION_SCHEDULE } = require('../utils/affiliateEngine');

const { getActiveSubscription } = require('../utils/trialLimits');
const router = express.Router();
const ADMIN_EMAILS = ['sauravrai8757@gmail.com', 'growthwapi@gmail.com'];

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
    const userEmail = (req.user.email || '').toLowerCase();
    const isSuperAdmin = ADMIN_EMAILS.includes(userEmail);

    let { data: profile, error } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!profile) {
      // Auto-create affiliate profile on first visit
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
          is_approved: isSuperAdmin,
          is_paid_member: isSuperAdmin
        })
        .select()
        .single();

      if (createErr) throw createErr;
      profile = newProfile;
    } else if (isSuperAdmin && !profile.is_paid_member) {
      // Ensure super admin is always active
      await supabaseAdmin
        .from('affiliate_profiles')
        .update({ is_paid_member: true, is_approved: true })
        .eq('id', profile.id);
      profile.is_paid_member = true;
      profile.is_approved = true;
    }

    // Auto-activate partner if user already has an active WhatsApp plan
    const { data: activeSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .neq('payment_for', 'wallet_recharge')
      .in('plan_type', ['starter', 'growth', 'pro'])
      .maybeSingle();
    if (activeSub && !profile.is_paid_member) {
      await supabaseAdmin
        .from('affiliate_profiles')
        .update({ is_paid_member: true, is_approved: true })
        .eq('id', profile.id);
      profile.is_paid_member = true;
      profile.is_approved = true;
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

// 1b. POST /api/affiliate/create-activation-order - Razorpay order for ₹200 one-time fee
router.post('/create-activation-order', auth, async (req, res) => {
  try {
    const options = {
      amount: 20000, // ₹200 in paise
      currency: 'INR',
      receipt: `aff_act_${Date.now()}`.substring(0, 40),
      notes: {
        user_id: req.user.id,
        purpose: 'affiliate_partner_activation'
      }
    };
    const order = await razorpay.orders.create(options);
    res.json({
      ...order,
      amountToPay: 200,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Create affiliate activation order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create activation order' });
  }
});

// 1c. POST /api/affiliate/verify-activation - Verify signature and activate partner account
router.post('/verify-activation', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification params' });
  }

  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  try {
    const { data: updatedProfile, error: pErr } = await supabaseAdmin
      .from('affiliate_profiles')
      .update({
        is_paid_member: true,
        is_approved: true,
        payment_id: razorpay_payment_id,
        paid_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (pErr) throw pErr;

    // Log subscription/payment entry
    try {
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: req.user.id,
          plan_type: 'partner',
          status: 'active',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          amount: 200,
          payment_for: 'affiliate_partner_activation',
          start_date: new Date().toISOString(),
          end_date: null
        });
    } catch (sErr) {
      console.warn('Subscription record warning:', sErr.message);
    }

    res.json({ success: true, message: 'Partner account activated successfully!', profile: updatedProfile });
  } catch (err) {
    console.error('Verify affiliate activation error:', err);
    res.status(500).json({ error: err.message || 'Failed to verify activation' });
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
    let { data: profile } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Auto-activate if user holds an active WhatsApp plan
    if (profile && !profile.is_paid_member) {
      const { data: activeSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .neq('payment_for', 'wallet_recharge')
        .in('plan_type', ['starter', 'growth', 'pro'])
        .maybeSingle();

      if (activeSub) {
        await supabaseAdmin
          .from('affiliate_profiles')
          .update({ is_paid_member: true, is_approved: true })
          .eq('id', profile.id);
        profile.is_paid_member = true;
        profile.is_approved = true;
      }
    }

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

    if (!requestedAmount || requestedAmount < 400) {
      return res.status(400).json({ error: 'Minimum payout withdrawal amount is Rs 400.' });
    }

    const { data: profile } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Affiliate profile not found.' });
    }

    if (!profile.is_paid_member) {
      // Auto-activate if user already has an active WhatsApp subscription
      const { data: activeSub } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('status', 'active')
        .neq('payment_for', 'wallet_recharge')
        .in('plan_type', ['starter', 'growth', 'pro'])
        .maybeSingle();

      if (activeSub) {
        await supabaseAdmin
          .from('affiliate_profiles')
          .update({ is_paid_member: true, is_approved: true })
          .eq('id', profile.id);
        profile.is_paid_member = true;
        profile.is_approved = true;
      } else {
        return res.status(403).json({ error: 'Please activate your partner account (₹200 one-time fee) to request payouts.' });
      }
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

// 6. GET /api/affiliate/validate/:code - Validate if referral code exists
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || !code.trim()) {
      return res.status(400).json({ valid: false, message: 'Referral code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const { data: profile, error } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('id, user_id, referral_code, is_approved, is_paid_member')
      .eq('referral_code', cleanCode)
      .maybeSingle();

    if (error || !profile) {
      return res.status(404).json({
        valid: false,
        message: `Referral code "${cleanCode}" is invalid or does not exist.`
      });
    }

    const { data: partnerUser } = await supabaseAdmin
      .from('users')
      .select('name, business_name')
      .eq('id', profile.user_id)
      .maybeSingle();

    const partnerName = partnerUser?.business_name || partnerUser?.name || 'Growthwapi Partner';

    return res.json({
      valid: true,
      code: profile.referral_code,
      partnerName,
      message: `Verified Partner (${partnerName})`
    });
  } catch (err) {
    console.error('Error validating referral code:', err);
    res.status(500).json({ valid: false, message: 'Could not validate referral code' });
  }
});

module.exports = router;
