const { supabase, supabaseAdmin } = require('../config/supabase');

const ADMIN_EMAILS = [
  'sauravrai8757@gmail.com',
  'growthwapi@gmail.com',
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [])
];

const adminAuth = async (req, res, next) => {
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

    const userEmail = (user.email || '').toLowerCase();
    let isSuperAdmin = ADMIN_EMAILS.includes(userEmail);

    if (!isSuperAdmin) {
      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('is_admin, role')
        .eq('id', user.id)
        .maybeSingle();

      if (dbUser && (dbUser.is_admin === true || dbUser.role === 'admin')) {
        isSuperAdmin = true;
      }
    }

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied: Super Admin privileges required.' });
    }

    req.user = user;
    req.isAdmin = true;
    next();
  } catch (err) {
    console.error('Admin Auth error:', err);
    res.status(500).json({ error: 'Internal server error during admin authentication' });
  }
};

module.exports = { adminAuth, ADMIN_EMAILS };
