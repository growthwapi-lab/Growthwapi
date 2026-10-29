const express = require('express');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

const QUOTAS = {
  starter: { utility: 1000, marketing: 500 },
  growth: { utility: 5000, marketing: 2000 },
  pro: { utility: 20000, marketing: 10000 },
  trial: { utility: 20000, marketing: 10000 },
};

const RATES = { utility: 0.25, marketing: 1.75 };

router.get('/balance', auth, async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7);
    let { data: usage, error } = await supabaseAdmin
      .from('usage_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('month', month)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!usage) {
      usage = { utility_msgs_sent: 0, marketing_msgs_sent: 0, wallet_balance: 0 };
    }

    // Get user's package type for quota
    const { data: user } = await supabaseAdmin.from('users').select('package_type').eq('id', req.user.id).single();
    const packageType = user?.package_type || 'trial';
    const quota = QUOTAS[packageType] || QUOTAS.trial;

    // Get active subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      ...usage,
      utility_quota: quota.utility,
      marketing_quota: quota.marketing,
      package_type: packageType,
      subscription: subscription || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/deduct', auth, async (req, res) => {
  const { type, count } = req.body;
  try {
    const { data: user } = await supabaseAdmin.from('users').select('package_type').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const packageType = user.package_type || 'trial';
    const month = new Date().toISOString().slice(0, 7);
    
    let { data: usage } = await supabaseAdmin
      .from('usage_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('month', month)
      .single();

    if (!usage) {
      const { data: newUsage, error } = await supabaseAdmin.from('usage_logs').insert({
        user_id: req.user.id,
        month,
        utility_msgs_sent: 0,
        marketing_msgs_sent: 0,
        wallet_balance: 0
      }).select().single();
      if (error) throw error;
      usage = newUsage;
    }

    const quota = QUOTAS[packageType][type] || 0;
    const sentKey = `${type}_msgs_sent`;
    const currentlySent = usage[sentKey];
    
    let toDeduct = 0;
    if (currentlySent + count > quota) {
      const chargeableMessages = Math.min(count, (currentlySent + count) - quota);
      toDeduct = chargeableMessages * RATES[type];
    }

    if (toDeduct > usage.wallet_balance) {
       return res.status(402).json({ error: 'Insufficient wallet balance' });
    }

    const updates = {
      [sentKey]: currentlySent + count,
      updated_at: new Date().toISOString()
    };
    if (toDeduct > 0) {
      updates.wallet_balance = usage.wallet_balance - toDeduct;
    }

    await supabaseAdmin.from('usage_logs').update(updates).eq('id', usage.id);

    res.json({ success: true, deducted: toDeduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/usage', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usage_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('month', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
