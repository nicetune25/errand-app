"use client";
import { useState, useEffect } from "react";

const theme = {
  bg: "#0A0A0F",
  surface: "#13131A",
  card: "#1A1A24",
  accent: "#FF6B35",
  accent2: "#FFB347",
  green: "#2ECC71",
  text: "#F0EEE8",
  muted: "#888899",
  border: "#2A2A38",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: ${theme.bg};
    color: ${theme.text};
    min-height: 100vh;
    overflow-x: hidden;
  }

  .syne { font-family: 'Syne', sans-serif; }

  .screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.4s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.08); opacity: 0.85; }
  }

  @keyframes slideLeft {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(255,107,53,0.3); }
    50% { box-shadow: 0 0 40px rgba(255,107,53,0.6); }
  }

  .btn-primary {
    background: linear-gradient(135deg, ${theme.accent}, ${theme.accent2});
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 14px 28px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.25s ease;
    letter-spacing: 0.3px;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255,107,53,0.4);
  }

  .btn-outline {
    background: transparent;
    color: ${theme.text};
    border: 1.5px solid ${theme.border};
    border-radius: 14px;
    padding: 13px 28px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.25s ease;
  }
  .btn-outline:hover {
    border-color: ${theme.accent};
    color: ${theme.accent};
  }

  .input-field {
    width: 100%;
    background: ${theme.card};
    border: 1.5px solid ${theme.border};
    border-radius: 12px;
    padding: 14px 18px;
    color: ${theme.text};
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
  }
  .input-field:focus { border-color: ${theme.accent}; }
  .input-field::placeholder { color: ${theme.muted}; }

  .card {
    background: ${theme.card};
    border: 1px solid ${theme.border};
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.25s ease;
  }
  .card:hover {
    border-color: rgba(255,107,53,0.4);
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(255,107,53,0.15);
    color: ${theme.accent};
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'Syne', sans-serif;
  }

  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0; right: 0;
    background: rgba(19,19,26,0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid ${theme.border};
    display: flex;
    justify-content: space-around;
    padding: 12px 0 20px;
    z-index: 100;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s;
    padding: 6px 16px;
    border-radius: 12px;
  }

  .nav-item.active { color: ${theme.accent}; }
  .nav-item:not(.active) { color: ${theme.muted}; }
  .nav-item:hover { color: ${theme.text}; }

  .star { color: #FFD700; }

  .online-dot {
    width: 9px; height: 9px;
    background: ${theme.green};
    border-radius: 50%;
    display: inline-block;
    box-shadow: 0 0 8px rgba(46,204,113,0.6);
  }

  .ad-ticker {
    display: flex;
    animation: slideLeft 20s linear infinite;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    animation: fadeIn 0.2s ease;
  }

  .modal-sheet {
    width: 100%;
    background: ${theme.surface};
    border-radius: 28px 28px 0 0;
    padding: 24px;
    max-height: 85vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease;
    border-top: 1px solid ${theme.border};
  }

  .scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .scrollable::-webkit-scrollbar { width: 0; }

  .section-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 18px;
    border-radius: 20px;
    transition: all 0.25s;
    border: 1.5px solid ${theme.border};
    background: ${theme.card};
    flex: 1;
  }
  .section-pill:hover {
    border-color: ${theme.accent};
    background: rgba(255,107,53,0.07);
  }
`;

// ── Logo / Splash ──────────────────────────────────────────────
function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 40%, #1e1020 0%, #0A0A0F 70%)",
      gap: 24,
    }}>
      <div style={{
        width: 110, height: 110,
        background: "linear-gradient(135deg, #FF6B35, #FFB347)",
        borderRadius: 32,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "pulse 1.8s ease-in-out infinite, glow 2s ease-in-out infinite",
        boxShadow: "0 0 60px rgba(255,107,53,0.5)",
      }}>
        <span style={{ fontSize: 52 }}>🛍️</span>
      </div>
      <div style={{ textAlign: "center" }}>
        <div className="syne" style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-1px",
          background: "linear-gradient(135deg, #FF6B35, #FFB347)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          errand
        </div>
        <div style={{ color: theme.muted, fontSize: 14, marginTop: 4, letterSpacing: "2px", textTransform: "uppercase" }}>
          shop without leaving home
        </div>
      </div>
      <div style={{ width: 160, height: 3, background: theme.border, borderRadius: 4, overflow: "hidden", marginTop: 16 }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(90deg, #FF6B35, #FFB347)",
          borderRadius: 4,
          animation: "expand 2.2s ease forwards",
        }} />
        <style>{`@keyframes expand { from { width: 0%; } to { width: 100%; } }`}</style>
      </div>
    </div>
  );
}

// ── Auth ───────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({ username: "", password: "", email: "" });

  const socials = [
    { icon: "🍎", label: "Apple" },
    { icon: "G", label: "Google", style: { fontFamily: "Georgia", fontWeight: "bold", color: "#EA4335" } },
    { icon: "f", label: "Facebook", style: { fontFamily: "Georgia", fontWeight: "bold", color: "#1877F2" } },
  ];

  return (
    <div className="screen" style={{
      background: "radial-gradient(ellipse at 30% 0%, #1e0e0a 0%, #0A0A0F 60%)",
      justifyContent: "center", padding: "40px 28px",
    }}>
      {/* Logo mark */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div className="syne" style={{
          fontSize: 34, fontWeight: 800,
          background: "linear-gradient(135deg, #FF6B35, #FFB347)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>errand</div>
        <div style={{ color: theme.muted, fontSize: 13, marginTop: 2 }}>
          {mode === "login" ? "Welcome back 👋" : "Create your account"}
        </div>
      </div>

      {/* Toggle */}
      <div style={{
        display: "flex", background: theme.card, borderRadius: 14, padding: 4, marginBottom: 28, border: `1px solid ${theme.border}`,
      }}>
        {["login", "signup"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: "10px", border: "none", borderRadius: 11, cursor: "pointer",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
            background: mode === m ? "linear-gradient(135deg, #FF6B35, #FFB347)" : "transparent",
            color: mode === m ? "#fff" : theme.muted,
            transition: "all 0.25s",
          }}>
            {m === "login" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {mode === "signup" && (
          <input className="input-field" placeholder="Email address" type="email"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        )}
        <input className="input-field" placeholder="Username"
          value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
        <input className="input-field" placeholder="Password" type="password"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

        {mode === "login" && (
          <div style={{ textAlign: "right" }}>
            <span style={{ color: theme.accent, fontSize: 13, cursor: "pointer" }}>Forgot password?</span>
          </div>
        )}

        <button className="btn-primary" style={{ width: "100%", marginTop: 4 }}
          onClick={onLogin}>
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
        <div style={{ flex: 1, height: 1, background: theme.border }} />
        <span style={{ color: theme.muted, fontSize: 13 }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: theme.border }} />
      </div>

      {/* Social */}
      <div style={{ display: "flex", gap: 12 }}>
        {socials.map(s => (
          <button key={s.label} onClick={onLogin} style={{
            flex: 1, padding: "13px 0",
            background: theme.card, border: `1.5px solid ${theme.border}`,
            borderRadius: 14, cursor: "pointer", color: theme.text,
            fontSize: 18, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
            ...(s.style || {}),
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
            {s.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Ad Carousel ────────────────────────────────────────────────
const ads = [
  { bg: "linear-gradient(135deg,#FF6B35,#FF4500)", emoji: "🍕", text: "Hot deals at FoodMart — Up to 40% off!" },
  { bg: "linear-gradient(135deg,#6C63FF,#A29BFE)", emoji: "💄", text: "Beauty Week at GlowStore — Free shipping" },
  { bg: "linear-gradient(135deg,#2ECC71,#1ABC9C)", emoji: "🥦", text: "FreshFarm — Organic groceries delivered" },
  { bg: "linear-gradient(135deg,#F39C12,#E67E22)", emoji: "📱", text: "TechHub Mega Sale — Top gadgets, best prices" },
];

function AdBanner() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ads.length), 3500);
    return () => clearInterval(t);
  }, []);
  const ad = ads[idx];
  return (
    <div style={{
      background: ad.bg, borderRadius: 18, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 14,
      transition: "background 0.5s ease", cursor: "pointer",
      marginBottom: 4,
    }}>
      <span style={{ fontSize: 32 }}>{ad.emoji}</span>
      <div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>
          Sponsored
        </div>
        <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 2 }}>{ad.text}</div>
      </div>
    </div>
  );
}

// ── Home ───────────────────────────────────────────────────────
function HomeScreen({ onSection, onCart }) {
  return (
    <div className="screen scrollable" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "56px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="syne" style={{ fontSize: 26, fontWeight: 800 }}>Hey there 👋</div>
          <div style={{ color: theme.muted, fontSize: 14, marginTop: 2 }}>What are you shopping for today?</div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 22,
          background: "linear-gradient(135deg, #FF6B35, #FFB347)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, cursor: "pointer", boxShadow: "0 4px 14px rgba(255,107,53,0.4)",
        }} onClick={onCart}>
          🛒
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: "0 24px 20px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: theme.card, borderRadius: 14, padding: "13px 16px",
          border: `1px solid ${theme.border}`,
        }}>
          <span style={{ color: theme.muted, fontSize: 18 }}>🔍</span>
          <input style={{ flex: 1, background: "none", border: "none", outline: "none",
            color: theme.text, fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}
            placeholder="Search stores, shoppers, products…" />
        </div>
      </div>

      {/* Ads */}
      <div style={{ padding: "0 24px 24px" }}>
        <AdBanner />
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {ads.map((_, i) => (
            <div key={i} style={{ width: i === 0 ? 20 : 6, height: 6, borderRadius: 3,
              background: i === 0 ? theme.accent : theme.border, transition: "all 0.3s" }} />
          ))}
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: "0 24px" }}>
        <div className="syne" style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
          Browse Services
        </div>
        <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
          {/* Store */}
          <div className="section-pill" onClick={() => onSection("stores")}>
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: "linear-gradient(135deg, #FF6B35, #FF4500)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
            }}>🏪</div>
            <div>
              <div className="syne" style={{ fontWeight: 700, fontSize: 15 }}>Stores</div>
              <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>Browse & buy directly</div>
            </div>
          </div>
          {/* Shopper */}
          <div className="section-pill" onClick={() => onSection("shoppers")}>
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: "linear-gradient(135deg, #6C63FF, #A29BFE)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
            }}>🧑‍💼</div>
            <div>
              <div className="syne" style={{ fontWeight: 700, fontSize: 15 }}>Shoppers</div>
              <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>Personal shopping pros</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { icon: "🏪", count: "340+", label: "Active Stores" },
            { icon: "🧑‍💼", count: "82", label: "Live Shoppers" },
            { icon: "📦", count: "12k+", label: "Orders Done" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: theme.card, borderRadius: 16, padding: "16px 12px", textAlign: "center",
              border: `1px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div className="syne" style={{ fontWeight: 800, fontSize: 18, marginTop: 6 }}>{s.count}</div>
              <div style={{ color: theme.muted, fontSize: 11 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stores ─────────────────────────────────────────────────────
const stores = [
  { id: 1, name: "FoodMart", emoji: "🛒", category: "Groceries", rating: 4.8, reviews: 2134, orders: 18400, verified: true,
    desc: "Your go-to for fresh produce, pantry staples & daily essentials delivered fast.",
    review: "Amazing selection, delivered everything perfectly!" },
  { id: 2, name: "GlowStore", emoji: "💄", category: "Beauty", rating: 4.7, reviews: 987, orders: 5600, verified: true,
    desc: "Premium skincare, cosmetics and wellness products from top brands.",
    review: "Best beauty store on the platform, highly recommend!" },
  { id: 3, name: "TechHub", emoji: "📱", category: "Electronics", rating: 4.6, reviews: 3201, orders: 22100, verified: true,
    desc: "Gadgets, accessories, home appliances and cutting-edge tech at great prices.",
    review: "Genuine products, fast delivery. 10/10!" },
  { id: 4, name: "FreshFarm", emoji: "🥦", category: "Organic", rating: 4.9, reviews: 650, orders: 3200, verified: false,
    desc: "100% organic farm-fresh fruits and vegetables sourced locally.",
    review: "The freshest veggies I've ever had delivered!" },
  { id: 5, name: "HomeNest", emoji: "🛋️", category: "Home & Living", rating: 4.5, reviews: 1102, orders: 7800, verified: true,
    desc: "Furniture, décor, kitchen essentials and everything for your home.",
    review: "Great quality and reasonable prices. Love this store." },
];

function StoresScreen({ onBack, onStore }) {
  const [filter, setFilter] = useState("All");
  const cats = ["All", "Groceries", "Beauty", "Electronics", "Organic", "Home & Living"];
  const filtered = filter === "All" ? stores : stores.filter(s => s.category === filter);

  return (
    <div className="screen scrollable" style={{ paddingBottom: 100 }}>
      <div style={{ padding: "56px 24px 16px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: theme.card, border: `1px solid ${theme.border}`,
          borderRadius: 12, padding: "9px 13px", cursor: "pointer", fontSize: 18, color: theme.text }}>←</button>
        <div>
          <div className="syne" style={{ fontWeight: 800, fontSize: 24 }}>Stores</div>
          <div style={{ color: theme.muted, fontSize: 13 }}>{stores.length} stores available</div>
        </div>
      </div>

      {/* Category filters */}
      <div style={{ display: "flex", gap: 10, padding: "0 24px 20px", overflowX: "auto", scrollbarWidth: "none" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            flexShrink: 0, padding: "8px 16px",
            borderRadius: 20, border: "none", cursor: "pointer",
            fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13,
            background: filter === c ? "linear-gradient(135deg,#FF6B35,#FFB347)" : theme.card,
            color: filter === c ? "#fff" : theme.muted,
            transition: "all 0.2s",
          }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 24px" }}>
        {filtered.map(store => (
          <div key={store.id} className="card" onClick={() => onStore(store)} style={{ cursor: "pointer" }}>
            <div style={{ padding: "18px 18px 14px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: "linear-gradient(135deg, #1e1020, #2a1a30)",
                  border: `2px solid ${theme.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0,
                }}>{store.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="syne" style={{ fontWeight: 700, fontSize: 16 }}>{store.name}</span>
                    {store.verified && <span style={{ fontSize: 14 }}>✅</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                    <span className="tag">{store.category}</span>
                    <span style={{ color: "#FFD700", fontSize: 13 }}>★ {store.rating}</span>
                    <span style={{ color: theme.muted, fontSize: 12 }}>({store.reviews.toLocaleString()})</span>
                  </div>
                </div>
              </div>
              <div style={{ color: theme.muted, fontSize: 13, margin: "12px 0 10px", lineHeight: 1.5 }}>{store.desc}</div>
              <div style={{
                background: "rgba(255,107,53,0.08)", borderRadius: 10, padding: "10px 14px",
                borderLeft: `3px solid ${theme.accent}`,
              }}>
                <div style={{ color: theme.muted, fontSize: 11, marginBottom: 3 }}>Customer review</div>
                <div style={{ color: theme.text, fontSize: 13, fontStyle: "italic" }}>"{store.review}"</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                <div style={{ color: theme.muted, fontSize: 12 }}>
                  <span style={{ color: theme.green, fontWeight: 600 }}>✓ {store.orders.toLocaleString()}</span> purchases
                </div>
                <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
                  Visit Store →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Store Detail ───────────────────────────────────────────────
const products = [
  { id: 1, name: "Fresh Tomatoes 1kg", price: 800, emoji: "🍅" },
  { id: 2, name: "Organic Lettuce", price: 500, emoji: "🥬" },
  { id: 3, name: "Basmati Rice 5kg", price: 3200, emoji: "🍚" },
  { id: 4, name: "Chicken Breast 1kg", price: 2800, emoji: "🍗" },
];

function StoreDetailScreen({ store, onBack, onCart, cart, setCart }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgs, setMsgs] = useState([{ from: "store", text: `Hi! Welcome to ${store.name}. How can we help you today?` }]);

  const addToCart = (p) => setCart(prev => {
    const ex = prev.find(i => i.id === p.id);
    if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
    return [...prev, { ...p, qty: 1 }];
  });

  const send = () => {
    if (!msg.trim()) return;
    setMsgs(m => [...m, { from: "me", text: msg }]);
    setMsg("");
    setTimeout(() => setMsgs(m => [...m, { from: "store", text: "Thanks for your message! We'll get back to you shortly. 😊" }]), 1000);
  };

  return (
    <div className="screen" style={{ paddingBottom: 100 }}>
      {/* Hero */}
      <div style={{
        padding: "56px 24px 28px",
        background: "linear-gradient(180deg, rgba(255,107,53,0.15) 0%, transparent 100%)",
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: theme.card, border: `1px solid ${theme.border}`,
            borderRadius: 12, padding: "9px 13px", cursor: "pointer", fontSize: 18, color: theme.text }}>←</button>
          <div style={{ fontSize: 48 }}>{store.emoji}</div>
          <div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 22 }}>{store.name}</div>
            <div style={{ color: theme.muted, fontSize: 13 }}>{store.category}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1, padding: "12px" }}
            onClick={() => setChatOpen(true)}>💬 Contact Store</button>
          <button className="btn-outline" style={{ flex: 1, padding: "12px" }}>
            ❤️ Save
          </button>
        </div>
      </div>

      {/* Products */}
      <div className="scrollable" style={{ flex: 1, padding: "20px 24px" }}>
        <div className="syne" style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Products</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {products.map(p => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: theme.card, borderRadius: 16, padding: "14px 16px",
              border: `1px solid ${theme.border}`,
            }}>
              <span style={{ fontSize: 32 }}>{p.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{p.name}</div>
                <div style={{ color: theme.accent, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, marginTop: 3 }}>
                  ₦{p.price.toLocaleString()}
                </div>
              </div>
              <button className="btn-primary" style={{ padding: "9px 16px", fontSize: 13 }}
                onClick={() => addToCart(p)}>+ Add</button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="modal-overlay" onClick={() => setChatOpen(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div className="syne" style={{ fontWeight: 700, fontSize: 18 }}>💬 Chat with {store.name}</div>
              <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: theme.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: 260, overflowY: "auto" }}>
              {msgs.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.from === "me" ? "flex-end" : "flex-start",
                  background: m.from === "me" ? "linear-gradient(135deg,#FF6B35,#FFB347)" : theme.card,
                  color: m.from === "me" ? "#fff" : theme.text,
                  borderRadius: 14, padding: "10px 14px", fontSize: 14, maxWidth: "80%",
                  border: m.from !== "me" ? `1px solid ${theme.border}` : "none",
                }}>{m.text}</div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input className="input-field" style={{ flex: 1 }} placeholder="Type a message…"
                value={msg} onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()} />
              <button className="btn-primary" style={{ padding: "12px 20px" }} onClick={send}>→</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shoppers ───────────────────────────────────────────────────
const shoppers = [
  { id: 1, name: "Amara Okafor", emoji: "👩🏾", rating: 4.9, reviews: 312, specialty: "Groceries & Produce", online: true, rate: "₦500/hr",
    bio: "10+ years shopping experience. I know all the best spots in Lagos markets!", badge: "Top Rated" },
  { id: 2, name: "Kwame Asante", emoji: "👨🏿", rating: 4.8, reviews: 198, specialty: "Electronics & Gadgets", online: true, rate: "₦700/hr",
    bio: "Tech enthusiast and experienced shopper. Best prices guaranteed.", badge: "Expert" },
  { id: 3, name: "Fatima Bello", emoji: "👩🏾‍🦱", rating: 4.7, reviews: 425, specialty: "Fashion & Beauty", online: false, rate: "₦600/hr",
    bio: "Fashion-forward personal shopper with an eye for quality and value.", badge: "Popular" },
  { id: 4, name: "Emeka Nwosu", emoji: "👨🏾", rating: 4.9, reviews: 560, specialty: "General Shopping", online: true, rate: "₦450/hr",
    bio: "Reliable, punctual, and budget-conscious. 1000+ completed errands!", badge: "Top Rated" },
];

function ShoppersScreen({ onBack, onShopper }) {
  const [showListModal, setShowListModal] = useState(false);
  const [listText, setListText] = useState("");
  const [budget, setBudget] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="screen scrollable" style={{ paddingBottom: 120 }}>
      <div style={{ padding: "56px 24px 16px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: theme.card, border: `1px solid ${theme.border}`,
          borderRadius: 12, padding: "9px 13px", cursor: "pointer", fontSize: 18, color: theme.text }}>←</button>
        <div>
          <div className="syne" style={{ fontWeight: 800, fontSize: 24 }}>Personal Shoppers</div>
          <div style={{ color: theme.muted, fontSize: 13 }}>{shoppers.filter(s => s.online).length} shoppers online now</div>
        </div>
      </div>

      {/* Post a list CTA */}
      <div style={{ padding: "0 24px 24px" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(108,99,255,0.2), rgba(162,155,254,0.1))",
          border: "1.5px solid rgba(108,99,255,0.4)",
          borderRadius: 20, padding: "18px 20px",
        }}>
          <div className="syne" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            📋 Post Your Shopping List
          </div>
          <div style={{ color: theme.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
            Upload a list and let available shoppers bid on your order
          </div>
          <button className="btn-primary" style={{ width: "100%" }}
            onClick={() => setShowListModal(true)}>
            + Post Shopping List
          </button>
        </div>
      </div>

      {/* Shoppers */}
      <div style={{ padding: "0 24px" }}>
        <div className="syne" style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Active Shoppers</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {shoppers.map(s => (
            <div key={s.id} className="card" onClick={() => onShopper(s)} style={{ cursor: "pointer" }}>
              <div style={{ padding: "18px" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: 54, height: 54, borderRadius: 27,
                      background: "linear-gradient(135deg, #1e1020, #2a1a30)",
                      border: `2px solid ${s.online ? theme.green : theme.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                    }}>{s.emoji}</div>
                    {s.online && (
                      <div style={{
                        position: "absolute", bottom: 2, right: 2,
                        width: 10, height: 10, borderRadius: 5,
                        background: theme.green, border: "2px solid " + theme.card,
                        boxShadow: "0 0 8px rgba(46,204,113,0.8)",
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span className="syne" style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</span>
                        {!s.online && <span style={{ color: theme.muted, fontSize: 12, marginLeft: 8 }}>(offline)</span>}
                      </div>
                      <span style={{
                        background: "rgba(255,107,53,0.15)", color: theme.accent,
                        borderRadius: 8, padding: "3px 9px", fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700,
                      }}>{s.badge}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                      <span className="tag">{s.specialty}</span>
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 6, alignItems: "center" }}>
                      <span style={{ color: "#FFD700", fontSize: 13 }}>★ {s.rating}</span>
                      <span style={{ color: theme.muted, fontSize: 12 }}>({s.reviews} reviews)</span>
                      <span style={{ color: theme.accent, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>{s.rate}</span>
                    </div>
                  </div>
                </div>
                <div style={{ color: theme.muted, fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>{s.bio}</div>
                {s.online && (
                  <button className="btn-primary" style={{ width: "100%", marginTop: 14 }}>
                    Message {s.name.split(" ")[0]} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping List Modal */}
      {showListModal && (
        <div className="modal-overlay" onClick={() => setShowListModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            {!submitted ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <div className="syne" style={{ fontWeight: 700, fontSize: 18 }}>📋 Post Shopping List</div>
                  <button onClick={() => setShowListModal(false)} style={{ background: "none", border: "none", color: theme.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <div style={{ color: theme.muted, fontSize: 13, marginBottom: 8 }}>Your shopping list (one item per line)</div>
                    <textarea className="input-field" rows={6} placeholder={"e.g.\n2kg tomatoes\n1 bag of rice\n3 Indomie noodles"}
                      style={{ resize: "none", lineHeight: 1.6 }}
                      value={listText} onChange={e => setListText(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ color: theme.muted, fontSize: 13, marginBottom: 8 }}>Your budget</div>
                    <input className="input-field" placeholder="e.g. ₦5,000"
                      value={budget} onChange={e => setBudget(e.target.value)} />
                  </div>
                  <button className="btn-primary" style={{ width: "100%" }}
                    onClick={() => { setSubmitted(true); }}>
                    🚀 Post to All Shoppers
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
                <div className="syne" style={{ fontWeight: 800, fontSize: 22, marginBottom: 10 }}>List Posted!</div>
                <div style={{ color: theme.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  Your shopping list is live. Shoppers will DM you if they can meet your needs.
                </div>
                <button className="btn-primary" style={{ width: "100%" }}
                  onClick={() => { setShowListModal(false); setSubmitted(false); }}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shopper Chat ───────────────────────────────────────────────
function ShopperChatScreen({ shopper, onBack }) {
  const [msgs, setMsgs] = useState([{
    from: "shopper", text: `Hi! I'm ${shopper.name}. I saw your list and I'm available to help. What do you need? 😊`
  }]);
  const [msg, setMsg] = useState("");
  const send = () => {
    if (!msg.trim()) return;
    setMsgs(m => [...m, { from: "me", text: msg }]);
    setMsg("");
    setTimeout(() => setMsgs(m => [...m, {
      from: "shopper", text: "Got it! I can get that for you. My rate is " + shopper.rate + ". Shall I proceed? 🛒"
    }]), 1200);
  };

  return (
    <div className="screen" style={{ paddingBottom: 0 }}>
      {/* Header */}
      <div style={{
        padding: "56px 24px 16px", display: "flex", alignItems: "center", gap: 14,
        borderBottom: `1px solid ${theme.border}`, background: theme.surface,
      }}>
        <button onClick={onBack} style={{ background: theme.card, border: `1px solid ${theme.border}`,
          borderRadius: 12, padding: "9px 13px", cursor: "pointer", fontSize: 18, color: theme.text }}>←</button>
        <div style={{ fontSize: 36 }}>{shopper.emoji}</div>
        <div>
          <div className="syne" style={{ fontWeight: 700, fontSize: 16 }}>{shopper.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span className="online-dot" />
            <span style={{ color: theme.green, fontSize: 12 }}>Online now</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="scrollable" style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === "me" ? "flex-end" : "flex-start",
            background: m.from === "me" ? "linear-gradient(135deg,#FF6B35,#FFB347)" : theme.card,
            color: m.from === "me" ? "#fff" : theme.text,
            borderRadius: 16, padding: "12px 16px", fontSize: 14, maxWidth: "78%",
            border: m.from !== "me" ? `1px solid ${theme.border}` : "none", lineHeight: 1.5,
          }}>{m.text}</div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px 32px", borderTop: `1px solid ${theme.border}`, background: theme.surface,
        display: "flex", gap: 10 }}>
        <input className="input-field" style={{ flex: 1 }} placeholder="Type a message…"
          value={msg} onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()} />
        <button className="btn-primary" style={{ padding: "12px 20px", fontSize: 20 }} onClick={send}>→</button>
      </div>
    </div>
  );
}

// ── Cart ───────────────────────────────────────────────────────
function CartScreen({ onBack, cart, setCart }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const [ordered, setOrdered] = useState(false);

  const update = (id, delta) => setCart(prev => {
    const updated = prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0);
    return updated;
  });

  return (
    <div className="screen scrollable" style={{ paddingBottom: 120 }}>
      <div style={{ padding: "56px 24px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: theme.card, border: `1px solid ${theme.border}`,
          borderRadius: 12, padding: "9px 13px", cursor: "pointer", fontSize: 18, color: theme.text }}>←</button>
        <div className="syne" style={{ fontWeight: 800, fontSize: 24 }}>Your Cart</div>
      </div>

      {ordered ? (
        <div style={{ textAlign: "center", padding: "60px 40px" }}>
          <div style={{ fontSize: 70, marginBottom: 20 }}>🎊</div>
          <div className="syne" style={{ fontWeight: 800, fontSize: 26, marginBottom: 12 }}>Order Placed!</div>
          <div style={{ color: theme.muted, lineHeight: 1.6, marginBottom: 30 }}>
            Your order is confirmed. You'll receive updates on delivery.
          </div>
          <button className="btn-primary" style={{ width: "100%" }} onClick={() => { setCart([]); setOrdered(false); onBack(); }}>
            Back to Home
          </button>
        </div>
      ) : cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 40px" }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
          <div className="syne" style={{ fontWeight: 700, fontSize: 20 }}>Your cart is empty</div>
          <div style={{ color: theme.muted, marginTop: 8 }}>Add items from stores to get started</div>
        </div>
      ) : (
        <div style={{ padding: "0 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: theme.card, borderRadius: 16, padding: "14px 16px",
                border: `1px solid ${theme.border}`,
              }}>
                <span style={{ fontSize: 30 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                  <div style={{ color: theme.accent, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, marginTop: 2 }}>
                    ₦{(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => update(item.id, -1)} style={{
                    width: 30, height: 30, borderRadius: 8, border: `1px solid ${theme.border}`,
                    background: theme.surface, color: theme.text, fontSize: 18, cursor: "pointer",
                  }}>−</button>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, width: 20, textAlign: "center" }}>{item.qty}</span>
                  <button onClick={() => update(item.id, 1)} style={{
                    width: 30, height: 30, borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg,#FF6B35,#FFB347)", color: "#fff", fontSize: 18, cursor: "pointer",
                  }}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: theme.card, borderRadius: 20, padding: "20px", border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: theme.muted }}>Subtotal</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: theme.muted }}>Delivery</span>
              <span style={{ color: theme.green }}>FREE</span>
            </div>
            <div style={{ height: 1, background: theme.border, margin: "14px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <span className="syne" style={{ fontWeight: 700, fontSize: 18 }}>Total</span>
              <span className="syne" style={{ fontWeight: 800, fontSize: 20, color: theme.accent }}>₦{total.toLocaleString()}</span>
            </div>
            <button className="btn-primary" style={{ width: "100%", padding: "16px" }}
              onClick={() => setOrdered(true)}>
              Place Order 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────────
function BottomNav({ active, onChange, cartCount }) {
  const items = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "stores", icon: "🏪", label: "Stores" },
    { id: "shoppers", icon: "🧑‍💼", label: "Shoppers" },
    { id: "cart", icon: "🛒", label: "Cart" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  return (
    <div className="bottom-nav">
      {items.map(item => (
        <div key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`}
          onClick={() => onChange(item.id)}>
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            {item.id === "cart" && cartCount > 0 && (
              <div style={{
                position: "absolute", top: -6, right: -8,
                background: theme.accent, color: "#fff", borderRadius: 8, padding: "1px 6px",
                fontSize: 10, fontFamily: "'Syne',sans-serif", fontWeight: 700,
              }}>{cartCount}</div>
            )}
          </div>
          <span style={{ fontSize: 10, fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Profile ────────────────────────────────────────────────────
function ProfileScreen() {
  return (
    <div className="screen scrollable" style={{ paddingBottom: 100 }}>
      <div style={{
        padding: "56px 24px 32px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.15) 0%, transparent 70%)",
        textAlign: "center",
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: 45, margin: "0 auto 16px",
          background: "linear-gradient(135deg,#FF6B35,#FFB347)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, boxShadow: "0 8px 28px rgba(255,107,53,0.4)",
        }}>😊</div>
        <div className="syne" style={{ fontWeight: 800, fontSize: 22 }}>John Doe</div>
        <div style={{ color: theme.muted, fontSize: 14, marginTop: 4 }}>@johndoe · Lagos, NG</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20 }}>
          {[{ v: "34", l: "Orders" }, { v: "12", l: "Saved" }, { v: "4.9★", l: "Rating" }].map(s => (
            <div key={s.l}>
              <div className="syne" style={{ fontWeight: 800, fontSize: 20 }}>{s.v}</div>
              <div style={{ color: theme.muted, fontSize: 12 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        {[
          { icon: "📦", label: "My Orders" },
          { icon: "❤️", label: "Saved Stores" },
          { icon: "🔔", label: "Notifications" },
          { icon: "💳", label: "Payment Methods" },
          { icon: "📍", label: "Delivery Addresses" },
          { icon: "⚙️", label: "Settings" },
          { icon: "🚪", label: "Sign Out" },
        ].map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 16, padding: "18px 0",
            borderBottom: `1px solid ${theme.border}`, cursor: "pointer",
          }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
            <span style={{ color: theme.muted }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState("splash"); // splash | auth | app
  const [nav, setNav] = useState("home");
  const [subView, setSubView] = useState(null); // { type, data }
  const [cart, setCart] = useState([]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleNav = (id) => {
    setSubView(null);
    setNav(id);
  };

  const renderMain = () => {
    if (subView?.type === "store-detail") {
      return <StoreDetailScreen store={subView.data} onBack={() => setSubView(null)}
        cart={cart} setCart={setCart} onCart={() => handleNav("cart")} />;
    }
    if (subView?.type === "shopper-chat") {
      return <ShopperChatScreen shopper={subView.data} onBack={() => setSubView(null)} />;
    }

    switch (nav) {
      case "home": return <HomeScreen
        onSection={s => setNav(s)}
        onCart={() => setNav("cart")} />;
      case "stores": return <StoresScreen
        onBack={() => handleNav("home")}
        onStore={s => setSubView({ type: "store-detail", data: s })} />;
      case "shoppers": return <ShoppersScreen
        onBack={() => handleNav("home")}
        onShopper={s => setSubView({ type: "shopper-chat", data: s })} />;
      case "cart": return <CartScreen onBack={() => handleNav("home")} cart={cart} setCart={setCart} />;
      case "profile": return <ProfileScreen />;
      default: return null;
    }
  };

  return (
    <>
      <style>{css}</style>
      <div style={{
        maxWidth: 430, margin: "0 auto", minHeight: "100vh",
        background: theme.bg, position: "relative",
        boxShadow: "0 0 80px rgba(0,0,0,0.8)",
      }}>
        {phase === "splash" && <SplashScreen onDone={() => setPhase("auth")} />}
        {phase === "auth" && <AuthScreen onLogin={() => setPhase("app")} />}
        {phase === "app" && (
          <>
            {renderMain()}
            {!subView && <BottomNav active={nav} onChange={handleNav} cartCount={cartCount} />}
          </>
        )}
      </div>
    </>
  );
}
