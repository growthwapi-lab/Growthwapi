const express = require('express');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { getActiveSubscription, PLAN_QUOTAS, hasActiveSubscription } = require('../utils/trialLimits');
const { processSubscriptionAffiliateCommission } = require('../utils/affiliateEngine');

const router = express.Router();

// 1. Create Subscription or Upgrade Order
router.post('/create-subscription-order', auth, async (req, res) => {
  const { planType } = req.body;
  if (!PLAN_QUOTAS[planType] || planType === 'trial') {
    return res.status(400).json({ error: 'Invalid plan type' });
  }

  try {
    const activeSub = await getActiveSubscription(req.user.id);
    let amountToPay = PLAN_QUOTAS[planType].price;

    // Prorated upgrade calculation if upgrading from an active lower plan
    if (activeSub && activeSub.plan_type !== planType) {
      const currentPrice = PLAN_QUOTAS[activeSub.plan_type]?.price || 0;
      if (PLAN_QUOTAS[planType].price > currentPrice) {
        amountToPay = PLAN_QUOTAS[planType].price - currentPrice;
      }
    }

    const options = {
      amount: Math.round(amountToPay * 100), // in paise
      currency: 'INR',
      receipt: `sub_${Date.now()}`.substring(0, 40)
    };

    const order = await razorpay.orders.create(options);
    res.json({
      ...order,
      amountToPay,
      isUpgrade: Boolean(activeSub && activeSub.plan_type !== planType)
    });
  } catch (error) {
    console.error('Create subscription order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// 2. Create Wallet Recharge Order
router.post('/create-wallet-order', auth, async (req, res) => {
  const { amount } = req.body; // in rupees
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const isPaid = await hasActiveSubscription(req.user.id);
    if (!isPaid) {
      return res.status(403).json({ error: 'Wallet recharge is available only after upgrading to a paid subscription.' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `wal_${Date.now()}`.substring(0, 40)
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Verify Payment (Idempotent signature verification & DB update)
router.post('/verify-payment', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type, planType, amount } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification params' });
  }

  // Signature verification
  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  try {
    // IDEMPOTENCY CHECK: Check if this payment ID was already verified
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingSub) {
      return res.json({
        success: true,
        message: 'Payment already verified.',
        subscription: existingSub
      });
    }

    if (type === 'subscription') {
      const start_date = new Date().toISOString();
      const d = new Date();
      d.setDate(d.getDate() + 30);
      const end_date = d.toISOString();

      // 1. Deactivate old active subscriptions
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', req.user.id)
        .eq('status', 'active');

      // 2. Insert new subscription row into Supabase 'subscriptions' table
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: req.user.id,
          plan_type: planType,
          status: 'active',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          amount: PLAN_QUOTAS[planType]?.price || amount,
          payment_for: 'subscription',
          start_date,
          end_date
        })
        .select()
        .single();

      if (subError) {
        console.error('Subscription insert error:', subError);
        throw subError;
      }

      // 3. Update user profile: set active status, new package type, AND immediately end trial
      const { data: updatedUser, error: userError } = await supabaseAdmin
        .from('users')
        .update({
          package_type: planType,
          account_status: 'active',
          // Immediately terminate trial — set trial_end_date to now
          trial_end_date: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (userError) {
        console.error('User update error:', userError);
        throw userError;
      }

      // 4. Non-blocking trigger: Calculate and credit tiered affiliate commission
      processSubscriptionAffiliateCommission(req.user.id, planType, subscription.id).catch(err => {
        console.error('Background affiliate commission processing error:', err);
      });

      return res.json({
        success: true,
        message: `🎉 Successfully subscribed to the ${planType.toUpperCase()} plan!`,
        subscription,
        user: updatedUser
      });
    } else if (type === 'wallet') {
      const month = new Date().toISOString().slice(0, 7);
      let { data: usage } = await supabaseAdmin
        .from('usage_logs')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('month', month)
        .maybeSingle();
      
      const addAmount = parseFloat(amount || 0);

      if (usage) {
        await supabaseAdmin.from('usage_logs').update({
          wallet_balance: (usage.wallet_balance || 0) + addAmount,
          updated_at: new Date().toISOString()
        }).eq('id', usage.id);
      } else {
        await supabaseAdmin.from('usage_logs').insert({
          user_id: req.user.id,
          month,
          utility_msgs_sent: 0,
          marketing_msgs_sent: 0,
          wallet_balance: addAmount
        });
      }

      // Record in subscriptions table as wallet payment log
      await supabaseAdmin.from('subscriptions').insert({
        user_id: req.user.id,
        plan_type: 'starter',
        status: 'active',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: addAmount,
        payment_for: 'wallet_recharge',
        wallet_amount_added: addAmount,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString()
      });

      return res.json({ success: true, message: 'Wallet recharged successfully!' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
});

router.post('/webhook', (req, res) => {
  // Webhook handler for async confirmation
  res.sendStatus(200);
});

module.exports = router;
