const { supabaseAdmin } = require('../config/supabase');

const PLAN_QUOTAS = {
  starter: { utility: 1000, marketing: 500, price: 999 },
  growth: { utility: 5000, marketing: 2000, price: 2999 },
  pro: { utility: 20000, marketing: 10000, price: 7999 },
  trial: { utility: 50, marketing: 20, price: 0 }
};

const TRIAL_CAPS = PLAN_QUOTAS.trial;

// Get user's active subscription (excludes wallet recharge entries)
async function getActiveSubscription(userId) {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('payment_for', 'wallet_recharge')   // ← exclude wallet top-ups
    .in('plan_type', ['starter', 'growth', 'pro'])  // ← only real plans
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return null;

  const now = new Date();
  const endDate = new Date(sub.end_date);

  if (now > endDate) {
    // Mark as expired
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('id', sub.id);
    return null;
  }

  return sub;
}

// Get monthly outbound message usage for user
async function getMonthlyUsage(userId) {
  const month = new Date().toISOString().slice(0, 7);
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('billing_category')
    .eq('user_id', userId)
    .eq('direction', 'outbound')
    .gte('sent_at', `${month}-01T00:00:00.000Z`);

  const utilityUsed = (messages || []).filter(m => (m.billing_category || 'utility') === 'utility').length;
  const marketingUsed = (messages || []).filter(m => m.billing_category === 'marketing').length;

  return { utilityUsed, marketingUsed };
}

// Check cap / quota before sending message(s)
async function checkTrialCap(userId, category = 'utility', count = 1) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('account_status, trial_end_date, package_type')
    .eq('id', userId)
    .single();

  if (!user) {
    return { allowed: false, message: 'User not found' };
  }

  // Check active subscription
  const sub = await getActiveSubscription(userId);

  if (user.account_status === 'paused') {
    return { allowed: false, message: 'Account paused. Please subscribe or renew your plan to continue.' };
  }

  const now = new Date();

  // Handle Trial User
  if (!sub && user.account_status === 'trial') {
    const trialEnd = new Date(user.trial_end_date);
    if (now > trialEnd) {
      await supabaseAdmin.from('users').update({ account_status: 'paused' }).eq('id', userId);
      return { allowed: false, message: 'Trial expired. Please subscribe to a plan to continue.' };
    }

    const { utilityUsed, marketingUsed } = await getMonthlyUsage(userId);
    const cat = (category || 'utility').toLowerCase();

    if (cat === 'utility' && utilityUsed + count > TRIAL_CAPS.utility) {
      return { allowed: false, message: 'Trial limit reached. Please upgrade to a paid plan to continue.' };
    }
    if (cat === 'marketing' && marketingUsed + count > TRIAL_CAPS.marketing) {
      return { allowed: false, message: 'Trial limit reached. Please upgrade to a paid plan to continue.' };
    }

    return { allowed: true };
  }

  // Handle Subscription User
  if (sub) {
    const pkg = sub.plan_type || user.package_type || 'starter';
    const quota = PLAN_QUOTAS[pkg] || PLAN_QUOTAS.starter;
    const { utilityUsed, marketingUsed } = await getMonthlyUsage(userId);
    const cat = (category || 'utility').toLowerCase();

    // Check if within plan quota or has wallet balance for overage
    if (cat === 'utility' && utilityUsed + count > quota.utility) {
      // Check wallet balance
      const { data: usageLog } = await supabaseAdmin
        .from('usage_logs')
        .select('wallet_balance')
        .eq('user_id', userId)
        .eq('month', new Date().toISOString().slice(0, 7))
        .single();

      const balance = usageLog?.wallet_balance || 0;
      if (balance <= 0) {
        return { allowed: false, message: 'Monthly utility message quota exceeded. Please recharge your wallet for overage.' };
      }
    } else if (cat === 'marketing' && marketingUsed + count > quota.marketing) {
      const { data: usageLog } = await supabaseAdmin
        .from('usage_logs')
        .select('wallet_balance')
        .eq('user_id', userId)
        .eq('month', new Date().toISOString().slice(0, 7))
        .single();

      const balance = usageLog?.wallet_balance || 0;
      if (balance <= 0) {
        return { allowed: false, message: 'Monthly marketing message quota exceeded. Please recharge your wallet for overage.' };
      }
    }

    return { allowed: true };
  }

  return { allowed: false, message: 'Subscription expired or inactive. Please renew your plan.' };
}

// Check phone eligibility for trials
async function checkTrialEligibility(phone, email, currentUserId = null) {
  if (phone) {
    let query = supabaseAdmin
      .from('users')
      .select('id, trial_start_date, account_status')
      .eq('phone', phone.trim());

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data: existingPhoneUsers } = await query;
    if (existingPhoneUsers && existingPhoneUsers.length > 0) {
      return {
        eligible: false,
        reason: 'phone',
        message: 'A free trial has already been used for this phone number.'
      };
    }
  }

  return { eligible: true };
}

// Check if user has active subscription
async function hasActiveSubscription(userId) {
  const sub = await getActiveSubscription(userId);
  return Boolean(sub);
}

module.exports = {
  PLAN_QUOTAS,
  TRIAL_CAPS,
  getActiveSubscription,
  hasActiveSubscription,
  getMonthlyUsage,
  checkTrialCap,
  checkTrialEligibility
};
