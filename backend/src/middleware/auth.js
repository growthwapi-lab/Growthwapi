const { supabase } = require('../config/supabase');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if logged-in user is a team member/agent acting on behalf of an owner
    const ownerId = user.user_metadata?.owner_id;
    if (ownerId) {
      req.agent = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        role: user.user_metadata?.role || 'agent'
      };
      // Map req.user to represent the workspace owner so all inbox, messages, contacts, and WhatsApp credentials match!
      req.user = {
        ...user,
        originalUserId: user.id,
        id: ownerId,
        isAgent: true,
        agentRole: user.user_metadata?.role || 'agent',
        agentName: user.user_metadata?.name || user.email
      };
    } else {
      req.user = user;
    }

    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = auth;
