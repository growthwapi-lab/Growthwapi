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

// Bulk add contacts (from Excel, CSV, or bulk paste)
router.post('/bulk', auth, async (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of contacts.' });
  }

  try {
    // 1. Ensure user record exists
    await supabaseAdmin.from('users').upsert({
      id: req.user.id,
      name: req.user.user_metadata?.name || req.user.email?.split('@')[0] || 'User',
      email: req.user.email,
    }, { onConflict: 'id', ignoreDuplicates: true });

    // Format & validate contacts
    const validContacts = [];
    const seenPhones = new Set();

    for (const c of contacts) {
      if (!c.phone) continue;
      let rawPhone = String(c.phone).trim().replace(/[\s\-\(\)\+]/g, '');
      if (!rawPhone || rawPhone.length < 8) continue;
      
      // If 10 digits Indian number, add 91 prefix
      if (rawPhone.length === 10) {
        rawPhone = '91' + rawPhone;
      }
      
      // Prevent duplicates in the same batch
      if (seenPhones.has(rawPhone)) continue;
      seenPhones.add(rawPhone);

      const name = (c.name || '').trim() || `Contact ${rawPhone.slice(-4)}`;
      const tagArray = Array.isArray(c.tags)
        ? c.tags
        : (typeof c.tags === 'string' && c.tags.trim() ? c.tags.split(',').map(t => t.trim()) : []);

      validContacts.push({
        user_id: req.user.id,
        name,
        phone: rawPhone,
        tags: tagArray,
        notes: c.notes || null
      });
    }

    if (validContacts.length === 0) {
      return res.status(400).json({ error: 'No valid phone numbers found in the uploaded list.' });
    }

    // Upsert in batches of 200
    let insertedCount = 0;
    const batchSize = 200;
    for (let i = 0; i < validContacts.length; i += batchSize) {
      const chunk = validContacts.slice(i, i + batchSize);
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .upsert(chunk, { onConflict: 'user_id,phone' })
        .select();

      if (error) {
        console.error('Batch upsert error:', error);
      } else {
        insertedCount += (data?.length || chunk.length);
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${validContacts.length} contacts!`,
      count: validContacts.length
    });
  } catch (error) {
    console.error('Bulk add contacts error:', error);
    res.status(500).json({ error: error.message || 'Failed to import contacts' });
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
