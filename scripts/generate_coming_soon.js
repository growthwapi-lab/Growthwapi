const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const logoPath = path.join(__dirname, '../frontend/public/logo.png.png');
let logoBase64 = '';
if (fs.existsSync(logoPath)) {
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
}

const outDir = path.join(__dirname, '../instagram_carousels/launch_coming_soon');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1350px;
      background: radial-gradient(circle at 50% 10%, #1E3A5F 0%, #0A192F 55%, #050D1A 100%);
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 70px 65px;
      position: relative;
      overflow: hidden;
    }
    
    /* Subtle decorative background elements */
    .glow-1 {
      position: absolute;
      top: -120px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(249, 115, 22, 0.22) 0%, transparent 70%);
      filter: blur(50px);
    }
    .glow-2 {
      position: absolute;
      bottom: 100px;
      left: -150px;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(37, 211, 102, 0.18) 0%, transparent 70%);
      filter: blur(60px);
    }
    
    /* Top Bar */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.07);
      padding: 12px 24px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
    }
    .logo-img {
      height: 38px;
      object-fit: contain;
    }
    .badge-pill {
      background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 9999px;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      box-shadow: 0 8px 25px rgba(249, 115, 22, 0.4);
    }
    
    /* Hero Content */
    .hero-content {
      z-index: 10;
      text-align: center;
      margin-top: 10px;
    }
    .coming-tag {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(37, 211, 102, 0.12);
      border: 1px solid rgba(37, 211, 102, 0.4);
      color: #25D366;
      padding: 10px 24px;
      border-radius: 9999px;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 24px;
      letter-spacing: 1px;
    }
    .coming-tag .dot {
      width: 10px;
      height: 10px;
      background: #25D366;
      border-radius: 50%;
      box-shadow: 0 0 12px #25D366;
    }
    .hero-title {
      font-size: 58px;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -1px;
      margin-bottom: 20px;
    }
    .hero-title span.orange {
      color: #F97316;
      background: linear-gradient(135deg, #FFA053 0%, #F97316 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-title span.green {
      color: #25D366;
    }
    .hero-subtitle {
      font-size: 22px;
      color: #94A3B8;
      font-weight: 500;
      line-height: 1.5;
      max-width: 820px;
      margin: 0 auto;
    }

    /* VIP Card */
    .vip-card {
      background: rgba(15, 23, 42, 0.75);
      border: 2px solid rgba(249, 115, 22, 0.4);
      border-radius: 28px;
      padding: 36px 40px;
      backdrop-filter: blur(15px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      z-index: 10;
      position: relative;
    }
    .vip-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .vip-title {
      font-size: 24px;
      font-weight: 800;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .vip-badge {
      background: rgba(249, 115, 22, 0.15);
      color: #F97316;
      border: 1px solid #F97316;
      font-size: 14px;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 9999px;
      letter-spacing: 1px;
    }
    
    .perks-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    .perk-item {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 16px 20px;
      border-radius: 16px;
    }
    .perk-icon {
      font-size: 26px;
    }
    .perk-text {
      font-size: 18px;
      font-weight: 700;
      color: #E2E8F0;
    }
    .perk-sub {
      font-size: 13px;
      color: #94A3B8;
      font-weight: 500;
      margin-top: 2px;
    }
    
    /* Scarcity & CTA */
    .bottom-section {
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 20px;
      text-align: center;
    }
    .scarcity-bar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #FCA5A5;
      padding: 10px 24px;
      border-radius: 9999px;
      font-size: 16px;
      font-weight: 700;
      margin: 0 auto;
    }
    .cta-button {
      background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
      color: #ffffff;
      padding: 24px 40px;
      border-radius: 20px;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
      box-shadow: 0 12px 35px rgba(249, 115, 22, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    
    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 16px;
      color: #64748B;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>

  <!-- Top Bar -->
  <div class="top-bar">
    <div class="logo-container">
      <img src="${logoBase64}" class="logo-img" alt="Growthwapi" />
    </div>
    <div class="badge-pill">⚡ COMING SOON</div>
  </div>

  <!-- Hero Content -->
  <div class="hero-content">
    <div class="coming-tag">
      <span class="dot"></span> OFFICIAL META CLOUD API PLATFORM
    </div>
    <h1 class="hero-title">
      Something Huge Is Coming To <span class="green">WhatsApp</span> Marketing.
    </h1>
    <p class="hero-subtitle">
      No more number bans. No more replying manually from a single phone. Say hello to automated broadcasts, shared team inbox & 24/7 AI Sales Agent.
    </p>
  </div>

  <!-- VIP Founder Card -->
  <div class="vip-card">
    <div class="vip-card-header">
      <div class="vip-title">
        👑 VIP Founder Club Perks
      </div>
      <div class="vip-badge">
        PRE-REGISTRATION IS LIVE
      </div>
    </div>
    <div class="perks-grid">
      <div class="perk-item">
        <div class="perk-icon">🎁</div>
        <div>
          <div class="perk-text">10-Day VIP Access</div>
          <div class="perk-sub">Full platform free trial</div>
        </div>
      </div>
      <div class="perk-item">
        <div class="perk-icon">🏷️</div>
        <div>
          <div class="perk-text">Flat 50% OFF</div>
          <div class="perk-sub">Exclusive launch day discount</div>
        </div>
      </div>
      <div class="perk-item">
        <div class="perk-icon">📦</div>
        <div>
          <div class="perk-text">50+ WhatsApp Templates</div>
          <div class="perk-sub">High-converting sales library</div>
        </div>
      </div>
      <div class="perk-item">
        <div class="perk-icon">🛡️</div>
        <div>
          <div class="perk-text">1-on-1 Meta Setup</div>
          <div class="perk-sub">Free API & Green Tick guidance</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom CTA -->
  <div class="bottom-section">
    <div class="scarcity-bar">
      🔥 STRICTLY LIMITED TO FIRST 100 BUSINESSES
    </div>
    <div class="cta-button">
      Claim Your Free VIP Pass → (Link in Bio)
    </div>
    <div class="footer-bar">
      <span>🌐 growthwapi.in</span>
      <span>🔒 100% Ban-Safe · Meta Cloud API</span>
      <span>💬 DM "VIP" for Instant Link</span>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = path.join(__dirname, '../temp_coming_soon.html');
const outPngPath = path.join(outDir, 'coming_soon_post.png');

fs.writeFileSync(tempHtmlPath, html, 'utf8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

try {
  console.log('Rendering Coming Soon Post PNG...');
  execSync(`powershell.exe -Command "Start-Process -FilePath '${chromePath}' -ArgumentList '--headless=new', '--disable-gpu', '--window-size=1080,1350', '--hide-scrollbars', '--screenshot=${outPngPath}', 'file:///${tempHtmlPath.replace(/\\\\/g, '/')}' -Wait"`);
  console.log('Generated successfully at:', outPngPath);
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
} catch (e) {
  console.error('Error rendering:', e);
}
