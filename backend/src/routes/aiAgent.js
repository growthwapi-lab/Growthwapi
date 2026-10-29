const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');
const auth = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { getActiveSubscription } = require('../utils/trialLimits');

// Helper: Get the user's actual current plan (subscription-based, not just package_type column)
async function getUserPlan(userId) {
  const activeSub = await getActiveSubscription(userId);
  if (activeSub) {
    const plan = (activeSub.plan_type || '').toLowerCase();
    return plan; // 'growth' or 'pro'
  }
  // No active subscription → treat as trial/starter (locked)
  return 'trial';
}

// Initialize OpenAI client if key is configured
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAI({ apiKey });
};

// Helper: Normalize URL string (remove trailing slash & hash)
const normalizeUrl = (urlStr) => {
  try {
    const u = new URL(urlStr);
    u.hash = '';
    let href = u.href;
    if (href.endsWith('/') && u.pathname !== '/') {
      href = href.slice(0, -1);
    }
    return href;
  } catch (e) {
    return null;
  }
};

// Helper: Crawl website and store knowledge chunks + embeddings
const crawlAndProcessWebsite = async (agentId, websiteUrl) => {
  try {
    console.log(`Starting crawl for agent ${agentId} on ${websiteUrl}`);
    let targetUrl = websiteUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const baseUrl = new URL(targetUrl);
    const rootDomain = baseUrl.hostname.replace(/^www\./i, '');
    const visitedUrls = new Set();
    const initialUrl = normalizeUrl(targetUrl) || targetUrl;
    const urlsToCrawl = [initialUrl];
    const maxPages = 20;

    // 1. Try fetching sitemap.xml to discover pages automatically
    const sitemapCandidates = [
      `${baseUrl.origin}/sitemap.xml`,
      `${baseUrl.origin}/sitemap_index.xml`,
      `${baseUrl.origin}/sitemap/sitemap.xml`,
    ];

    for (const smUrl of sitemapCandidates) {
      try {
        const smRes = await axios.get(smUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
          },
        });
        if (smRes.data && typeof smRes.data === 'string') {
          const locMatches = smRes.data.match(/<loc>(https?:\/\/[^<]+)<\/loc>/gi);
          if (locMatches) {
            for (const match of locMatches) {
              const rawLoc = match.replace(/<\/?loc>/gi, '').trim();
              const normLoc = normalizeUrl(rawLoc);
              if (normLoc) {
                try {
                  const locObj = new URL(normLoc);
                  const locDomain = locObj.hostname.replace(/^www\./i, '');
                  if (locDomain === rootDomain && !urlsToCrawl.includes(normLoc)) {
                    if (!normLoc.match(/\.(png|jpg|jpeg|gif|pdf|zip|css|js|svg|mp4|ico|woff|woff2|ttf|eot|xml)$/i)) {
                      urlsToCrawl.push(normLoc);
                    }
                  }
                } catch (e) {}
              }
            }
            console.log(`Discovered ${locMatches.length} URLs from sitemap ${smUrl}`);
          }
        }
      } catch (smErr) {
        // ignore sitemap fetch error
      }
    }

    const pageTexts = [];

    while (urlsToCrawl.length > 0 && visitedUrls.size < maxPages) {
      const currentUrl = urlsToCrawl.shift();
      if (!currentUrl || visitedUrls.has(currentUrl)) continue;
      visitedUrls.add(currentUrl);

      try {
        console.log(`Crawling (${visitedUrls.size}/${maxPages}): ${currentUrl}`);
        const response = await axios.get(currentUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
          const $ = cheerio.load(response.data);

          // Discover internal links BEFORE removing nav/header/footer tags
          $('a[href]').each((_, el) => {
            try {
              const href = $(el).attr('href');
              if (!href) return;
              const normLink = normalizeUrl(new URL(href, currentUrl).href);
              if (!normLink) return;

              const linkObj = new URL(normLink);
              const linkDomain = linkObj.hostname.replace(/^www\./i, '');

              if (linkDomain === rootDomain && !visitedUrls.has(normLink) && !urlsToCrawl.includes(normLink)) {
                // Ignore static assets
                if (!normLink.match(/\.(png|jpg|jpeg|gif|pdf|zip|css|js|svg|mp4|ico|woff|woff2|ttf|eot|xml)$/i)) {
                  urlsToCrawl.push(normLink);
                }
              }
            } catch (e) {
              // ignore invalid url
            }
          });

          // Remove non-content tags for clean text extraction
          $('script, style, noscript, nav, footer, header, iframe, svg, style').remove();

          const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
          if (bodyText.length > 50) {
            pageTexts.push({ url: currentUrl, text: bodyText });
          }
        }
      } catch (err) {
        console.warn(`Failed to crawl ${currentUrl}: ${err.message}`);
      }
    }

    // Chunk text: ~400 words per chunk with 50-word overlap
    const chunksToInsert = [];
    const openai = getOpenAIClient();

    for (const page of pageTexts) {
      const words = page.text.split(' ');
      const chunkSize = 400;
      const overlap = 50;
      let chunkIdx = 0;

      for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
        const chunkWords = words.slice(i, i + chunkSize);
        const chunkText = chunkWords.join(' ');
        if (chunkText.trim().length < 30) continue;

        let embedding = null;
        if (openai) {
          try {
            const embRes = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: chunkText,
            });
            embedding = embRes.data[0].embedding;
          } catch (embErr) {
            console.error('Error generating embedding:', embErr.message);
          }
        }

        chunksToInsert.push({
          agent_id: agentId,
          url: page.url,
          chunk_index: chunkIdx++,
          content: chunkText,
          embedding: embedding,
        });
      }
    }

    // Insert knowledge chunks in DB
    if (chunksToInsert.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('knowledge_chunks')
        .insert(chunksToInsert);

      if (insertErr) {
        console.error('Failed to insert knowledge chunks:', insertErr);
      }
    }

    // Update agent status to active and update pages_crawled
    await supabaseAdmin
      .from('ai_agents')
      .update({
        status: 'active',
        pages_crawled: visitedUrls.size,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    console.log(`Crawl completed for agent ${agentId}. Pages crawled: ${visitedUrls.size}, Chunks created: ${chunksToInsert.length}`);
  } catch (err) {
    console.error(`Crawl error for agent ${agentId}:`, err);
    await supabaseAdmin
      .from('ai_agents')
      .update({
        status: 'error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);
  }
};

// GET /api/ai-agent — Get user's AI Agent and monthly usage stats
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get plan from actual subscription or fallback to user record
    const plan = await getUserPlan(userId);
    const isLocked = plan === 'trial' || plan === 'starter';

    let quotaLimit = 0;
    if (plan === 'growth') quotaLimit = 500;
    if (plan === 'pro') quotaLimit = 2000;

    let agent = null;
    try {
      const { data } = await supabaseAdmin
        .from('ai_agents')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      agent = data || null;
    } catch (e) {
      console.warn('ai_agents query warning:', e.message);
    }

    let totalCostUSD = 0;
    let totalTokens = 0;
    if (agent) {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: logs } = await supabaseAdmin
          .from('ai_usage_logs')
          .select('cost_usd, tokens_used')
          .eq('agent_id', agent.id)
          .gte('created_at', `${currentMonth}-01T00:00:00.000Z`);

        if (logs) {
          totalCostUSD = logs.reduce((sum, l) => sum + (parseFloat(l.cost_usd) || 0), 0);
          totalTokens = logs.reduce((sum, l) => sum + (parseInt(l.tokens_used) || 0), 0);
        }
      } catch (e) {
        console.warn('ai_usage_logs query warning:', e.message);
      }
    }

    res.json({
      agent: agent,
      plan: plan || 'trial',
      isLocked,
      quotaLimit,
      monthlyUsage: agent?.ai_replies_this_month || 0,
      monthlyCostUSD: totalCostUSD.toFixed(4),
      totalTokens,
    });
  } catch (err) {
    console.error('Error fetching AI agent:', err);
    res.json({
      agent: null,
      plan: 'trial',
      isLocked: true,
      quotaLimit: 0,
      monthlyUsage: 0,
      monthlyCostUSD: '0.0000',
      totalTokens: 0,
    });
  }
});

// Helper: Process and embed custom raw text or Q&A content into knowledge_chunks
const processCustomKnowledge = async (agentId, knowledgeText, sourceLabel = 'Custom Knowledge') => {
  try {
    if (!knowledgeText || knowledgeText.trim().length < 10) return 0;

    const cleanText = knowledgeText.trim();
    const words = cleanText.split(/\s+/);
    const chunkSize = 300;
    const overlap = 40;
    const chunksToInsert = [];
    const openai = getOpenAIClient();

    let chunkIdx = 0;
    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunkContent = chunkWords.join(' ');
      if (chunkContent.trim().length < 10) continue;

      let embedding = null;
      if (openai) {
        try {
          const embRes = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: chunkContent,
          });
          embedding = embRes.data[0].embedding;
        } catch (embErr) {
          console.error('Error generating embedding for custom knowledge:', embErr.message);
        }
      }

      chunksToInsert.push({
        agent_id: agentId,
        url: sourceLabel,
        chunk_index: chunkIdx++,
        content: chunkContent,
        embedding: embedding,
      });
    }

    if (chunksToInsert.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('knowledge_chunks')
        .insert(chunksToInsert);

      if (insertErr) {
        console.error('Failed to insert custom knowledge chunks:', insertErr);
      }
    }

    return chunksToInsert.length;
  } catch (err) {
    console.error('processCustomKnowledge error:', err);
    return 0;
  }
};

// POST /api/ai-agent/create — Setup AI Agent (Supports Website & Custom Knowledge modes)
router.post('/create', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, website_url, business_type, custom_instructions, training_type, custom_knowledge } = req.body;

    const isCustomMode = training_type === 'custom';
    const finalWebsiteUrl = isCustomMode ? (website_url || 'Custom Knowledge Base') : website_url;

    if (!name || (!isCustomMode && !website_url)) {
      return res.status(400).json({ error: 'Agent Name and training source are required.' });
    }

    // Check user plan using actual subscription (not package_type column)
    const plan = await getUserPlan(userId);
    if (plan === 'starter' || plan === 'trial') {
      return res.status(403).json({
        error: 'AI Agent is available on Growth and Pro plans only. Please upgrade your plan.',
      });
    }

    // Check if agent already exists
    const { data: existingAgent } = await supabaseAdmin
      .from('ai_agents')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingAgent) {
      return res.status(400).json({ error: 'AI Agent already exists. Update or retrain your agent instead.' });
    }

    // Create agent record
    const { data: newAgent, error: createErr } = await supabaseAdmin
      .from('ai_agents')
      .insert([
        {
          user_id: userId,
          name,
          website_url: finalWebsiteUrl,
          business_type: business_type || 'Other',
          custom_instructions: custom_instructions || '',
          status: isCustomMode ? 'active' : 'crawling',
          pages_crawled: isCustomMode ? 1 : 0,
          ai_replies_this_month: 0,
        },
      ])
      .select()
      .single();

    if (createErr) throw createErr;

    if (isCustomMode) {
      // Process & store custom knowledge text immediately
      const knowledgeToProcess = (custom_knowledge || '') + '\n\n' + (custom_instructions || '');
      const insertedCount = await processCustomKnowledge(newAgent.id, knowledgeToProcess, 'Custom Knowledge Base');

      res.status(201).json({
        message: `AI Agent created with Custom Knowledge Base! (${insertedCount} knowledge chunks trained)`,
        agent: newAgent,
      });
    } else {
      // Start background website crawling & vector generation
      crawlAndProcessWebsite(newAgent.id, website_url);

      res.status(201).json({
        message: 'AI Agent created successfully! Website crawling started in background.',
        agent: newAgent,
      });
    }
  } catch (err) {
    console.error('Error creating AI agent:', err);
    res.status(500).json({ error: 'Failed to create AI Agent' });
  }
});

// POST /api/ai-agent/:id/add-knowledge — Add extra custom text/Q&A knowledge to agent
router.post('/:id/add-knowledge', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { custom_knowledge, source_label } = req.body;

    if (!custom_knowledge || custom_knowledge.trim().length < 5) {
      return res.status(400).json({ error: 'Custom knowledge text is required.' });
    }

    const { data: agent } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!agent) {
      return res.status(404).json({ error: 'AI Agent not found.' });
    }

    const chunksInserted = await processCustomKnowledge(
      agent.id,
      custom_knowledge,
      source_label || 'Custom Entry'
    );

    // Update pages_crawled / knowledge sections count
    await supabaseAdmin
      .from('ai_agents')
      .update({
        pages_crawled: (agent.pages_crawled || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    res.json({
      message: `Successfully added custom knowledge (${chunksInserted} new vector chunks trained)!`,
      chunksInserted,
    });
  } catch (err) {
    console.error('Error adding custom knowledge:', err);
    res.status(500).json({ error: 'Failed to add custom knowledge.' });
  }
});

// POST /api/ai-agent/:id/retrain — Clear chunks and re-crawl website
router.post('/:id/retrain', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: agent } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!agent) {
      return res.status(404).json({ error: 'AI Agent not found' });
    }

    // Delete existing knowledge chunks
    await supabaseAdmin
      .from('knowledge_chunks')
      .delete()
      .eq('agent_id', id);

    // Update status to crawling
    await supabaseAdmin
      .from('ai_agents')
      .update({
        status: 'crawling',
        pages_crawled: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Trigger crawl in background
    crawlAndProcessWebsite(agent.id, agent.website_url);

    res.json({ message: 'Website re-crawling initiated successfully.' });
  } catch (err) {
    console.error('Error retraining AI agent:', err);
    res.status(500).json({ error: 'Failed to retrain AI agent' });
  }
});

// PATCH /api/ai-agent/:id/toggle — Toggle agent status (active/inactive)
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: agent } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!agent) {
      return res.status(404).json({ error: 'AI Agent not found' });
    }

    const newStatus = agent.status === 'active' ? 'inactive' : 'active';

    const { data: updated, error } = await supabaseAdmin
      .from('ai_agents')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: `Agent status updated to ${newStatus}`, agent: updated });
  } catch (err) {
    console.error('Error toggling AI agent status:', err);
    res.status(500).json({ error: 'Failed to toggle AI agent status' });
  }
});

// PUT /api/ai-agent/:id/instructions — Update custom instructions
router.put('/:id/instructions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { custom_instructions, name, business_type } = req.body;

    const { data: updated, error } = await supabaseAdmin
      .from('ai_agents')
      .update({
        custom_instructions: custom_instructions ?? '',
        name: name || undefined,
        business_type: business_type || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'AI Agent settings updated successfully', agent: updated });
  } catch (err) {
    console.error('Error updating AI agent instructions:', err);
    res.status(500).json({ error: 'Failed to update AI agent settings' });
  }
});

// DELETE /api/ai-agent/:id — Delete AI Agent
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await supabaseAdmin
      .from('knowledge_chunks')
      .delete()
      .eq('agent_id', id);

    const { error } = await supabaseAdmin
      .from('ai_agents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'AI Agent deleted successfully' });
  } catch (err) {
    console.error('Error deleting AI agent:', err);
    res.status(500).json({ error: 'Failed to delete AI agent' });
  }
});

module.exports = router;
