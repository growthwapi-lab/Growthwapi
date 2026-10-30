const express = require('express');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { getActiveSubscription } = require('../utils/trialLimits');

const router = express.Router();

// Helper to determine team member limit based on plan
async function getTeamLimitsForUser(userId) {
  const activeSub = await getActiveSubscription(userId);
  const planType = activeSub?.plan_type || 'trial';

  let maxMembers = 1; // Default for trial & starter
  if (planType === 'growth') {
    maxMembers = 5;
  } else if (planType === 'pro') {
    maxMembers = 9999; // Unlimited
  } else if (planType === 'starter') {
    maxMembers = 1;
  }

  return {
    planType,
    maxMembers,
    isPaid: Boolean(activeSub),
    sub: activeSub
  };
}

// 1. GET /api/team - List team members & quota
router.get('/', auth, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { planType, maxMembers, isPaid } = await getTeamLimitsForUser(ownerId);

    // Get owner details
    const { data: ownerUser } = await supabaseAdmin
      .from('users')
      .select('name, email, business_name')
      .eq('id', ownerId)
      .maybeSingle();

    // Get all team members created by this owner
    let members = [];
    const { data: teamRows, error: teamErr } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true });

    if (!teamErr && teamRows) {
      members = teamRows;
    }

    const totalUsed = 1 + members.length; // Owner + agents
    const canAddMore = maxMembers === 9999 ? true : totalUsed < maxMembers;

    res.json({
      plan: planType,
      isPaid,
      maxMembers: maxMembers === 9999 ? 'Unlimited' : maxMembers,
      maxMembersNumber: maxMembers,
      totalUsed,
      canAddMore,
      isAgent: Boolean(req.user.isAgent),
      owner: {
        id: ownerId,
        name: ownerUser?.name || req.user.email?.split('@')[0] || 'Owner',
        email: ownerUser?.email || req.user.email,
        businessName: ownerUser?.business_name || '',
        role: 'Admin / Owner'
      },
      members
    });
  } catch (error) {
    console.error('Error in GET /api/team:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch team members' });
  }
});

// 2. POST /api/team/invite - Create/Add a new team member
router.post('/invite', auth, async (req, res) => {
  try {
    if (req.user.isAgent) {
      return res.status(403).json({ error: 'Only workspace owners can add team members.' });
    }

    const ownerId = req.user.id;
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check plan quota limits
    const { planType, maxMembers } = await getTeamLimitsForUser(ownerId);

    // Count existing members
    const { count, error: countErr } = await supabaseAdmin
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId);

    const existingCount = (count || 0) + 1; // +1 for owner

    if (maxMembers !== 9999 && existingCount >= maxMembers) {
      if (planType === 'starter' || planType === 'trial') {
        return res.status(403).json({
          error: 'Your Starter/Trial plan includes 1 user only. Please upgrade to Growth Plan to add up to 5 team members.'
        });
      } else if (planType === 'growth') {
        return res.status(403).json({
          error: 'Growth Plan limit reached (5 team members). Please upgrade to Pro Plan for unlimited team members.'
        });
      }
    }

    // Check if email already added to this team
    const { data: existingMember } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingMember) {
      return res.status(400).json({ error: 'A team member with this email already exists in your workspace.' });
    }

    // Get owner details for metadata
    const { data: ownerUser } = await supabaseAdmin
      .from('users')
      .select('name, business_name')
      .eq('id', ownerId)
      .maybeSingle();

    // Create user in Supabase Auth via admin API
    let memberUserId = null;
    try {
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: name.trim(),
          owner_id: ownerId,
          role: role || 'agent',
          business_name: ownerUser?.business_name || '',
          is_team_member: true
        }
      });

      if (authErr) {
        // If user already exists in auth, try to update metadata
        if (authErr.message?.toLowerCase().includes('already registered')) {
          // Find user id
          const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();
          const found = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
          if (found) {
            memberUserId = found.id;
            await supabaseAdmin.auth.admin.updateUserById(found.id, {
              password,
              user_metadata: {
                ...found.user_metadata,
                name: name.trim(),
                owner_id: ownerId,
                role: role || 'agent',
                business_name: ownerUser?.business_name || '',
                is_team_member: true
              }
            });
          } else {
            return res.status(400).json({ error: authErr.message });
          }
        } else {
          return res.status(400).json({ error: authErr.message });
        }
      } else {
        memberUserId = authUser.user.id;
      }
    } catch (createErr) {
      console.error('Error creating auth user:', createErr);
      return res.status(500).json({ error: 'Failed to create agent credentials in auth system.' });
    }

    // Insert into team_members table
    const { data: newRow, error: insertErr } = await supabaseAdmin
      .from('team_members')
      .insert({
        owner_id: ownerId,
        member_user_id: memberUserId,
        name: name.trim(),
        email: normalizedEmail,
        role: role || 'agent',
        status: 'active'
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting team_members record:', insertErr);
      return res.status(500).json({ error: 'Failed to save team member record.' });
    }

    res.status(201).json({
      message: `Team member ${name} added successfully!`,
      member: newRow
    });
  } catch (error) {
    console.error('Error in POST /api/team/invite:', error);
    res.status(500).json({ error: error.message || 'Failed to add team member' });
  }
});

// 3. DELETE /api/team/:id - Remove a team member
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.isAgent) {
      return res.status(403).json({ error: 'Only workspace owners can remove team members.' });
    }

    const ownerId = req.user.id;
    const { id } = req.params;

    const { data: member, error: findErr } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (findErr || !member) {
      return res.status(404).json({ error: 'Team member not found.' });
    }

    // Delete record from team_members
    await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', id);

    // If auth user exists, remove or unlink owner_id
    if (member.member_user_id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(member.member_user_id);
      } catch (delUserErr) {
        console.warn('Could not delete auth user:', delUserErr.message);
      }
    }

    res.json({ message: `Team member ${member.name} removed successfully.` });
  } catch (error) {
    console.error('Error in DELETE /api/team/:id:', error);
    res.status(500).json({ error: error.message || 'Failed to delete team member' });
  }
});

// 4. PUT /api/team/:id/status - Toggle active/suspended
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.isAgent) {
      return res.status(403).json({ error: 'Only workspace owners can update team members.' });
    }

    const ownerId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const { data: updated, error } = await supabaseAdmin
      .from('team_members')
      .update({ status: status === 'suspended' ? 'suspended' : 'active' })
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Status updated', member: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
