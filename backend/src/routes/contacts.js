const express = require('express');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Get contacts for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a contact
router.post('/', auth, async (req, res) => {
  const { name, phone, tags, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone number are required' });
  }

  try {
    // 1. Ensure user record exists in users table (uses service role bypasses RLS)
    await supabaseAdmin.from('users').upsert({
      id: req.user.id,
      name: req.user.user_metadata?.name || req.user.user_metadata?.full_name || name,
      email: req.user.email,
      phone: req.user.user_metadata?.phone || null,
      business_name: req.user.user_metadata?.business_name || null,
    }, { onConflict: 'id', ignoreDuplicates: true });

    const tagArray = Array.isArray(tags) 
      ? tags 
      : (typeof tags === 'string' && tags.trim() ? tags.split(',').map(t => t.trim()) : []);

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .upsert({
        user_id: req.user.id,
        name: name.trim(),
        phone: phone.trim(),
        tags: tagArray,
        notes: notes || null
      }, { onConflict: 'user_id,phone' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: error.message || 'Failed to save contact' });
  }
});

// Delete a contact
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
