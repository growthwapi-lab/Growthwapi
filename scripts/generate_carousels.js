const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const outDir1 = path.join(rootDir, 'instagram_carousels', 'post_1_what_is_growthwapi');
const outDir2 = path.join(rootDir, 'instagram_carousels', 'post_2_partner_program');
const tempDir = path.join(rootDir, 'temp_slides');

fs.mkdirSync(outDir1, { recursive: true });
fs.mkdirSync(outDir2, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const logoPath = path.join(rootDir, 'frontend', 'public', 'logo.png.png');
const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function renderHtml(title, slideNum, totalSlides, bgClass, contentHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 70px 75px 60px 75px;
    }
    .bg-navy { background: radial-gradient(circle at top right, #1E3A8A 0%, #0F172A 70%, #020617 100%); color: #FFFFFF; }
    .bg-white-theme { background: #FFFFFF; color: #0F172A; }
    .bg-orange-theme { background: linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FB923C 100%); color: #FFFFFF; }
    .bg-soft-gray { background: #F8FAFC; color: #0F172A; }
    .bg-green-theme { background: radial-gradient(circle at top right, #047857 0%, #064E3B 70%, #022C22 100%); color: #FFFFFF; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .logo-img {
      height: 54px;
      object-fit: contain;
    }
    .slide-badge {
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      font-weight: 700;
      padding: 8px 20px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: inherit;
    }
    .slide-badge-dark {
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      color: #64748B;
    }

    .main-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 40px 0;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 25px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      font-family: 'Inter', sans-serif;
      font-size: 22px;
      font-weight: 600;
      color: inherit;
      opacity: 0.85;
    }
    .footer-dark {
      border-top: 1px solid #E2E8F0;
      color: #64748B;
    }

    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 10px 24px;
      border-radius: 9999px;
      width: fit-content;
      margin-bottom: 24px;
    }
    .pill-orange { background: #FFEDD5; color: #EA580C; border: 1.5px solid #FDBA74; }
    .pill-green { background: #DCFCE7; color: #15803D; border: 1.5px solid #86EFAC; }
    .pill-white { background: rgba(255,255,255,0.2); color: #FFFFFF; border: 1.5px solid rgba(255,255,255,0.4); }

    .glow-orange { color: #FB923C; }
    .glow-green { color: #4ADE80; }
  </style>
</head>
<body class="${bgClass}">
  <div class="header">
    <img src="${logoBase64}" class="logo-img" alt="Growthwapi" style="${bgClass.includes('white') || bgClass.includes('soft-gray') ? '' : 'filter: brightness(0) invert(1);'}">
    <div class="slide-badge ${bgClass.includes('white') || bgClass.includes('soft-gray') ? 'slide-badge-dark' : ''}">${slideNum} / ${totalSlides}</div>
  </div>

  <div class="main-body">
    ${contentHtml}
  </div>

  <div class="footer ${bgClass.includes('white') || bgClass.includes('soft-gray') ? 'footer-dark' : ''}">
    <span>@growthwapi.in</span>
    <span>${slideNum === totalSlides ? 'Save & Share 🚀' : 'Swipe Next 👉'}</span>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// POST 1 SLIDES: "What is Growthwapi?"
// ─────────────────────────────────────────────────────────────
const p1_slides = [
  // Slide 1: Hook
  renderHtml('Cover', 1, 7, 'bg-navy', `
    <div class="pill-badge pill-orange">⚡ FOR SMART BUSINESS OWNERS</div>
    <h1 style="font-size: 64px; line-height: 1.15; font-weight: 900; margin-bottom: 30px;">
      Still using normal WhatsApp for business?
    </h1>
    <h2 style="font-size: 46px; line-height: 1.25; font-weight: 800; color: #FB923C; margin-bottom: 45px;">
      You are losing 70% of your customer sales every day. 📉
    </h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 15px;">
      <div style="background: rgba(239, 68, 68, 0.12); border: 2px solid rgba(239, 68, 68, 0.4); padding: 30px; border-radius: 24px;">
        <div style="font-size: 26px; font-weight: 800; color: #FCA5A5; margin-bottom: 12px;">❌ Normal WhatsApp</div>
        <p style="font-size: 21px; line-height: 1.4; color: #FECACA;">Max 256 Limit • High Ban Risk • Manual 1-by-1 Typing</p>
      </div>
      <div style="background: rgba(34, 197, 94, 0.15); border: 2px solid rgba(34, 197, 94, 0.5); padding: 30px; border-radius: 24px;">
        <div style="font-size: 26px; font-weight: 800; color: #86EFAC; margin-bottom: 12px;">✅ Growthwapi API</div>
        <p style="font-size: 21px; line-height: 1.4; color: #DCFCE7;">Unlimited Broadcast • 0% Ban Risk • 24/7 AI Chatbot</p>
      </div>
    </div>
  `),

  // Slide 2: Pain points
  renderHtml('Pain Points', 2, 7, 'bg-white-theme', `
    <div class="pill-badge pill-orange">⚠️ THE BIG MISTAKE</div>
    <h1 style="font-size: 58px; font-weight: 900; line-height: 1.15; color: #0F172A; margin-bottom: 40px;">
      The 3 Nightmares of Regular WhatsApp:
    </h1>
    <div style="display: flex; flex-direction: column; gap: 25px;">
      <div style="display: flex; gap: 24px; align-items: flex-start; background: #FEF2F2; border-left: 8px solid #EF4444; padding: 26px 30px; border-radius: 18px;">
        <div style="font-size: 38px;">🚫</div>
        <div>
          <h3 style="font-size: 28px; font-weight: 800; color: #991B1B; margin-bottom: 8px;">1. Number Ban Ka Darr</h3>
          <p style="font-size: 21px; color: #7F1D1D; line-height: 1.4;">Anjaan customers ko offers bhejo toh Meta aapka primary WhatsApp number permanently block kar deta hai.</p>
        </div>
      </div>
      <div style="display: flex; gap: 24px; align-items: flex-start; background: #FFF7ED; border-left: 8px solid #F97316; padding: 26px 30px; border-radius: 18px;">
        <div style="font-size: 38px;">⏳</div>
        <div>
          <h3 style="font-size: 28px; font-weight: 800; color: #9A3412; margin-bottom: 8px;">2. 256 Broadcast Limit</h3>
          <p style="font-size: 21px; color: #7C2D12; line-height: 1.4;">Sirf 256 logo ko broadcast jaata hai, aur woh bhi tabhi jab unhone aapka number phone me save kiya ho!</p>
        </div>
      </div>
      <div style="display: flex; gap: 24px; align-items: flex-start; background: #FEF2F2; border-left: 8px solid #DC2626; padding: 26px 30px; border-radius: 18px;">
        <div style="font-size: 38px;">😫</div>
        <div>
          <h3 style="font-size: 28px; font-weight: 800; color: #991B1B; margin-bottom: 8px;">3. Slow Manual Typing</h3>
          <p style="font-size: 21px; color: #7F1D1D; line-height: 1.4;">Enquiry aate hi turant reply nahi gaya toh customer dusri dukan ya competitor ke paas chala jaata hai.</p>
        </div>
      </div>
    </div>
  `),

  // Slide 3: Growthwapi Solution
  renderHtml('Solution', 3, 7, 'bg-navy', `
    <div class="pill-badge pill-green">🚀 OFFICIAL SOLUTION</div>
    <h1 style="font-size: 60px; font-weight: 900; line-height: 1.15; margin-bottom: 16px;">
      Meet Growthwapi ⚡
    </h1>
    <p style="font-size: 26px; color: #94A3B8; margin-bottom: 40px; font-weight: 600;">
      Official Meta WhatsApp Business API Platform Built for Indian SMBs.
    </p>
    <div style="display: flex; flex-direction: column; gap: 22px;">
      <div style="background: rgba(255,255,255,0.06); border: 2px solid rgba(255,255,255,0.15); border-radius: 22px; padding: 26px 30px; display: flex; align-items: center; gap: 25px;">
        <div style="background: #22C55E; color: white; width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; shrink: 0;">✓</div>
        <div>
          <div style="font-size: 28px; font-weight: 800; color: #FFFFFF;">0% Number Ban Risk</div>
          <div style="font-size: 20px; color: #94A3B8; margin-top: 4px;">Direct Meta Cloud API infrastructure — safe, authorized & official.</div>
        </div>
      </div>
      <div style="background: rgba(255,255,255,0.06); border: 2px solid rgba(255,255,255,0.15); border-radius: 22px; padding: 26px 30px; display: flex; align-items: center; gap: 25px;">
        <div style="background: #F97316; color: white; width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; shrink: 0;">⚡</div>
        <div>
          <div style="font-size: 28px; font-weight: 800; color: #FFFFFF;">1-Click Broadcast to Thousands</div>
          <div style="font-size: 20px; color: #94A3B8; margin-top: 4px;">Festival offers & catalogues to 10,000+ customers without saving numbers.</div>
        </div>
      </div>
      <div style="background: rgba(255,255,255,0.06); border: 2px solid rgba(255,255,255,0.15); border-radius: 22px; padding: 26px 30px; display: flex; align-items: center; gap: 25px;">
        <div style="background: #3B82F6; color: white; width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; shrink: 0;">🤖</div>
        <div>
          <div style="font-size: 28px; font-weight: 800; color: #FFFFFF;">24/7 Smart Auto-Reply Chatbot</div>
          <div style="font-size: 20px; color: #94A3B8; margin-top: 4px;">Instant price, menu & booking replies to every customer in 0.5 seconds.</div>
        </div>
      </div>
    </div>
  `),

  // Slide 4: Comparison Table
  renderHtml('Comparison', 4, 7, 'bg-soft-gray', `
    <div class="pill-badge pill-orange">⚔️ HEAD-TO-HEAD</div>
    <h1 style="font-size: 52px; font-weight: 900; line-height: 1.15; color: #0F172A; margin-bottom: 35px;">
      Normal WhatsApp vs Growthwapi
    </h1>
    <div style="background: white; border-radius: 24px; border: 2px solid #E2E8F0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <div style="display: grid; grid-template-columns: 2fr 2fr 2.5fr; background: #0F172A; color: white; padding: 22px 26px; font-size: 22px; font-weight: 800;">
        <div>Feature</div>
        <div style="color: #94A3B8;">Normal App</div>
        <div style="color: #FB923C;">Growthwapi API 🚀</div>
      </div>
      <div style="display: flex; flex-direction: column; font-size: 20px; font-weight: 600;">
        <div style="display: grid; grid-template-columns: 2fr 2fr 2.5fr; padding: 22px 26px; border-bottom: 1px solid #F1F5F9;">
          <div>Broadcast Limit</div>
          <div style="color: #EF4444;">Max 256 contacts</div>
          <div style="color: #16A34A; font-weight: 800;">Unlimited Contacts ✅</div>
        </div>
        <div style="display: grid; grid-template-columns: 2fr 2fr 2.5fr; padding: 22px 26px; border-bottom: 1px solid #F1F5F9; background: #F8FAFC;">
          <div>Save Number?</div>
          <div style="color: #EF4444;">Mandatory (Both)</div>
          <div style="color: #16A34A; font-weight: 800;">NO Need to Save ✅</div>
        </div>
        <div style="display: grid; grid-template-columns: 2fr 2fr 2.5fr; padding: 22px 26px; border-bottom: 1px solid #F1F5F9;">
          <div>Ban Risk</div>
          <div style="color: #EF4444;">Very High ⚠️</div>
          <div style="color: #16A34A; font-weight: 800;">0% (Official Meta) ✅</div>
        </div>
        <div style="display: grid; grid-template-columns: 2fr 2fr 2.5fr; padding: 22px 26px; border-bottom: 1px solid #F1F5F9; background: #F8FAFC;">
          <div>Chatbot</div>
          <div style="color: #64748B;">Basic Text Only</div>
          <div style="color: #16A34A; font-weight: 800;">24/7 Smart AI Bot 🤖</div>
        </div>
        <div style="display: grid; grid-template-columns: 2fr 2fr 2.5fr; padding: 22px 26px;">
          <div>Team Access</div>
          <div style="color: #64748B;">1-2 Phones Only</div>
          <div style="color: #16A34A; font-weight: 800;">Unlimited Team Inbox 👥</div>
        </div>
      </div>
    </div>
  `),

  // Slide 5: The Math
  renderHtml('5x Sales Formula', 5, 7, 'bg-navy', `
    <div class="pill-badge pill-orange">📈 THE 5X SALES FORMULA</div>
    <h1 style="font-size: 58px; font-weight: 900; line-height: 1.15; margin-bottom: 35px;">
      How Businesses Get 5x More Orders:
    </h1>
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 25px 30px;">
        <div style="font-size: 22px; font-weight: 800; color: #FB923C;">STEP 1: Zero Lead Drop-off</div>
        <div style="font-size: 20px; color: #E2E8F0; margin-top: 6px;">Ad ya Google se enquiry aate hi 0.5s mein chatbot photo + price bhej deta hai. Customer convert!</div>
      </div>
      <div style="background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 25px 30px;">
        <div style="font-size: 22px; font-weight: 800; color: #FB923C;">STEP 2: Instant Retargeting</div>
        <div style="font-size: 20px; color: #E2E8F0; margin-top: 6px;">Weekend ya festival par 2,000 purane customers ko 1-click offer bhejo bina kisi ad spend ke.</div>
      </div>
      <div style="background: rgba(34, 197, 94, 0.15); border: 2px solid rgba(34, 197, 94, 0.5); border-radius: 20px; padding: 28px 30px; text-align: center;">
        <div style="font-size: 32px; font-weight: 900; color: #86EFAC;">🔥 98% WhatsApp Open Rate</div>
        <div style="font-size: 20px; color: #DCFCE7; margin-top: 8px;">Email ka open rate sirf 20% hota hai — WhatsApp par har customer aapka offer padhta hai!</div>
      </div>
    </div>
  `),

  // Slide 6: Industry use cases
  renderHtml('Use Cases', 6, 7, 'bg-white-theme', `
    <div class="pill-badge pill-green">🎯 WHO IS THIS FOR?</div>
    <h1 style="font-size: 56px; font-weight: 900; line-height: 1.15; color: #0F172A; margin-bottom: 35px;">
      Built for Every Indian Business:
    </h1>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 22px; padding: 28px;">
        <div style="font-size: 36px; margin-bottom: 12px;">📚</div>
        <h3 style="font-size: 26px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">Coaching & Tutors</h3>
        <p style="font-size: 19px; color: #64748B; line-height: 1.4;">1-Click fees reminder & exam updates direct to parents' WhatsApp.</p>
      </div>
      <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 22px; padding: 28px;">
        <div style="font-size: 36px; margin-bottom: 12px;">👗</div>
        <h3 style="font-size: 26px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">Boutiques & D2C</h3>
        <p style="font-size: 19px; color: #64748B; line-height: 1.4;">New arrival stock catalogues broadcast with instant order buttons.</p>
      </div>
      <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 22px; padding: 28px;">
        <div style="font-size: 36px; margin-bottom: 12px;">🏋️</div>
        <h3 style="font-size: 26px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">Gyms & Salons</h3>
        <p style="font-size: 19px; color: #64748B; line-height: 1.4;">Membership renewals & appointment reminders to fill weekdays.</p>
      </div>
      <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 22px; padding: 28px;">
        <div style="font-size: 36px; margin-bottom: 12px;">🍔</div>
        <h3 style="font-size: 26px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">Cafes & Clinics</h3>
        <p style="font-size: 19px; color: #64748B; line-height: 1.4;">Daily offers, doctor appointments, and repeat customer marketing.</p>
      </div>
    </div>
  `),

  // Slide 7: CTA
  renderHtml('CTA', 7, 7, 'bg-orange-theme', `
    <div class="pill-badge pill-white">🎁 EXCLUSIVE OFFER</div>
    <h1 style="font-size: 64px; font-weight: 900; line-height: 1.1; margin-bottom: 24px;">
      Try Growthwapi 100% FREE for 4 Days!
    </h1>
    <p style="font-size: 24px; line-height: 1.4; color: #FFEDD5; margin-bottom: 40px; font-weight: 600;">
      No credit card required. Connect your WhatsApp in 5 minutes and see customer orders flow in.
    </p>
    <div style="background: white; border-radius: 28px; padding: 35px; color: #0F172A; box-shadow: 0 20px 40px rgba(0,0,0,0.15); margin-bottom: 30px;">
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 22px; font-weight: 700;">
        <div style="display: flex; align-items: center; gap: 12px;">✅ 50 Free Utility + 20 Marketing Messages Included</div>
        <div style="display: flex; align-items: center; gap: 12px;">✅ 1-Click Broadcast, Chatbot & Team Inbox Access</div>
        <div style="display: flex; align-items: center; gap: 12px;">✅ 1-on-1 Personal WhatsApp Setup Assistance</div>
      </div>
      <div style="margin-top: 25px; padding-top: 20px; border-top: 2px dashed #E2E8F0; text-align: center;">
        <div style="font-size: 28px; font-weight: 900; color: #EA580C;">👉 Visit: growthwapi.in</div>
      </div>
    </div>
    <p style="font-size: 22px; font-weight: 700; text-align: center; color: #FFFFFF;">
      Or DM us <strong>"GROWTH"</strong> on Instagram for a live demo! 💬
    </p>
  `)
];

// ─────────────────────────────────────────────────────────────
// POST 2 SLIDES: "Work With Us & Earn Monthly Recurring Income"
// ─────────────────────────────────────────────────────────────
const p2_slides = [
  // Slide 1: Hook
  renderHtml('Partner Cover', 1, 7, 'bg-navy', `
    <div class="pill-badge pill-green">💰 ZERO INVESTMENT EARNING PROGRAM</div>
    <h1 style="font-size: 64px; font-weight: 900; line-height: 1.15; margin-bottom: 25px;">
      Earn ₹15,000 – ₹30,000/Month from Home.
    </h1>
    <h2 style="font-size: 42px; font-weight: 800; color: #4ADE80; line-height: 1.25; margin-bottom: 40px;">
      No Coding. No Investment. 100% Genuine Recurring Software Income. 🚀
    </h2>
    <div style="background: rgba(255, 255, 255, 0.08); border: 2px solid rgba(255, 255, 255, 0.15); padding: 30px; border-radius: 24px;">
      <p style="font-size: 24px; color: #E2E8F0; line-height: 1.4;">
        Help local businesses, shops, and coaching centers automate their WhatsApp with Growthwapi. <strong>Earn up to ₹2,325 per client direct in your UPI/Bank.</strong>
      </p>
    </div>
  `),

  // Slide 2: Who is this for
  renderHtml('Who Is This For', 2, 7, 'bg-white-theme', `
    <div class="pill-badge pill-orange">👥 OPEN FOR ALL</div>
    <h1 style="font-size: 56px; font-weight: 900; line-height: 1.15; color: #0F172A; margin-bottom: 35px;">
      Who Can Join as a Partner?
    </h1>
    <div style="display: flex; flex-direction: column; gap: 22px;">
      <div style="background: #FFF7ED; border-left: 8px solid #F97316; padding: 24px 28px; border-radius: 18px;">
        <h3 style="font-size: 26px; font-weight: 800; color: #9A3412; margin-bottom: 6px;">📱 Digital Marketers & Freelancers</h3>
        <p style="font-size: 20px; color: #7C2D12;">Upsell WhatsApp automation to your existing website/ad clients. Earn monthly recurring commission without managing servers.</p>
      </div>
      <div style="background: #F0FDF4; border-left: 8px solid #22C55E; padding: 24px 28px; border-radius: 18px;">
        <h3 style="font-size: 26px; font-weight: 800; color: #166534; margin-bottom: 6px;">🎓 College Students</h3>
        <p style="font-size: 20px; color: #14532D;">Earn ₹10,000–₹25,000/month pocket money alongside college. 1-2 hours of smartphone outreach using our ready templates.</p>
      </div>
      <div style="background: #EFF6FF; border-left: 8px solid #3B82F6; padding: 24px 28px; border-radius: 18px;">
        <h3 style="font-size: 26px; font-weight: 800; color: #1E40AF; margin-bottom: 6px;">🏡 Housewives & WFH Women</h3>
        <p style="font-size: 20px; color: #1E3A8A;">Connect local boutiques, beauty salons, and home businesses. Work flexibly from home with zero investment.</p>
      </div>
    </div>
  `),

  // Slide 3: How it works
  renderHtml('How It Works', 3, 7, 'bg-soft-gray', `
    <div class="pill-badge pill-orange">⚙️ 3 SIMPLE STEPS</div>
    <h1 style="font-size: 54px; font-weight: 900; line-height: 1.15; color: #0F172A; margin-bottom: 35px;">
      How Does It Work?
    </h1>
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: flex; gap: 24px; align-items: center; background: white; border: 2px solid #E2E8F0; padding: 25px 28px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
        <div style="background: #EA580C; color: white; width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; shrink: 0;">1</div>
        <div>
          <div style="font-size: 26px; font-weight: 800; color: #0F172A;">Sign Up 100% Free</div>
          <div style="font-size: 19px; color: #64748B; margin-top: 4px;">Get your unique partner code (e.g. GW-YOURNAME-101) & live tracking link in 60 seconds.</div>
        </div>
      </div>
      <div style="display: flex; gap: 24px; align-items: center; background: white; border: 2px solid #E2E8F0; padding: 25px 28px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
        <div style="background: #2563EB; color: white; width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; shrink: 0;">2</div>
        <div>
          <div style="font-size: 26px; font-weight: 800; color: #0F172A;">Share 4-Day Free Trial</div>
          <div style="font-size: 19px; color: #64748B; margin-top: 4px;">Local businesses ko free trial offer karo (No hard selling — just share the free trial link!).</div>
        </div>
      </div>
      <div style="display: flex; gap: 24px; align-items: center; background: white; border: 2px solid #E2E8F0; padding: 25px 28px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
        <div style="background: #16A34A; color: white; width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; shrink: 0;">3</div>
        <div>
          <div style="font-size: 26px; font-weight: 800; color: #0F172A;">Earn Recurring Commission</div>
          <div style="font-size: 19px; color: #64748B; margin-top: 4px;">When client buys or renews, payouts are sent directly to your UPI ID or Bank account!</div>
        </div>
      </div>
    </div>
  `),

  // Slide 4: Exact Commission Table
  renderHtml('Commission Matrix', 4, 7, 'bg-navy', `
    <div class="pill-badge pill-green">💵 TRANSPARENT COMMISSIONS</div>
    <h1 style="font-size: 56px; font-weight: 900; line-height: 1.15; margin-bottom: 35px;">
      Exact Earning Per Client:
    </h1>
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.18); border-radius: 20px; padding: 24px 28px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 26px; font-weight: 800; color: #E2E8F0;">Starter Plan (₹999/mo)</span>
          <span style="font-size: 30px; font-weight: 900; color: #4ADE80;">₹700 Total</span>
        </div>
        <p style="font-size: 20px; color: #94A3B8;">Month 1: ₹400 • Month 2: ₹200 • Month 3: ₹100</p>
      </div>

      <div style="background: rgba(249, 115, 22, 0.15); border: 2.5px solid #F97316; border-radius: 20px; padding: 26px 28px; position: relative;">
        <div style="position: absolute; top: -14px; right: 28px; background: #F97316; color: white; font-size: 14px; font-weight: 900; padding: 4px 14px; border-radius: 999px;">MOST POPULAR</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 28px; font-weight: 800; color: #FFFFFF;">Growth Plan (₹2,999/mo)</span>
          <span style="font-size: 34px; font-weight: 900; color: #FB923C;">₹1,310 Total</span>
        </div>
        <p style="font-size: 20px; color: #FED7AA;">Month 1: ₹700 • Month 2: ₹350 • Month 3: ₹175 • Month 4: ₹85</p>
      </div>

      <div style="background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.18); border-radius: 20px; padding: 24px 28px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 26px; font-weight: 800; color: #E2E8F0;">Pro Plan (₹7,999/mo)</span>
          <span style="font-size: 30px; font-weight: 900; color: #4ADE80;">₹2,325 Total</span>
        </div>
        <p style="font-size: 20px; color: #94A3B8;">Month 1: ₹1,200 • Month 2: ₹600 • Month 3: ₹300 • M4: ₹150 • M5: ₹75</p>
      </div>
    </div>
  `),

  // Slide 5: The Math
  renderHtml('Income Projections', 5, 7, 'bg-white-theme', `
    <div class="pill-badge pill-orange">📊 REALISTIC POTENTIAL</div>
    <h1 style="font-size: 56px; font-weight: 900; line-height: 1.15; color: #0F172A; margin-bottom: 35px;">
      How Much Can You Earn?
    </h1>
    <div style="display: flex; flex-direction: column; gap: 22px;">
      <div style="background: #F8FAFC; border: 2px solid #E2E8F0; padding: 26px 30px; border-radius: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 26px; font-weight: 800; color: #0F172A;">Close 5 Clients / Month</div>
          <div style="font-size: 32px; font-weight: 900; color: #EA580C;">₹6,550</div>
        </div>
        <p style="font-size: 19px; color: #64748B; margin-top: 6px;">Part-time side hustle (Just 1 hour daily after college or household work).</p>
      </div>

      <div style="background: #F8FAFC; border: 2px solid #E2E8F0; padding: 26px 30px; border-radius: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 26px; font-weight: 800; color: #0F172A;">Close 10 Clients / Month</div>
          <div style="font-size: 32px; font-weight: 900; color: #EA580C;">₹13,100</div>
        </div>
        <p style="font-size: 19px; color: #64748B; margin-top: 6px;">Serious side-income (Close 2-3 coaching centers or gyms each week).</p>
      </div>

      <div style="background: #ECFDF5; border: 2.5px solid #10B981; padding: 26px 30px; border-radius: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 26px; font-weight: 800; color: #065F46;">Freelancer / Agency Tier</div>
          <div style="font-size: 32px; font-weight: 900; color: #059669;">₹25,000+</div>
        </div>
        <p style="font-size: 19px; color: #047857; margin-top: 6px;">Commission + Charge clients ₹2,000–₹5,000 for templates setup!</p>
      </div>
    </div>
  `),

  // Slide 6: Unfair Advantage
  renderHtml('Client Perks', 6, 7, 'bg-green-theme', `
    <div class="pill-badge pill-white">🎁 YOUR BIGGEST SELLING POINT</div>
    <h1 style="font-size: 56px; font-weight: 900; line-height: 1.15; margin-bottom: 30px;">
      Why Clients Will Buy From YOUR Link:
    </h1>
    <p style="font-size: 24px; color: #A7F3D0; margin-bottom: 35px; line-height: 1.4;">
      Jab client aapke referral code se register karega, unko extra benefits milte hain jo direct website par nahi milte!
    </p>
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.25); border-radius: 22px; padding: 26px 30px;">
        <div style="font-size: 28px; font-weight: 900; color: #FDE047; margin-bottom: 6px;">💬 +200 to +500 Bonus Messages</div>
        <p style="font-size: 20px; color: #E2E8F0; line-height: 1.4;">Starter: +200, Growth: +300, Pro: +500 free bonus messages automatically applied on their first purchase.</p>
      </div>
      <div style="background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.25); border-radius: 22px; padding: 26px 30px;">
        <div style="font-size: 28px; font-weight: 900; color: #FDE047; margin-bottom: 6px;">🤝 1-on-1 WhatsApp Setup Assistance</div>
        <p style="font-size: 20px; color: #E2E8F0; line-height: 1.4;">Client ka onboarding aur Meta API setup guide karne mein hamari team full support deti hai.</p>
      </div>
    </div>
  `),

  // Slide 7: CTA
  renderHtml('Partner CTA', 7, 7, 'bg-orange-theme', `
    <div class="pill-badge pill-white">🚀 ZERO INVESTMENT</div>
    <h1 style="font-size: 64px; font-weight: 900; line-height: 1.1; margin-bottom: 24px;">
      Start Earning Today — It's 100% Free!
    </h1>
    <p style="font-size: 24px; line-height: 1.4; color: #FFEDD5; margin-bottom: 40px; font-weight: 600;">
      No registration fee. No hidden charges. Instant access to your referral link and live dashboard.
    </p>
    <div style="background: white; border-radius: 28px; padding: 35px; color: #0F172A; box-shadow: 0 20px 40px rgba(0,0,0,0.15); margin-bottom: 30px;">
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 22px; font-weight: 700;">
        <div style="display: flex; align-items: center; gap: 12px;">✅ 100% Free Lifetime Partner Account</div>
        <div style="display: flex; align-items: center; gap: 12px;">✅ Instant Unique Referral Code & Live Tracking Link</div>
        <div style="display: flex; align-items: center; gap: 12px;">✅ Direct Bank & UPI Payouts (GPay, PhonePe, Paytm)</div>
      </div>
      <div style="margin-top: 25px; padding-top: 20px; border-top: 2px dashed #E2E8F0; text-align: center;">
        <div style="font-size: 28px; font-weight: 900; color: #EA580C;">👉 Visit: growthwapi.in/partner</div>
      </div>
    </div>
    <p style="font-size: 22px; font-weight: 700; text-align: center; color: #FFFFFF;">
      Or DM us <strong>"PARTNER"</strong> on Instagram to get started right now! 💬
    </p>
  `)
];

// Write and generate Post 1 slides
console.log('Generating Post 1 slides...');
p1_slides.forEach((html, i) => {
  const slideNum = i + 1;
  const htmlPath = path.join(tempDir, `p1_slide_${slideNum}.html`);
  const pngPath = path.join(outDir1, `slide_${slideNum}.png`);
  fs.writeFileSync(htmlPath, html, 'utf8');

  console.log(`Rendering Post 1 - Slide ${slideNum}...`);
  execSync(`powershell.exe -Command "Start-Process -FilePath '${chromePath}' -ArgumentList '--headless=new', '--disable-gpu', '--window-size=1080,1350', '--hide-scrollbars', '--screenshot=${pngPath}', 'file:///${htmlPath.replace(/\\\\/g, '/')}' -Wait"`);
});

// Write and generate Post 2 slides
console.log('Generating Post 2 slides...');
p2_slides.forEach((html, i) => {
  const slideNum = i + 1;
  const htmlPath = path.join(tempDir, `p2_slide_${slideNum}.html`);
  const pngPath = path.join(outDir2, `slide_${slideNum}.png`);
  fs.writeFileSync(htmlPath, html, 'utf8');

  console.log(`Rendering Post 2 - Slide ${slideNum}...`);
  execSync(`powershell.exe -Command "Start-Process -FilePath '${chromePath}' -ArgumentList '--headless=new', '--disable-gpu', '--window-size=1080,1350', '--hide-scrollbars', '--screenshot=${pngPath}', 'file:///${htmlPath.replace(/\\\\/g, '/')}' -Wait"`);
});

console.log('All 14 carousel slides generated successfully!');
