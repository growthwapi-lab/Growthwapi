const { checkTrialCap } = require('../utils/trialLimits');

const trialCheck = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const category = req.body.messageCategory || 'utility';
    const count = Array.isArray(req.body.numbers) ? req.body.numbers.length : 1;

    const capCheck = await checkTrialCap(req.user.id, category, count);

    if (!capCheck.allowed) {
      return res.status(403).json({ error: capCheck.message });
    }

    next();
  } catch (err) {
    console.error('Trial check error:', err);
    res.status(500).json({ error: 'Internal server error during account check' });
  }
};

module.exports = trialCheck;
