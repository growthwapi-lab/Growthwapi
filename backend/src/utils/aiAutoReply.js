const axios = require('axios');
const { OpenAI } = require('openai');
const { supabaseAdmin } = require('../config/supabase');
const { getActiveSubscription } = require('../utils/trialLimits');

const WA_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const WA_HEADERS = {
  Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAI({ apiKey });
};

// Get plan from actual active subscription
async function getUserPlan(userId) {
  const activeSub = await getActiveSubscription(userId);
  if (activeSub) {
    return (activeSub.plan_type || '').toLowerCase();
  }
  return 'trial';
}


const handleIncomingAiReply = async (userId, message, phoneId) => {
  try {
    const fromNumber = message.from;
    const messageText = message.text?.body || message.button?.text || message.interactive?.button_reply?.title;
    if (!messageText) return;

    // 1. Fetch active AI Agent for this user
    const { data: agent, error: agentErr } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!agent || agentErr) return;

    // 2. Verify User Plan & Quota using actual subscription
    const plan = await getUserPlan(userId);

    let monthlyLimit = 500; // default Growth
    if (plan === 'pro') monthlyLimit = 2000;
    else if (plan === 'starter') monthlyLimit = 100;
    else if (plan === 'trial') monthlyLimit = 50; // Allow 50 free replies in trial!

    // Check if quota exceeded
    if ((agent.ai_replies_this_month || 0) >= monthlyLimit) {
      const quotaMsg = "Our AI assistant monthly response quota has been reached. A human team member will assist you shortly!";
      await sendWhatsAppText(fromNumber, quotaMsg, phoneId);
      await saveOutboundMessage(userId, fromNumber, quotaMsg, true, phoneId);
      return;
    }

    // 3. Fetch recent conversation context (last 5 messages)
    const { data: recentMessages } = await supabaseAdmin
      .from('messages')
      .select('direction, content, sent_at')
      .eq('user_id', userId)
      .or(`from_number.eq.${fromNumber},to_number.eq.${fromNumber}`)
      .order('sent_at', { ascending: false })
      .limit(6);

    const historyContext = (recentMessages || [])
      .reverse()
      .map((m) => {
        const text = m.content?.text?.body || m.content?.body || (typeof m.content === 'string' ? m.content : '');
        return `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${text}`;
      })
      .filter(Boolean)
      .join('\n');

    // 4. Retrieve Knowledge Chunks (RAG)
    const openai = getOpenAIClient();
    let relevantChunksText = '';

    if (openai) {
      try {
        // Try embedding search or RPC match
        const embRes = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: messageText,
        });
        const queryVector = embRes.data[0].embedding;

        // Call RPC if exists, or fallback to fetching top chunks
        const { data: matchedChunks, error: matchErr } = await supabaseAdmin.rpc(
          'match_knowledge_chunks',
          {
            query_embedding: queryVector,
            match_threshold: 0.3,
            match_count: 5,
            p_agent_id: agent.id,
          }
        );

        if (!matchErr && matchedChunks && matchedChunks.length > 0) {
          relevantChunksText = matchedChunks.map((c) => c.content).join('\n---\n');
        }
      } catch (embErr) {
        console.warn('Vector match failed or RPC missing, using fallback chunk search:', embErr.message);
      }
    }

    // Fallback if vector search returned nothing or openai key wasn't available
    if (!relevantChunksText) {
      const keywords = messageText.split(' ').filter((w) => w.length > 3).slice(0, 3);
      let query = supabaseAdmin
        .from('knowledge_chunks')
        .select('content')
        .eq('agent_id', agent.id)
        .limit(5);

      if (keywords.length > 0) {
        query = query.ilike('content', `%${keywords[0]}%`);
      }

      const { data: fallbackChunks } = await query;
      if (fallbackChunks && fallbackChunks.length > 0) {
        relevantChunksText = fallbackChunks.map((c) => c.content).join('\n---\n');
      }
    }

    // 5. Generate AI Reply using GPT-4o-mini
    let aiResponseText = "Thank you for reaching out! We've logged your message and our team will get back to you shortly.";
    let needsHuman = false;

    if (openai) {
      const systemPrompt = `You are an AI Customer Support Agent for ${agent.name} (${agent.business_type}).
Your primary job is to answer customer questions accurately on WhatsApp using the Knowledge Base below and custom instructions.

CUSTOM INSTRUCTIONS:
${agent.custom_instructions || 'Be polite, helpful, and concise.'}

KNOWLEDGE BASE:
${relevantChunksText || 'No specific knowledge base article found.'}

CONVERSATION HISTORY:
${historyContext}

RULES:
1. Keep replies friendly, concise (suitable for WhatsApp), and well-formatted.
2. Rely strictly on the Knowledge Base and Custom Instructions.
3. If the user explicitly asks for human support or if the answer is missing from the Knowledge Base, set "needs_human" to true.
4. Output MUST be valid JSON with keys: "reply" (string) and "needs_human" (boolean).`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageText },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (responseContent) {
        try {
          const parsed = JSON.parse(responseContent);
          aiResponseText = parsed.reply || aiResponseText;
          needsHuman = Boolean(parsed.needs_human);
        } catch (e) {
          aiResponseText = responseContent;
        }
      }

      // Log usage and cost
      const usage = completion.usage;
      if (usage) {
        const promptTokens = usage.prompt_tokens || 0;
        const completionTokens = usage.completion_tokens || 0;
        const totalTokens = usage.total_tokens || 0;
        // Pricing for gpt-4o-mini ($0.15/1M prompt, $0.60/1M completion)
        const costUSD = (promptTokens * 0.00000015) + (completionTokens * 0.0000006);

        await supabaseAdmin.from('ai_usage_logs').insert({
          agent_id: agent.id,
          user_id: userId,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          tokens_used: totalTokens,
          cost_usd: costUSD,
        });
      }
    }

    // 6. Send response via Meta WhatsApp API
    await sendWhatsAppText(fromNumber, aiResponseText, phoneId);

    // 7. Save outbound message to DB
    await saveOutboundMessage(userId, fromNumber, aiResponseText, needsHuman, phoneId);

    // 8. Increment monthly reply count
    await supabaseAdmin
      .from('ai_agents')
      .update({
        ai_replies_this_month: (agent.ai_replies_this_month || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agent.id);

  } catch (err) {
    console.error('Error in handleIncomingAiReply:', err);
  }
};

const sendWhatsAppText = async (to, text, phoneId) => {
  try {
    const targetPhoneId = phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const waUrl = `https://graph.facebook.com/v18.0/${targetPhoneId}/messages`;
    await axios.post(
      waUrl,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
      },
      { headers: WA_HEADERS }
    );
  } catch (err) {
    console.error('Failed to send AI response WhatsApp message:', err.response?.data || err.message);
  }
};

const saveOutboundMessage = async (userId, toNumber, text, needsHuman, phoneId) => {
  try {
    await supabaseAdmin.from('messages').insert({
      user_id: userId,
      wa_account_id: process.env.WHATSAPP_WABA_ID,
      from_number: phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID,
      to_number: toNumber,
      message_type: 'text',
      direction: 'outbound',
      content: { messaging_product: 'whatsapp', to: toNumber, type: 'text', text: { body: text } },
      status: 'sent',
      needs_human: needsHuman,
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to save AI outbound message:', err.message);
  }
};

module.exports = { handleIncomingAiReply };
