const { supabaseAdmin } = require('../config/supabase');

/**
 * EXACT TIERED AFFILIATE COMMISSION MATRIX
 * 
 * Starter Plan (Rs 999):
 *  - Month 1: Rs 300
 *  - Month 2: Rs 150
 *  - Month 3: Rs 75
 *  - Month 4+: Rs 0 (Max 3 months)
 * 
 * Growth Plan (Rs 2,499):
 *  - Month 1: Rs 500
 *  - Month 2: Rs 250
 *  - Month 3: Rs 125
 *  - Month 4: Rs 75
 *  - Month 5+: Rs 0 (Max 4 months)
 * 
 * Pro Plan (Rs 5,999):
 *  - Month 1: Rs 1,000
 *  - Month 2: Rs 500
 *  - Month 3: Rs 250
 *  - Month 4: Rs 125
 *  - Month 5: Rs 75
 *  - Month 6+: Rs 0 (Max 5 months)
 */
const COMMISSION_SCHEDULE = {
  starter: {
    1: 300,
    2: 150,
    3: 75,
  },
  growth: {
    1: 500,
    2: 250,
    3: 125,
    4: 75,
  },
  pro: {
    1: 1000,
    2: 500,
    3: 250,
    4: 125,
    5: 75,
  }
};

/**
 * Check and process affiliate commission whenever a client pays for a subscription.
 * Called automatically from payments.js after subscription verification.
 * 
 * @param {string} clientId - The user ID who made the payment
 * @param {string} planType - 'starter', 'growth', 'pro'
 * @param {string} subscriptionId - Razorpay subscription record ID
 */
async function processSubscriptionAffiliateCommission(clientId, planType, subscriptionId) {
  try {
    const normalizedPlan = (planType || '').toLowerCase();
    const planSchedule = COMMISSION_SCHEDULE[normalizedPlan];
    if (!planSchedule) return null;

    // 1. Find if this client was referred by an affiliate
    const { data: referral, error: refErr } = await supabaseAdmin
      .from('affiliate_referrals')
      .select('*')
      .eq('referred_client_id', clientId)
      .maybeSingle();

    if (refErr || !referral) {
      return null; // Client was not referred by any affiliate
    }

    const nextMonthNumber = (referral.total_months_paid || 0) + 1;
    const commissionAmount = planSchedule[nextMonthNumber];

    // Check if max reward months are already reached
    if (!commissionAmount || commissionAmount <= 0) {
      await supabaseAdmin
        .from('affiliate_referrals')
        .update({
          total_months_paid: nextMonthNumber,
          current_plan: normalizedPlan,
          status: 'completed'
        })
        .eq('id', referral.id);
      return null;
    }

    // 2. Insert commission transaction record
    const { data: commissionRecord, error: commErr } = await supabaseAdmin
      .from('affiliate_commissions')
      .insert({
        affiliate_user_id: referral.affiliate_user_id,
        referred_client_id: clientId,
        subscription_id: subscriptionId || null,
        plan_type: normalizedPlan,
        month_number: nextMonthNumber,
        commission_amount: commissionAmount,
        status: 'approved',
        notes: `Month ${nextMonthNumber} commission for ${normalizedPlan.toUpperCase()} plan`
      })
      .select()
      .single();

    if (commErr) {
      console.error('Failed to insert affiliate commission:', commErr);
      return null;
    }

    // 3. Update referral state
    await supabaseAdmin
      .from('affiliate_referrals')
      .update({
        total_months_paid: nextMonthNumber,
        current_plan: normalizedPlan,
        status: 'active'
      })
      .eq('id', referral.id);

    // 4. Update affiliate's wallet balance
    const { data: profile } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('total_earnings, pending_balance')
      .eq('user_id', referral.affiliate_user_id)
      .maybeSingle();

    if (profile) {
      const newTotal = Number(profile.total_earnings || 0) + commissionAmount;
      const newPending = Number(profile.pending_balance || 0) + commissionAmount;

      await supabaseAdmin
        .from('affiliate_profiles')
        .update({
          total_earnings: newTotal,
          pending_balance: newPending,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', referral.affiliate_user_id);
    }

    console.log(`[Affiliate] Credited Rs ${commissionAmount} to affiliate ${referral.affiliate_user_id} for client ${clientId} (Month ${nextMonthNumber})`);
    return commissionRecord;
  } catch (err) {
    console.error('Error in processSubscriptionAffiliateCommission:', err);
    return null;
  }
}

/**
 * Register a client under an affiliate using referral code during signup.
 */
async function registerClientReferral(newClientId, referralCode) {
  if (!newClientId || !referralCode) return null;
  try {
    const cleanCode = referralCode.trim().toUpperCase();

    // Find the affiliate by code
    const { data: affiliate } = await supabaseAdmin
      .from('affiliate_profiles')
      .select('user_id, referral_code')
      .eq('referral_code', cleanCode)
      .maybeSingle();

    if (!affiliate || affiliate.user_id === newClientId) {
      return null; // Invalid code or self-referral
    }

    // Check if already registered
    const { data: existing } = await supabaseAdmin
      .from('affiliate_referrals')
      .select('id')
      .eq('referred_client_id', newClientId)
      .maybeSingle();

    if (existing) return existing;

    const { data: created, error } = await supabaseAdmin
      .from('affiliate_referrals')
      .insert({
        affiliate_user_id: affiliate.user_id,
        referred_client_id: newClientId,
        referral_code: cleanCode,
        total_months_paid: 0,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.warn('Could not link referral:', error.message);
      return null;
    }

    return created;
  } catch (err) {
    console.error('Error registering referral:', err);
    return null;
  }
}

module.exports = {
  COMMISSION_SCHEDULE,
  processSubscriptionAffiliateCommission,
  registerClientReferral
};
