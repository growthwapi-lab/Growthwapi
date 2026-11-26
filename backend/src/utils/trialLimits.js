const { supabaseAdmin } = require('../config/supabase');

const PLAN_QUOTAS = {
  starter: { utility: 1000, marketing: 500, price: 999 },
  growth: { utility: 5000, marketing: 2000, price: 2999 },
  pro: { utility: 20000, marketing: 10000, price: 7999 },
  trial: { utility: 50, marketing: 30, price: 0 }
};

const TRIAL_CAPS = PLAN_QUOTAS.trial;

// Helper to identify Growthwapi admin accounts
async function isUserAdmin(userId, reqUser = null) {
  try {
    const emailsToCheck = [];
    const phonesToCheck = [];

    if (reqUser) {
      if (reqUser.email) emailsToCheck.push(reqUser.email);
      if (reqUser.phone) phonesToCheck.push(reqUser.phone);
      if (reqUser.user_metadata?.phone) phonesToCheck.push(reqUser.user_metadata.phone);
    }

    if (userId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, phone')
        .eq('id', userId)
        .maybeSingle();
      if (user) {
        if (user.email) emailsToCheck.push(user.email);
        if (user.phone) phonesToCheck.push(user.phone);
      }
    }

    for (const rawEmail of emailsToCheck) {
      const email = (rawEmail || '').toLowerCase().trim();
      if (
        email === 'growthwapi@gmail.com' ||
        email === 'sauravrai8757@gmail.com' ||
        email.includes('growthwapi')
      ) {
        return true;
      }
    }

    for (const rawPhone of phonesToCheck) {
      const phone = (rawPhone || '').replace(/\D/g, '');
      if (phone.endsWith('9122257780')) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

// Get user's active subscription (excludes wallet recharge entries)
async function getActiveSubscription(userId) {
  // Permanent lifetime PRO for admin account
  if (await isUserAdmin(userId)) {
    return {
      id: 'admin_permanent_sub',
      user_id: userId,
      plan_type: 'pro',
      status: 'active',
      start_date: '2026-01-01T00:00:00.000Z',
      end_date: '2099-12-31T23:59:59.000Z',
      amount: 0,
      payment_for: 'admin_lifetime_grant'
    };
  }

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

// Check if user has STRICTLY consecutive paid months (no gap allowed, 5-day grace period)
// Returns { eligible: boolean, consecutiveMonths: number, longestStreak: number }
async function checkConsecutiveLoyalty(userId) {
  if (!userId) return { eligible: false, consecutiveMonths: 0 };

  // Admin account always eligible
  if (await isUserAdmin(userId)) {
    return { eligible: true, consecutiveMonths: 999, longestStreak: 999 };
  }

  try {
    // Fetch all REAL paid subscriptions (not wallet recharge, not trial, not admin grant)
    const { data: subs, error } = await supabaseAdmin
      .from('subscriptions')
      .select('id, plan_type, status, start_date, end_date, payment_for, created_at')
      .eq('user_id', userId)
      .neq('payment_for', 'wallet_recharge')
      .neq('payment_for', 'admin_lifetime_grant')
      .in('plan_type', ['starter', 'growth', 'pro'])
      .in('status', ['active', 'cancelled', 'expired'])
      .order('start_date', { ascending: true });

    if (error || !subs || subs.length === 0) {
      return { eligible: false, consecutiveMonths: 0, longestStreak: 0 };
    }

    // Deduplicate: if same payment_id exists multiple times, keep one
    // Sort by start_date ascending
    const sorted = subs
      .filter(s => s.start_date)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    if (sorted.length === 0) return { eligible: false, consecutiveMonths: 0, longestStreak: 0 };

    // Count consecutive streak from the END (most recent) going backwards
    // Grace period: 5 days between end_date of previous and start_date of next
    const GRACE_DAYS = 5;
    const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;

    let consecutiveStreak = 1; // start with the most recent subscription
    let longestStreak = 1;

    for (let i = sorted.length - 1; i > 0; i--) {
      const current = sorted[i];
      const previous = sorted[i - 1];

      const prevEnd = new Date(previous.end_date);
      const currStart = new Date(current.start_date);
      const gap = currStart - prevEnd; // milliseconds

      if (gap <= GRACE_MS) {
        // Consecutive! No significant gap
        consecutiveStreak++;
        if (consecutiveStreak > longestStreak) longestStreak = consecutiveStreak;
      } else {
        // Gap found — reset streak (we count from the end, so we stop here)
        break;
      }
    }

    longestStreak = Math.max(longestStreak, consecutiveStreak);

    return {
      eligible: consecutiveStreak >= 3,
      consecutiveMonths: consecutiveStreak,
      longestStreak
    };
  } catch (err) {
    console.error('checkConsecutiveLoyalty error:', err);
    return { eligible: false, consecutiveMonths: 0, longestStreak: 0 };
  }
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
  if (await isUserAdmin(userId)) {
    return { allowed: true };
  }

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
    const bonusMessages = Number(sub.bonus_messages || user.referral_bonus_messages || 0);
    const effectiveMarketingQuota = quota.marketing + bonusMessages;
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
    } else if (cat === 'marketing' && marketingUsed + count > effectiveMarketingQuota) {
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
  isUserAdmin,
  getActiveSubscription,
  hasActiveSubscription,
  getMonthlyUsage,
  checkTrialCap,
  checkTrialEligibility,
  checkConsecutiveLoyalty
};
