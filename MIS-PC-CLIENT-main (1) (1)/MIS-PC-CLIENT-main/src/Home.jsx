import React, { useEffect, useState } from "react";

const LOGO_URL =
  "https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom.png";

/* Route of your Dashboard page. Change it to match your router. */
const DASHBOARD_PATH = "/login";

/* Put the Pune plant photo in your /public folder with this name.
   Until it exists, the hero shows the steel-blue industrial fallback below. */
const HERO_IMAGE = "/pg-bg.png";

const COMPANY = {
  location: "Pune",
  hours: "Mon - Sat: 24 x 7 Production",
  address: "PG Technoplast, Pune, Maharashtra, India",
};

const NAV = [
  { label: "Home", href: "/", active: true },
  { label: "Dashboard", href: DASHBOARD_PATH },
];

const TRUST = [
  { title: "Live Line Data", sub: "UPDATED EVERY SCAN" },
  { title: "Zero Paperwork", sub: "100% DIGITAL TRACKING" },
  { title: "Multi-Line Ready", sub: "PCB · AC · APPLIANCE" },
];

const FEATURES = [
  { title: "Real-Time Tracking", text: "Every board scan logged by station, serial and time." },
  { title: "Station Mapping", text: "Know exactly where each unit is on the production line." },
  { title: "Full Traceability", text: "Trace any serial number back through every process." },
];

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="#6b7280" strokeWidth="1.3" />
    <path d="M5 8.3l2 2 4-4.3" stroke="#6b7280" strokeWidth="1.3" fill="none" />
  </svg>
);

export default function Home() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const heroBg = [
    "linear-gradient(90deg, rgba(14,20,28,.82) 0%, rgba(14,20,28,.55) 55%, rgba(14,20,28,.35) 100%)",
    `url(${HERO_IMAGE})`,
    "radial-gradient(ellipse at 75% 30%, rgba(245,184,0,.22), transparent 55%)",
    "repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 48px)",
    "repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px 48px)",
    "linear-gradient(135deg, #34414f, #10161d)",
  ].join(", ");

  return (
    <div className="smes">
      <style>{css}</style>

      {/* ---------- Utility bar ---------- */}
      <div className="util">
        <div className="wrap util-in">
          <div className="util-left">
            <button className="loc">{COMPANY.location} ▾</button>
            <span className="util-item"><i>◷</i> {COMPANY.hours}</span>
            <span className="util-item"><i>⌖</i> {COMPANY.address}</span>
          </div>
          <div className="util-right">
            <span>
              {now.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="util-clock">{now.toLocaleTimeString("en-GB")}</span>
          </div>
        </div>
      </div>

      {/* ---------- Brand header ---------- */}
      <header className="head">
        <div className="wrap head-in">
          <div className="brand">
            <img src={LOGO_URL} alt="PG Group" className="logo" />
            <div className="brand-sep" />
            <div>
              <div className="brand-name">SMES</div>
              <div className="brand-sub">Smart Manufacturing Execution System</div>
            </div>
          </div>
          <div className="trust">
            {TRUST.map((t) => (
              <div className="trust-item" key={t.title}>
                <Check />
                <div>
                  <div className="trust-t">{t.title}</div>
                  <div className="trust-s">{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <a href={DASHBOARD_PATH} className="cta">Open Dashboard</a>
        </div>
      </header>

      

      {/* ---------- Hero ---------- */}
      <section className="hero" style={{ backgroundImage: heroBg }}>
        <div className="wrap hero-in">
          <div className="hero-welcome">Welcome To</div>
          <h1 className="hero-title">
            <span>S</span><span>M</span><span className="y">E</span><span className="y">S</span>
          </h1>
          <div className="hero-tag">Smart Manufacturing Execution System</div>
          <p className="hero-p">
            Scan every board at every station and watch it move across the production
            line in real time. Built for the PG Electroplast and PG Technoplast shop floor.
          </p>
          <div className="hero-btns">
            <a href={DASHBOARD_PATH} className="btn-y">Go to Dashboard →</a>
          </div>
        </div>

        <div className="wrap feat">
          {FEATURES.map((f, i) => (
            <div className={"feat-card" + (i === 0 ? " feat-y" : "")} key={f.title}>
              <div className="feat-t">{f.title}</div>
              <div className="feat-x">{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="foot">
        <div className="wrap foot-in">
          <span>© {now.getFullYear()} PG Group · SMES</span>
          <span>Scanner connected · Server online</span>
        </div>
      </footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&family=Rubik:wght@500;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

.smes{--y:#f5b800;--ink:#1b2430;--muted:#6b7686;--line:#e2e5ea;
  font-family:'Barlow',system-ui,sans-serif;background:#f4f5f7;color:var(--ink);
  min-height:100vh;display:flex;flex-direction:column}
.smes *{box-sizing:border-box}
.smes a{text-decoration:none;color:inherit}
.smes button{font-family:inherit;cursor:pointer}
.wrap{max-width:1240px;margin:0 auto;padding:0 28px;width:100%}

/* utility */
.util{background:#ececec;font-size:13px;color:#555}
.util-in{display:flex;justify-content:space-between;align-items:center;height:48px;gap:16px;flex-wrap:wrap}
.util-left{display:flex;align-items:center;gap:26px;flex-wrap:wrap}
.loc{background:#16191d;color:#fff;border:2px solid var(--y);font-size:12px;font-weight:700;padding:6px 14px;border-radius:3px}
.util-item i{color:var(--y);font-style:normal;margin-right:6px;font-size:14px}
.util-right{display:flex;gap:16px;align-items:center}
.util-clock{font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--ink)}

/* header */
.head{background:#fff}
.head-in{display:flex;align-items:center;justify-content:space-between;gap:24px;height:78px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:16px}
.logo{height:46px;width:auto;object-fit:contain}
.brand-sep{width:1px;height:40px;background:var(--line)}
.brand-name{font-family:'Rubik',sans-serif;font-weight:800;font-size:28px;letter-spacing:2px;line-height:1}
.brand-sub{font-size:12px;color:var(--muted);margin-top:4px}
.trust{display:flex;gap:30px}
.trust-item{display:flex;gap:9px;align-items:flex-start}
.trust-t{font-size:13px;font-weight:600;line-height:1.1}
.trust-s{font-size:10px;color:#9aa3af;letter-spacing:.6px;margin-top:3px}
.cta{background:var(--y);font-weight:700;font-size:13px;padding:13px 22px;border-radius:3px;transition:.15s}
.cta:hover{background:#ffc928}

/* nav */
.nav{background:#16191d}
.nav-in{display:flex;justify-content:space-between;align-items:center;height:56px;gap:16px}
.nav ul{list-style:none;margin:0;padding:0;display:flex;height:100%}
.nav li{height:100%;display:flex;align-items:center;padding:0 22px;font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#fff;position:relative}
.nav li:first-child{padding-left:0}
.nav li.on::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--y)}
.nav li:not(.on):hover{color:var(--y)}
.nav-user{color:#aab2bd;font-size:12px;display:flex;align-items:center;gap:8px}
.dot{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;animation:pulse 1.6s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}

/* hero */
.hero{position:relative;flex:1;background-size:cover;background-position:center;min-height:560px;color:#fff;padding-top:84px}
.hero-in{padding-bottom:170px}
.hero-welcome{font-family:'Rubik',sans-serif;font-weight:500;font-size:40px;color:var(--y);letter-spacing:.5px}
.hero-title{margin:0;font-family:'Rubik',sans-serif;font-weight:800;font-size:112px;line-height:1;letter-spacing:4px}
.hero-title .y{color:var(--y)}
.hero-tag{font-family:'Barlow Condensed',sans-serif;font-size:26px;letter-spacing:3px;text-transform:uppercase;margin:6px 0 14px}
.hero-p{max-width:540px;font-size:16px;line-height:1.65;color:#e5e9ee;margin:0 0 28px}
.hero-btns{display:flex;gap:14px;flex-wrap:wrap}
.btn-y{display:inline-block;background:var(--y);color:#16191d;font-weight:700;font-size:14px;padding:16px 32px;border-radius:3px;transition:.15s}
.btn-y:hover{background:#ffc928;transform:translateY(-2px)}

.feat{position:absolute;bottom:0;left:50%;transform:translateX(-50%);display:grid;grid-template-columns:repeat(3,1fr)}
.feat-card{background:rgba(22,25,29,.88);padding:26px 28px;min-height:110px}
.feat-y{background:var(--y);color:#16191d}
.feat-t{font-family:'Rubik',sans-serif;font-weight:500;font-size:20px;margin-bottom:8px}
.feat-card:not(.feat-y) .feat-t{color:var(--y)}
.feat-x{font-size:14px;line-height:1.5;opacity:.9}

.foot{background:#16191d;color:#9aa3af;font-size:12px}
.foot-in{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;padding-top:18px;padding-bottom:18px}

@media (max-width:1000px){
  .trust{display:none}
  .hero-title{font-size:80px}
  .feat{position:static;transform:none;grid-template-columns:1fr;padding:0}
  .hero-in{padding-bottom:40px}
  .nav-user{display:none}
}
@media (max-width:640px){
  .wrap{padding:0 16px}
  .util-left .util-item:last-child{display:none}
  .hero-welcome{font-size:28px}
  .hero-title{font-size:60px}
}
`;