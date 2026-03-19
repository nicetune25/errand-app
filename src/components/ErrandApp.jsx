"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
//  ERRAND  ·  Clean Edition
//  Breathable, purposeful, delightful.
// ─────────────────────────────────────────────────────────────

// ── THEME ─────────────────────────────────────────────────────
const T = (dark) => dark ? {
  bg: "#0A0A0E", surface: "#12121A", card: "#1A1A26", border: "#242438",
  accent: "#FF5720", accentBg: "rgba(255,87,32,.1)", accentLine: "rgba(255,87,32,.25)",
  green: "#00D67A", greenBg: "rgba(0,214,122,.1)",
  gold: "#F5A623", goldBg: "rgba(245,166,35,.1)",
  text: "#EEE9FF", sub: "#857FA0", muted: "#45405E",
  nav: "rgba(10,10,14,.95)", dark: true,
} : {
  bg: "#F5F4FA", surface: "#FFFFFF", card: "#FFFFFF", border: "#E8E5F5",
  accent: "#FF5720", accentBg: "rgba(255,87,32,.07)", accentLine: "rgba(255,87,32,.2)",
  green: "#00A85F", greenBg: "rgba(0,168,95,.09)",
  gold: "#D48A00", goldBg: "rgba(212,138,0,.1)",
  text: "#140E2A", sub: "#655C80", muted: "#B0AAC8",
  nav: "rgba(245,244,250,.95)", dark: false,
};

// ── CSS ───────────────────────────────────────────────────────
// ── RESPONSIVE HOOK ─────────────────────────────────────────────
const useBP = () => {
  const get = () => {
    const w = typeof window !== "undefined" ? window.innerWidth : 390;
    return w < 640 ? "xs" : w < 1024 ? "md" : "lg";
  };
  const [bp, setBP] = useState(get);
  useEffect(() => {
    const fn = () => setBP(get());
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return bp;
};

// ── ANIMATION HOOKS ──────────────────────────────────────────

// Screen transition: pass direction ('fwd'|'back') to animate in
const useScreenClass = (dir = 'fwd') => {
  const [cls, setCls] = useState('');
  useEffect(() => {
    const c = dir === 'back' ? 'screen-back' : 'screen-enter';
    setCls(c);
    const t = setTimeout(() => setCls(''), 220);
    return () => clearTimeout(t);
  }, []);
  return cls;
};

// Scroll-reveal: returns a ref; attach to any container to auto-reveal children
const useScrollReveal = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll('.reveal');
    if (!items.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    items.forEach(i => io.observe(i));
    return () => io.disconnect();
  }, []);
  return ref;
};

// Button with built-in press scale + ripple
const Pressable = ({ onPress, children, style, className = '' }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      className={'btn-ripple tap ' + className}
      style={{ ...style, transform: pressed ? 'scale(.96)' : 'scale(1)', transition: 'transform .1s ease' }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onPress?.(); }}
      onPointerLeave={() => setPressed(false)}
    >{children}</div>
  );
};

// Skeleton building block
const Skel = ({ w = '100%', h = 16, r = 8, style }) => (
  <div className="skel" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />
);

// Skeleton card variants  
const SkelCard = ({ C }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, display: 'flex', gap: 12 }}>
    <Skel w={48} h={48} r={14} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
      <Skel h={14} w="70%" />
      <Skel h={11} w="45%" />
    </div>
  </div>
);

const SkelRow = ({ C, count = 3 }) => (
  <div style={{ display: 'flex', gap: 10 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ flexShrink: 0, width: 130, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
        <Skel h={48} r={14} style={{ marginBottom: 10 }} />
        <Skel h={13} w="80%" style={{ marginBottom: 6 }} />
        <Skel h={11} w="55%" />
      </div>
    ))}
  </div>
);

// Cart badge that bounces when count changes
const CartBadge = ({ count, C }) => {
  const [key, setKey] = useState(0);
  const prev = useRef(count);
  useEffect(() => { if (count !== prev.current) { setKey(k => k + 1); prev.current = count; } }, [count]);
  if (!count) return null;
  return (
    <div key={key} className="bounce" style={{ minWidth: 16, height: 16, borderRadius: 8, background: C.accent, border: `2px solid ${C.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 3px' }}>{count}</div>
  );
};



// ─────────────────────────────────────────────────────────────
//  BACKEND LAYER
//  Supabase (Auth · DB · Realtime) + Paystack Payments
//
//  SETUP: Replace these two values with yours from the guide
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// SUPABASE_ANON_KEY via env
const SUPABASE_ANON_KEY_UNUSED = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dHJwdWdrdHZudWFscGJqYWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODMxOTMsImV4cCI6MjA4ODM1OTE5M30.CVFgkTnW15vfkseRjn0FSbhWQDoHmL51DPPxd1ouqYI";
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

// ── Supabase client (no npm needed — uses REST + Realtime WS) ──
const sb = {
  // ── AUTH ─────────────────────────────────────────────────
  auth: {
    async signUp({ email, password, name, phone }) {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password, data: { name, phone } }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message || d.msg);
      return d;
    },

    async signIn({ email, password }) {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message || d.msg);
      if (d.access_token) localStorage.setItem("sb_token", d.access_token);
      return d;
    },

    async signOut() {
      const token = localStorage.getItem("sb_token");
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("sb_token");
    },

    async getUser() {
      const token = localStorage.getItem("sb_token");
      if (!token) return null;
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      return d.error ? null : d;
    },

    async resetPassword(email) {
      await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email }),
      });
    },
  },

  // ── DB (REST) ─────────────────────────────────────────────
  db: {
    _headers(extra = {}) {
      const token = localStorage.getItem("sb_token");
      return {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
        Prefer: "return=representation",
        ...extra,
      };
    },

    async select(table, query = "") {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        headers: this._headers(),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },

    async insert(table, data) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: this._headers(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },

    async update(table, data, query) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        method: "PATCH",
        headers: this._headers(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },

    async delete(table, query) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        method: "DELETE",
        headers: this._headers(),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  },

  // ── REALTIME (WebSocket) ──────────────────────────────────
  realtime: {
    _ws: null,
    _subs: {},
    _msgId: 1,

    connect() {
      if (this._ws?.readyState === WebSocket.OPEN) return;
      const token = localStorage.getItem("sb_token") || SUPABASE_ANON_KEY;
      const url = SUPABASE_URL.replace("https://", "wss://") + `/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
      this._ws = new WebSocket(url);
      this._ws.onopen = () => {
        // heartbeat
        setInterval(() => {
          if (this._ws?.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(this._msgId++) }));
          }
        }, 20000);
      };
      this._ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        const handler = this._subs[msg.topic];
        if (handler && msg.event !== "phx_reply") handler(msg);
      };
    },

    subscribe(table, filter, callback) {
      this.connect();
      const topic = `realtime:public:${table}${filter ? `:${filter}` : ""}`;
      this._subs[topic] = callback;
      const join = { topic, event: "phx_join", payload: { config: { broadcast: { self: false }, presence: { key: "" } } }, ref: String(this._msgId++) };
      if (this._ws?.readyState === WebSocket.OPEN) {
        this._ws.send(JSON.stringify(join));
      } else {
        this._ws.onopen = () => this._ws.send(JSON.stringify(join));
      }
      return () => {
        delete this._subs[topic];
        if (this._ws?.readyState === WebSocket.OPEN) {
          this._ws.send(JSON.stringify({ topic, event: "phx_leave", payload: {}, ref: String(this._msgId++) }));
        }
      };
    },
  },
};

// ── useSupabaseAuth hook ──────────────────────────────────────
// Provides user, loading, and auth actions across the app
const AuthContext = React.createContext(null);

function AuthProvider({ children, C }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    sb.auth.getUser().then(u => { setUser(u); setLoading(false); });
  }, []);

  const signIn = async (email, password) => {
    const d = await sb.auth.signIn({ email, password });
    const u = await sb.auth.getUser();
    setUser(u);
    return d;
  };

  const signUp = async (email, password, name, phone) => {
    const d = await sb.auth.signUp({ email, password, name, phone });
    const u = await sb.auth.getUser();
    setUser(u);
    return d;
  };

  const signOut = async () => {
    await sb.auth.signOut();
    setUser(null);
    toast("Signed out", "👋");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => React.useContext(AuthContext);

// ── useOrders hook ────────────────────────────────────────────
// Fetches + creates orders, subscribes to realtime updates
function useOrders(userId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    // Initial fetch
    sb.db.select("orders", `user_id=eq.${userId}&order=created_at.desc&limit=20`)
      .then(data => { setOrders(data || []); setLoading(false); })
      .catch(() => setLoading(false));

    // Realtime subscription
    const unsub = sb.realtime.subscribe("orders", `user_id=eq.${userId}`, (msg) => {
      const record = msg.payload?.data?.record;
      if (!record) return;
      if (msg.payload?.data?.type === "INSERT") setOrders(prev => [record, ...prev]);
      if (msg.payload?.data?.type === "UPDATE") setOrders(prev => prev.map(o => o.id === record.id ? record : o));
    });
    return unsub;
  }, [userId]);

  const placeOrder = async (items, total, storeId, address) => {
    const order = await sb.db.insert("orders", {
      user_id: userId,
      store_id: storeId,
      items: JSON.stringify(items),
      total,
      address,
      status: "pending",
    });
    return order[0];
  };

  return { orders, loading, placeOrder };
}

// ── useTracking hook ──────────────────────────────────────────
// Subscribes to live order status + shopper location updates
function useTracking(orderId) {
  const [status, setStatus] = useState(null);
  const [location, setLocation] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!orderId) return;
    // Fetch initial state
    sb.db.select("orders", `id=eq.${orderId}`)
      .then(data => { if (data[0]) { setStatus(data[0].status); setLocation(data[0].shopper_location); } });

    // Realtime: order status changes
    const unsubOrder = sb.realtime.subscribe("orders", `id=eq.${orderId}`, (msg) => {
      const rec = msg.payload?.data?.record;
      if (rec) { setStatus(rec.status); setLocation(rec.shopper_location); }
    });

    // Realtime: chat messages
    const unsubChat = sb.realtime.subscribe("messages", `order_id=eq.${orderId}`, (msg) => {
      const rec = msg.payload?.data?.record;
      if (rec && msg.payload?.data?.type === "INSERT") setMessages(prev => [...prev, rec]);
    });

    return () => { unsubOrder(); unsubChat(); };
  }, [orderId]);

  const sendMessage = async (userId, text) => {
    await sb.db.insert("messages", { order_id: orderId, user_id: userId, text });
  };

  return { status, location, messages, sendMessage };
}

// ── Paystack payment hook ─────────────────────────────────────
function usePaystack() {
  const initPay = ({ email, amount, orderId, onSuccess, onClose }) => {
    // Load Paystack popup script dynamically
    const existingScript = document.getElementById("paystack-js");
    const launch = () => {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount: amount * 100, // kobo
        ref: `errand_${orderId}_${Date.now()}`,
        currency: "NGN",
        label: "Errand Order",
        metadata: { order_id: orderId, custom_fields: [{ display_name: "Order ID", variable_name: "order_id", value: orderId }] },
        callback: (res) => { onSuccess?.(res.reference); },
        onClose: () => { onClose?.(); },
      });
      handler.openIframe();
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "paystack-js";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.onload = launch;
      document.head.appendChild(script);
    } else if (window.PaystackPop) {
      launch();
    } else {
      existingScript.addEventListener("load", launch);
    }
  };

  return { initPay };
}

// ── Auth screen (Supabase-powered) ───────────────────────────
function AuthScreen({ onDone, C }) {
  const { signIn, signUp } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState("in"); // in | up | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "in") {
        await signIn(email, password);
        onDone();
      } else if (mode === "up") {
        if (!name.trim()) { setError("Please enter your name"); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
        await signUp(email, password, name, phone);
        onDone();
      } else {
        await sb.auth.resetPassword(email);
        setResetSent(true);
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px 48px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ width: 64, height: 64, background: C.accent, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 16px", boxShadow: `0 4px 22px ${C.accent}44` }}>🛍️</div>
        <div className="disp" style={{ fontSize: 26, color: C.text }}>errand</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 5 }}>
          {mode === "in" ? "Welcome back" : mode === "up" ? "Create your account" : "Reset your password"}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Mode tabs */}
        {mode !== "reset" && (
          <div style={{ display: "flex", background: C.card, borderRadius: 12, padding: 3, marginBottom: 22, border: `1px solid ${C.border}` }}>
            {[["in","Sign in"],["up","Sign up"]].map(([id, l]) => (
              <button key={id} onClick={() => { setMode(id); setError(""); }} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, transition: "all .2s", background: mode === id ? C.accent : "transparent", color: mode === id ? "#fff" : C.sub }}>{l}</button>
            ))}
          </div>
        )}

        {/* Reset password flow */}
        {mode === "reset" && (
          <div style={{ animation: "up .2s ease" }}>
            {resetSent ? (
              <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📧</div>
                <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 8 }}>Check your email</div>
                <div style={{ color: C.sub, fontSize: 13.5, lineHeight: 1.6 }}>We sent a reset link to <b style={{ color: C.text }}>{email}</b></div>
                <button onClick={() => { setMode("in"); setResetSent(false); }} style={{ marginTop: 22, color: C.accent, background: "none", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back to sign in</button>
              </div>
            ) : (
              <>
                <div style={{ color: C.sub, fontSize: 13.5, marginBottom: 18, lineHeight: 1.6 }}>Enter your email and we'll send you a link to reset your password.</div>
                <Input C={C} icon="✉️" placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 14 }} />
                <Btn C={C} block onClick={submit} style={{ padding: "14px", fontSize: 15, marginBottom: 14 }}>
                  {loading ? <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} /> : "Send reset link"}
                </Btn>
                <button onClick={() => setMode("in")} style={{ width: "100%", textAlign: "center", color: C.sub, background: "none", border: "none", fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back to sign in</button>
              </>
            )}
          </div>
        )}

        {/* Sign in / Sign up form */}
        {mode !== "reset" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 11, animation: "up .2s ease" }}>
            {mode === "up" && (
              <>
                <Input C={C} icon="👤" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
                <Input C={C} icon="📞" placeholder="Phone number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
              </>
            )}
            <Input C={C} icon="✉️" placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <div style={{ position: "relative" }}>
              <Input C={C} icon="🔒" placeholder="Password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
              <button onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</button>
            </div>
            {mode === "in" && (
              <div style={{ textAlign: "right" }}>
                <span onClick={() => { setMode("reset"); setError(""); }} style={{ color: C.accent, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Forgot password?</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, padding: "10px 13px", color: "#EF4444", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                <span>⚠️</span>{error}
              </div>
            )}

            <Btn C={C} block onClick={submit} style={{ padding: "14px", fontSize: 15, marginTop: 2 }}>
              {loading
                ? <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
                : mode === "in" ? "Sign in →" : "Create account →"}
            </Btn>

            {/* Demo bypass */}
            <button onClick={onDone} style={{ textAlign: "center", color: C.muted, background: "none", border: "none", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
              Continue as guest (demo mode)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PaystackCheckout: replaces Cart's pay button ─────────────
function PaystackCheckout({ total, cart, goTo, userEmail, orderId, C }) {
  const { initPay } = usePaystack();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const pay = () => {
    setLoading(true);
    initPay({
      email: userEmail || "guest@errand.ng",
      amount: total,
      orderId: orderId || `demo_${Date.now()}`,
      onSuccess: (ref) => {
        setLoading(false);
        setPaid(true);
        toast("Payment successful! 🎉", "✅", "success");
        setTimeout(() => goTo("tracking"), 1800);
      },
      onClose: () => { setLoading(false); toast("Payment cancelled", "ℹ️"); },
    });
  };

  if (paid) {
    return (
      <div style={{ background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 13, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, animation: "up .25s ease" }}>
        <span style={{ fontSize: 22 }}>✅</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Payment confirmed</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>Redirecting to tracking…</div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={pay} disabled={loading} className="btn-ripple" style={{ width: "100%", padding: "15px", background: loading ? C.border : C.accent, border: "none", borderRadius: 13, color: loading ? C.muted : "#fff", fontWeight: 700, fontSize: 15.5, cursor: loading ? "default" : "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: loading ? "none" : `0 4px 20px ${C.accent}44`, transition: "background .2s" }}>
      {loading
        ? <><span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />Processing…</>
        : <>💳 Pay ₦{total.toLocaleString()} with Paystack</>}
    </button>
  );
}



// ── AI ENGINE ────────────────────────────────────────────────
// Single function that calls Claude — powers all 4 AI features
async function askClaude(systemPrompt, userMessage, jsonMode = false) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, message: userMessage, json_mode: jsonMode }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// Shared app context passed to AI so it knows what's in the app
const APP_CONTEXT = `
You are Errand's AI assistant — a smart, friendly Nigerian e-commerce helper.
The app serves Lagos, Nigeria. Currency is Naira (₦).

Available stores: FoodMart (Groceries, ₦800-₦2800), GlowStore (Beauty, ₦4200-₦8500), 
TechHub (Electronics, ₦3500-₦22500), FreshFarm (Organic, ₦800-₦3200), 
HomeNest (Home, ₦4500-₦6800), SportZone (Sports, ₦5200-₦7500).

User profile: John Doe, Gold loyalty member (3,240 pts), Victoria Island Lagos.
Order history: FoodMart (tomatoes, rice, eggs), GlowStore (serum), TechHub (earbuds charger).
Favourite categories: Groceries, Electronics, Beauty.
`;



const CSS = (C) => `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;background:${C.bg};}
body{font-family:'DM Sans',sans-serif;color:${C.text};font-size:14.5px;line-height:1.5;}
.disp{font-family:'DM Sans',sans-serif;font-weight:700;}
input,textarea,select,button{font-family:'DM Sans',sans-serif;}

/* ── Layout ── */
.app-shell{display:flex;min-height:100vh;}
.sidebar{display:none;}
.main-col{flex:1;min-width:0;position:relative;min-height:100vh;overflow:hidden;}
.screen{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;
  -webkit-overflow-scrolling:touch;scroll-behavior:smooth;}
.screen::-webkit-scrollbar{display:none;}
.hrow{display:flex;overflow-x:auto;gap:10px;scrollbar-width:none;}
.hrow::-webkit-scrollbar{display:none;}
.content{width:100%;max-width:1100px;margin:0 auto;}

/* ── Screen transitions ── */
.screen-enter { animation: screenIn 180ms cubic-bezier(.2,0,.2,1) both; }
.screen-back  { animation: screenBack 180ms cubic-bezier(.2,0,.2,1) both; }
@keyframes screenIn   { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
@keyframes screenBack { from{opacity:0;transform:translateX(-22px)} to{opacity:1;transform:translateX(0)} }

/* ── Scroll-reveal ── */
.reveal { opacity:0; transform:translateY(16px); transition:opacity 260ms ease, transform 260ms ease; }
.reveal.visible { opacity:1; transform:translateY(0); }

/* ── Skeleton shimmer ── */
.skel { background:linear-gradient(90deg, ${C.card} 25%, ${C.border} 50%, ${C.card} 75%);
  background-size:200% 100%; animation:skelMove 1.4s ease-in-out infinite; border-radius:10px; }
@keyframes skelMove { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Button ripple ── */
.btn-ripple { position:relative; overflow:hidden; }
.btn-ripple::after { content:''; position:absolute; inset:0; background:rgba(255,255,255,.18);
  transform:scale(0); border-radius:inherit; transition:transform .16s ease, opacity .16s ease; opacity:0; }
.btn-ripple:active::after { transform:scale(1); opacity:1; }

/* ── Tap feedback on card items ── */
.tap { transition:transform .1s ease, box-shadow .1s ease; cursor:pointer; }
.tap:active { transform:scale(.97); }

/* ── Bounce in (for carts, badges) ── */
@keyframes bounceIn { 0%{transform:scale(0)} 60%{transform:scale(1.18)} 100%{transform:scale(1)} }
.bounce { animation:bounceIn .2s cubic-bezier(.36,.07,.19,.97) both; }

@media(min-width:1024px){
  .sidebar{display:flex;flex-direction:column;width:240px;flex-shrink:0;padding:24px 14px;
    border-right:1px solid ${C.border};background:${C.surface};
    position:sticky;top:0;height:100vh;overflow-y:auto;}
  .bottom-nav{display:none!important;}
  .main-col{overflow-y:auto;height:100vh;}
  .main-col::-webkit-scrollbar{display:none;}
  .screen{position:static;overflow:visible;height:auto;}
  .screen-enter,.screen-back{animation:none;}
}

input,textarea,select{font-family:'DM Sans',sans-serif;}
@keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,80%,100%{opacity:.3;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
@keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastOut{to{opacity:0;transform:translateX(110%)}}
@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}
`;

// ── TOAST ────────────────────────────────────────────────────
let _showToast = () => {};
const useToast = () => _showToast;

function Toasts({ C }) {
  const [list, setList] = useState([]);
  _showToast = useCallback((msg, icon = "✓", type = "default") => {
    const id = Date.now() + Math.random();
    setList(p => [...p, { id, msg, icon, type }]);
    setTimeout(() => setList(p => p.map(t => t.id === id ? { ...t, dying: true } : t)), 2700);
    setTimeout(() => setList(p => p.filter(t => t.id !== id)), 3100);
  }, []);
  if (!list.length) return null;
  return (
    <div style={{ position: "fixed", top: 58, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", gap: 7, pointerEvents: "none" }}>
      {list.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 9,
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 13, padding: "10px 14px", maxWidth: 260,
          boxShadow: `0 8px 28px rgba(0,0,0,.22)`,
          animation: t.dying ? "toastOut .3s ease forwards" : "toastIn .25s ease forwards",
          borderLeft: t.type === "success" ? `3px solid ${C.green}` : t.type === "error" ? `3px solid #EF4444` : `3px solid ${C.accent}`,
        }}>
          <span style={{ fontSize: 14 }}>{t.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.text, lineHeight: 1.3 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── PRIMITIVES ────────────────────────────────────────────────
const Btn = ({ children, onClick, block, outline, ghost, sm, danger, C, style }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick} className="btn-ripple"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        width: block ? "100%" : undefined,
        padding: sm ? "8px 16px" : "12px 22px",
        borderRadius: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
        fontSize: sm ? 13 : 14.5, cursor: "pointer",
        transform: pressed ? "scale(.96)" : "scale(1)",
        transition: "transform .1s ease, box-shadow .15s ease",
        border: outline ? `1.5px solid ${danger ? "#EF4444" : C.accent}` : "none",
        background: ghost ? "transparent" : outline ? "transparent" : danger ? "#EF4444" : C.accent,
        color: ghost ? C.sub : outline ? (danger ? "#EF4444" : C.accent) : "#fff",
        boxShadow: (!outline && !ghost && !danger) ? (pressed ? "none" : `0 2px 14px ${C.accent}30`) : "none",
        flexShrink: 0, ...style,
      }}
    >{children}</button>
  );
};

const Back = ({ onClick, C }) => (
  <button onClick={onClick} style={{
    width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`,
    background: C.card, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: 20, color: C.sub, flexShrink: 0,
    fontFamily: "system-ui",
  }}>‹</button>
);

const Input = ({ value, onChange, placeholder, icon, type = "text", rows, C, style, onFocus, onBlur }) => {
  const base = {
    width: "100%", background: C.surface, border: `1.5px solid ${C.border}`,
    borderRadius: 11, padding: icon ? "11px 13px 11px 40px" : "11px 13px",
    color: C.text, fontSize: 14, outline: "none",
    fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, ...style,
  };
  const foc = e => { e.target.style.borderColor = C.accent; onFocus && onFocus(e); };
  const blu = e => { e.target.style.borderColor = C.border; onBlur && onBlur(e); };
  return (
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 13, top: rows ? 12 : "50%", transform: rows ? "none" : "translateY(-50%)", fontSize: 15, color: C.muted, pointerEvents: "none" }}>{icon}</span>}
      {rows
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...base, resize: "none" }} onFocus={foc} onBlur={blu} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base} onFocus={foc} onBlur={blu} />
      }
    </div>
  );
};

const Sheet = ({ open, onClose, title, children, C }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.surface, borderRadius: "20px 20px 0 0", padding: "18px 20px 38px", maxHeight: "88vh", overflowY: "auto", animation: "slideUp .28s cubic-bezier(.32,.72,0,1)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 34, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
        {title && <div className="disp" style={{ fontSize: 17, color: C.text, marginBottom: 18 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
};

const Tag = ({ children, color, C }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
    background: color === "green" ? C.greenBg : color === "gold" ? C.goldBg : C.accentBg,
    color: color === "green" ? C.green : color === "gold" ? C.gold : C.accent,
  }}>{children}</span>
);

const Divider = ({ C }) => <div style={{ height: 1, background: C.border }} />;

const ToggleSwitch = ({ on, onChange, C }) => (
  <div onClick={onChange} style={{ width: 44, height: 25, borderRadius: 13, background: on ? C.accent : C.border, cursor: "pointer", position: "relative", transition: "background .22s", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: 2.5, left: on ? 21 : 2.5, width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "left .22s", boxShadow: "0 1px 4px rgba(0,0,0,.25)" }} />
  </div>
);

// ── DATA ─────────────────────────────────────────────────────
const STORES = [
  { id: 1, name: "FoodMart",  emoji: "🛒", cat: "Groceries",  rating: 4.8, reviews: 2134, open: true,  eta: "25–40 min", min: 2000, verified: true,  color: "#FF6B35" },
  { id: 2, name: "GlowStore", emoji: "💄", cat: "Beauty",     rating: 4.7, reviews: 987,  open: true,  eta: "30–50 min", min: 1500, verified: true,  color: "#FF6B9D" },
  { id: 3, name: "TechHub",   emoji: "📱", cat: "Electronics",rating: 4.6, reviews: 3201, open: true,  eta: "45–90 min", min: 5000, verified: true,  color: "#5C6BC0" },
  { id: 4, name: "FreshFarm", emoji: "🌿", cat: "Organic",    rating: 4.9, reviews: 650,  open: false, eta: "60–90 min", min: 1000, verified: false, color: "#43A047" },
  { id: 5, name: "HomeNest",  emoji: "🛋️", cat: "Home",       rating: 4.5, reviews: 1102, open: true,  eta: "1–2 days",  min: 3000, verified: true,  color: "#8E6BBF" },
];

const PRODUCTS = {
  1: [{ id: 101, name: "Fresh Tomatoes 1kg",  price: 800,  emoji: "🍅" }, { id: 102, name: "Basmati Rice 5kg", price: 3200, emoji: "🍚" }, { id: 103, name: "Free-range Eggs ×12", price: 1800, emoji: "🥚" }, { id: 104, name: "Chicken Breast 1kg", price: 2800, emoji: "🍗" }],
  2: [{ id: 201, name: "Vitamin C Serum",     price: 8500, emoji: "🧴" }, { id: 202, name: "Matte Lipstick Set",price: 4200, emoji: "💄" }, { id: 203, name: "SPF 50 Sunscreen",  price: 5000, emoji: "☀️" }],
  3: [{ id: 301, name: "Wireless Earbuds",    price: 22500,emoji: "🎧" }, { id: 302, name: "USB-C Fast Charger",price: 3500, emoji: "🔌" }, { id: 303, name: "Power Bank 20000mAh",price: 9800, emoji: "🔋" }],
  5: [{ id: 501, name: "Throw Pillows ×2",    price: 4500, emoji: "🛋️" }, { id: 502, name: "Desk Lamp LED",    price: 6800, emoji: "💡" }],
};

const SHOPPERS = [
  { id: 1, name: "Amara Okafor", emoji: "👩🏾",    rating: 4.9, reviews: 312, specialty: "Groceries",  online: true,  rate: 500, errands: 1430 },
  { id: 2, name: "Kwame Asante", emoji: "👨🏿",    rating: 4.8, reviews: 198, specialty: "Electronics",online: true,  rate: 700, errands: 890 },
  { id: 3, name: "Fatima Bello", emoji: "👩🏾‍🦱",rating: 4.7, reviews: 425, specialty: "Beauty",     online: false, rate: 600, errands: 2100 },
  { id: 4, name: "Emeka Nwosu",  emoji: "👨🏾",    rating: 4.9, reviews: 560, specialty: "General",   online: true,  rate: 450, errands: 3200 },
];

const TXNS = [
  { label: "FoodMart Order",    amount: -3200, date: "Today 2:30pm",  icon: "🛒", cr: false },
  { label: "Wallet Top-up",     amount: 10000, date: "Yesterday",     icon: "💳", cr: true },
  { label: "Referral Bonus",    amount: 500,   date: "Feb 18",        icon: "🎁", cr: true },
  { label: "GlowStore Order",   amount: -9900, date: "Feb 17",        icon: "💄", cr: false },
  { label: "Cashback Reward",   amount: 320,   date: "Feb 15",        icon: "💰", cr: true },
];

// ── SPLASH ────────────────────────────────────────────────────
function Splash({ onDone, C }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setP(v => { if (v >= 100) { clearInterval(t); setTimeout(onDone, 200); return 100; } return v + 3; }), 30);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", animation: "up .5s ease" }}>
        <div style={{ width: 80, height: 80, background: C.accent, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 22px", boxShadow: `0 0 40px ${C.accent}50` }}>🛍️</div>
        <div className="disp" style={{ fontSize: 32, color: C.text, letterSpacing: "-0.5px" }}>errand</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 6, letterSpacing: "0.5px" }}>your market, delivered</div>
      </div>
      <div style={{ position: "absolute", bottom: 60, width: 140 }}>
        <div style={{ height: 2, background: C.border, borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${p}%`, background: C.accent, borderRadius: 1, transition: "width .03s linear" }} />
        </div>
      </div>
    </div>
  );
}

// ── AUTH ─────────────────────────────────────────────────────
function Auth({ onDone, C }) {
  const [mode, setMode] = useState("in");
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [e, setE] = useState("");
  const [loading, setLoading] = useState(false);
  const go = () => { setLoading(true); setTimeout(onDone, 1300); };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px 48px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 38 }}>
        <div style={{ width: 64, height: 64, background: C.accent, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 16px", boxShadow: `0 4px 22px ${C.accent}44` }}>🛍️</div>
        <div className="disp" style={{ fontSize: 26, color: C.text }}>errand</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 5 }}>{mode === "in" ? "Welcome back" : "Create your account"}</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.card, borderRadius: 12, padding: 3, marginBottom: 24, border: `1px solid ${C.border}` }}>
        {[["in","Sign in"],["up","Sign up"]].map(([id, l]) => (
          <button key={id} onClick={() => setMode(id)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, transition: "all .2s", background: mode === id ? C.accent : "transparent", color: mode === id ? "#fff" : C.sub }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 20 }}>
        {mode === "up" && <Input C={C} icon="✉️" placeholder="Email address" type="email" value={e} onChange={x => setE(x.target.value)} />}
        <Input C={C} icon="👤" placeholder="Username" value={u} onChange={x => setU(x.target.value)} />
        <Input C={C} icon="🔒" placeholder="Password" type="password" value={p} onChange={x => setP(x.target.value)} />
        {mode === "in" && <div style={{ textAlign: "right" }}><span onClick={() => {}} style={{ color: C.accent, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Forgot password?</span></div>}
      </div>

      <Btn C={C} block onClick={go} style={{ padding: "14px", fontSize: 15, marginBottom: 20 }}>
        {loading
          ? <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
          : mode === "in" ? "Sign in" : "Create account"}
      </Btn>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Divider C={C} /><span style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>or continue with</span><Divider C={C} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {[["🍎","Apple"],["G","Google"]].map(([icon, name]) => (
          <button key={name} onClick={go} style={{ flex: 1, padding: "12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontFamily: name === "Google" ? "Georgia,serif" : "system-ui", fontWeight: "bold", fontSize: name === "Apple" ? 20 : 15, color: name === "Google" ? "#DB4437" : C.text, transition: "border-color .18s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >{icon}</button>
        ))}
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────────────────
//  AI COMPONENTS
// ────────────────────────────────────────────────────────────

// ── AI RECOMMENDATIONS (shown on Home) ──────────────────────
function AIRecommendations({ goTo, addToCart, C }) {
  const toast = useToast();
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const run = async () => {
      const system = APP_CONTEXT + `
You are a personalized recommendation engine.
Based on the user's order history and preferences, suggest 3 products they'd love.
Return ONLY this JSON (no markdown):
{
  "headline": "short catchy reason for these picks (max 8 words)",
  "picks": [
    { "emoji": "...", "name": "...", "store": "...", "price": 1234, "reason": "10-word personal reason" }
  ]
}`;
      try {
        const data = await askClaude(system, "Recommend 3 products for this user based on their history.", true);
        setRecs(data);
      } catch(e) { setRecs(null); }
      setLoading(false);
    };
    run();
  }, []);

  if (dismissed || (!loading && !recs)) return null;

  return (
    <div style={{ margin: "0 20px 22px", animation: loading ? "none" : "up .35s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 14 }}>✨</span>
          <div className="disp" style={{ fontSize: 15, color: C.text }}>
            {loading ? "Finding your picks…" : recs?.headline || "Just for you"}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, background: C.accentBg, padding: "2px 6px", borderRadius: 5 }}>AI</span>
        </div>
        <button onClick={() => setDismissed(true)} style={{ color: C.muted, background: "none", border: "none", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 130, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, animation: `shimmer 1.4s ${i*.2}s ease-in-out infinite` }} />)}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10 }}>
          {recs?.picks?.map((p, i) => (
            <div key={i} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 10px", position: "relative" }}>
              <div style={{ fontSize: 32, textAlign: "center", marginBottom: 7 }}>{p.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text, marginBottom: 2, lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ color: C.muted, fontSize: 10.5, marginBottom: 7, fontStyle: "italic", lineHeight: 1.3 }}>{p.reason}</div>
              <div className="disp" style={{ color: C.accent, fontSize: 13 }}>₦{Number(p.price).toLocaleString()}</div>
              <button onClick={() => { addToCart({ id: 900+i, name: p.name, price: Number(p.price), emoji: p.emoji }); toast(`${p.name} added`, "🛒", "success"); }}
                style={{ position: "absolute", top: 9, right: 9, width: 24, height: 24, borderRadius: 7, background: C.accent, border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI REORDER SUGGESTIONS (shown in Cart when empty) ────────
function AIReorderSuggestions({ addToCart, C }) {
  const toast = useToast();
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const system = APP_CONTEXT + `
You are a smart reorder engine. Analyse the user's purchase history and tell them what they likely need to restock.
Return ONLY this JSON (no markdown):
{
  "insight": "short sentence about their shopping pattern (max 12 words)",
  "reorders": [
    { "emoji": "...", "name": "...", "store": "...", "price": 1234, "lastBought": "e.g. 2 weeks ago", "urgency": "high|medium|low" }
  ]
}
Return 3-4 items.`;
      try {
        const data = await askClaude(system, "What should this user reorder based on their history?", true);
        setRecs(data);
      } catch(e) { setRecs(null); }
      setLoading(false);
    };
    run();
  }, []);

  if (!loading && !recs) return null;

  return (
    <div style={{ padding: "0 20px", animation: "up .35s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <span style={{ fontSize: 14 }}>🔁</span>
        <div className="disp" style={{ fontSize: 15, color: C.text }}>
          {loading ? "Checking your history…" : "Time to restock?"}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, background: C.accentBg, padding: "2px 6px", borderRadius: 5 }}>AI</span>
      </div>

      {!loading && recs?.insight && (
        <div style={{ background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 11, padding: "10px 13px", marginBottom: 14, fontSize: 13, color: C.text }}>
          ✨ {recs.insight}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 68, background: C.card, borderRadius: 13, border: `1px solid ${C.border}`, animation: `shimmer 1.4s ${i*.15}s ease-in-out infinite` }} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {recs?.reorders?.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${r.urgency === "high" ? C.accent+"44" : C.border}`, borderRadius: 13, padding: "12px 13px" }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>{r.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{r.name}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
                  <span style={{ color: C.muted, fontSize: 11.5 }}>Last: {r.lastBought}</span>
                  {r.urgency === "high" && <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, background: C.accentBg, padding: "1px 6px", borderRadius: 4 }}>Restock soon</span>}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div className="disp" style={{ color: C.text, fontSize: 14 }}>₦{Number(r.price).toLocaleString()}</div>
                <button onClick={() => { addToCart({ id: 800+i, name: r.name, price: Number(r.price), emoji: r.emoji }); toast(`${r.name} added`, "🛒", "success"); }}
                  style={{ marginTop: 5, padding: "5px 11px", background: C.accent, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Re-add</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI ASSISTANT (floating chat bubble) ────────────────────
function AIAssistant({ goTo, addToCart, C }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { role: "assistant", text: "Hi John! 👋 I'm Errand AI. I can help you find products, compare prices, plan your shopping, or answer anything about the app. What do you need?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const history = useRef([]);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    history.current.push({ role: "user", content: userMsg });

    const system = APP_CONTEXT + `
You are Errand AI — a helpful, friendly, concise shopping assistant embedded in the Errand app.
You help users: find products, compare options, suggest what to buy, explain app features, 
recommend stores, estimate costs, and plan their shopping.
Keep responses SHORT (2-4 sentences max). Use emojis naturally. Be warm and Nigerian-friendly.
Never make up prices — use approximate ranges from the app context.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system,
          messages: history.current,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Sorry, I couldn't respond. Try again!";
      history.current.push({ role: "assistant", content: reply });
      setMsgs(m => [...m, { role: "assistant", text: reply }]);
    } catch(e) {
      setMsgs(m => [...m, { role: "assistant", text: "Network error — please try again! 🙏" }]);
    }
    setLoading(false);
  };

  const QUICK = ["What's on sale?", "Reorder my groceries", "Best earbuds under ₦25k", "What's my loyalty tier?"];

  return (
    <>
      {/* Floating button */}
      <div onClick={() => setOpen(o => !o)} style={{ position: "fixed", bottom: 94, right: 18, width: 52, height: 52, borderRadius: 16, background: C.accent, boxShadow: `0 4px 20px ${C.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 400, fontSize: 24, transition: "transform .2s" }}
        onMouseDown={e => e.currentTarget.style.transform = "scale(.9)"}
        onMouseUp={e => e.currentTarget.style.transform = ""}
        onMouseLeave={e => e.currentTarget.style.transform = ""}>
        {open ? "×" : "✨"}
        {!open && <div style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: "50%", background: C.green, border: `2px solid ${C.bg}` }} />}
      </div>

      {/* Chat panel */}
      {open && (
        <div style={{ position: "fixed", bottom: 158, right: 16, width: "min(360px, calc(100vw - 32px))", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,.3)", zIndex: 400, display: "flex", flexDirection: "column", maxHeight: "60vh", animation: "up .25s ease" }}>
          {/* Header */}
          <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>✨</div>
            <div style={{ flex: 1 }}>
              <div className="disp" style={{ fontSize: 14, color: C.text }}>Errand AI</div>
              <div style={{ color: C.green, fontSize: 11 }}>● Always available</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: C.muted, background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9, minHeight: 0 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", background: m.role === "user" ? C.accent : C.card, color: m.role === "user" ? "#fff" : C.text, borderRadius: 13, padding: "9px 12px", fontSize: 13.5, border: m.role !== "user" ? `1px solid ${C.border}` : "none", lineHeight: 1.5, display: "inline-block" }}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", display: "flex", gap: 5, padding: "10px 13px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.muted, animation: `blink 1.2s ${i*.2}s ease-in-out infinite` }} />)}
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick prompts (only when conversation is fresh) */}
          {msgs.length === 1 && (
            <div style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK.map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => send(), 0); }} style={{ padding: "5px 11px", background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 16, color: C.accent, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "10px 12px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask me anything…"
              style={{ flex: 1, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5, outline: "none" }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() && !loading ? C.accent : C.border, border: "none", color: "#fff", fontSize: 17, cursor: input.trim() && !loading ? "pointer" : "default", transition: "background .18s", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
          </div>
        </div>
      )}
    </>
  );
}


// ── HOME ────────────────────────────────────────────────────
function Home({ goTo, cart, addToCart, C, dark, toggleDark }) {
  const toast = useToast();
  const revealRef = useScrollReveal();
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const [t, setT] = useState(9240);
  useEffect(() => { const x = setInterval(() => setT(v => v > 0 ? v - 1 : 0), 1000); return () => clearInterval(x); }, []);
  const fmtTime = s => [Math.floor(s/3600), Math.floor((s%3600)/60), s%60].map(n => String(n).padStart(2,"0")).join(":");

  const DEALS = [
    { id: 901, emoji: "🎧", name: "Wireless Earbuds", store: "TechHub",  was: 45000, now: 21500, pct: 52 },
    { id: 902, emoji: "🧴", name: "Vitamin C Serum",  store: "GlowStore",was: 12000, now: 6400,  pct: 47 },
    { id: 903, emoji: "🍚", name: "Basmati Rice 5kg", store: "FoodMart", was: 4500,  now: 2600,  pct: 42 },
  ];

  const quickActions = [
    { label: "Stores",   icon: "🏪", view: "stores" },
    { label: "Shoppers", icon: "🧑‍💼", view: "shoppers" },
    { label: "Track",    icon: "📍", view: "tracking" },
    { label: "Wallet",   icon: "💰", view: "wallet" },
    { label: "Rewards",  icon: "🏆", view: "rewards" },
    { label: "Group",    icon: "👥", view: "groupbuy" },
    { label: "Pass",     icon: "👑", view: "pass" },
    { label: "Refer",    icon: "🎁", view: "referral" },
  ];

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 86 }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, fontSize: 12, marginBottom: 4, cursor: "pointer" }}>
            <span>📍</span><span style={{ fontWeight: 500 }}>Victoria Island, Lagos</span><span style={{ color: C.accent, fontWeight: 600 }}>▾</span>
          </div>
          <div className="disp" style={{ fontSize: 22, color: C.text }}>Hi, John 👋</div>
        </div>
        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button onClick={toggleDark} style={{ width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{dark ? "☀️" : "🌙"}</button>
          <div onClick={() => goTo("notifications")} style={{ width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            🔔
            <div style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: "50%", background: C.accent, border: `2px solid ${C.bg}` }} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 20px 18px" }}>
        <div onClick={() => goTo("search")} style={{ display: "flex", alignItems: "center", gap: 9, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", cursor: "pointer" }}>
          <span style={{ fontSize: 16, color: C.muted }}>🔍</span>
          <span style={{ color: C.muted, fontSize: 14, flex: 1 }}>Search stores, products…</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentBg, padding: "2px 7px", borderRadius: 6 }}>AI</span>
        </div>
      </div>

      {/* Loyalty */}
      <div onClick={() => goTo("rewards")} style={{ margin: "0 20px 20px", background: C.goldBg, border: `1px solid rgba(245,166,35,.2)`, borderRadius: 13, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <span style={{ fontSize: 22 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 5 }}>Gold · 3,240 pts</div>
          <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "64%", background: C.gold, borderRadius: 2 }} />
          </div>
        </div>
        <span style={{ color: C.sub, fontSize: 14 }}>›</span>
      </div>

      {/* AI Recommendations */}
      <AIRecommendations goTo={goTo} addToCart={addToCart} C={C} />

      {/* Quick actions */}
      <div style={{ padding: "0 20px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
          {quickActions.map(a => (
            <button key={a.label} onClick={() => goTo(a.view)} className="btn-ripple" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "14px 6px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, transition: "transform .1s ease, background .12s" }}
              onPointerDown={e => { e.currentTarget.style.transform = "scale(.94)"; e.currentTarget.style.background = C.accentBg; }}
              onPointerUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = C.card; }}
              onPointerLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = C.card; }}>
              <span style={{ fontSize: 24 }}>{a.icon}</span>
              <span style={{ color: C.sub, fontSize: 10.5, fontWeight: 500 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flash deals */}
      <div style={{ padding: "0 20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
          <div className="disp" style={{ fontSize: 16, color: C.text }}>⚡ Flash Deals</div>
          <div style={{ background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: C.accent, fontVariantNumeric: "tabular-nums" }}>{fmtTime(t)}</div>
        </div>
        <div className="hrow">
          {DEALS.map(d => (
            <div key={d.id} style={{ flexShrink: 0, width: 152, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 13px" }}>
              <div style={{ fontSize: 38, textAlign: "center", marginBottom: 10 }}>{d.emoji}</div>
              <div style={{ fontWeight: 500, fontSize: 13, color: C.text, marginBottom: 2, lineHeight: 1.3 }}>{d.name}</div>
              <div style={{ color: C.sub, fontSize: 11, marginBottom: 10 }}>{d.store}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ color: C.muted, fontSize: 11, textDecoration: "line-through" }}>₦{d.was.toLocaleString()}</div>
                  <div className="disp" style={{ color: C.accent, fontSize: 15 }}>₦{d.now.toLocaleString()}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); addToCart({ id: d.id, name: d.name, price: d.now, emoji: d.emoji }); toast("Added to cart", "🛒", "success"); }}
                  className="btn-ripple"
                  onPointerDown={e => e.currentTarget.style.transform = "scale(.88)"}
                  onPointerUp={e => e.currentTarget.style.transform = ""}
                  onPointerLeave={e => e.currentTarget.style.transform = ""}
                  style={{ width: 30, height: 30, borderRadius: 9, background: C.accent, border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .1s ease" }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open stores */}
      <div style={{ padding: "0 20px" }} ref={revealRef}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
          <div className="disp" style={{ fontSize: 16, color: C.text }}>Open Now</div>
          <span onClick={() => goTo("stores")} style={{ color: C.accent, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>See all →</span>
        </div>
        <div className="hrow">
          {STORES.filter(s => s.open).map((s, i) => (
            <div key={s.id} onClick={() => goTo("stores")} className="reveal tap" style={{ flexShrink: 0, width: 130, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 12px", textAlign: "center", cursor: "pointer", transitionDelay: `${i * 40}ms` }}>
              <div style={{ width: 48, height: 48, borderRadius: 15, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 8px" }}>{s.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 2 }}>{s.name}</div>
              <div style={{ color: C.sub, fontSize: 11 }}>⭐ {s.rating}</div>
              <div style={{ color: C.muted, fontSize: 10.5, marginTop: 3 }}>{s.eta}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SEARCH ───────────────────────────────────────────────────
// ── AI SEARCH ───────────────────────────────────────────────
function Search({ goTo, C }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState([]);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, []);

  const recent = ["Fresh tomatoes", "Vitamin C serum", "Wireless earbuds"];
  const trending = ["Jollof rice bundle 🍛", "Skincare kit ✨", "Protein powder 💪", "Desk lamp 💡"];

  const runSearch = async (query) => {
    if (!query.trim()) { setResults(null); setSuggested([]); return; }
    setLoading(true);
    setResults(null);
    const system = APP_CONTEXT + `
You are a smart product search engine for Errand.
Given a natural language query, return a JSON object with:
{
  "intent": "one sentence summary of what user wants",
  "results": [
    { "emoji": "...", "name": "...", "store": "...", "price": 1234, "match": "why this matches" }
  ],
  "suggestions": ["related search 1", "related search 2", "related search 3"],
  "tip": "optional short helpful tip about the query"
}
Return 3-6 results. Use only products from the app's stores. Prices in Naira integers.
Return ONLY valid JSON, no markdown.`;
    try {
      const data = await askClaude(system, `Search query: "${query}"`, true);
      setResults(data);
      setSuggested(data?.suggestions || []);
    } catch (e) {
      setResults({ intent: "Search failed", results: [], suggestions: [], tip: null });
    }
    setLoading(false);
  };

  const handleChange = (val) => {
    setQ(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults(null); setSuggested([]); return; }
    debounceRef.current = setTimeout(() => runSearch(val), 600);
  };

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 10, alignItems: "center" }}>
        <Back onClick={() => goTo("home")} C={C} />
        <div style={{ flex: 1, position: "relative" }}>
          <Input C={C} icon="🔍" placeholder="Try: 'something healthy for breakfast'…" value={q} onChange={e => handleChange(e.target.value)} style={{ paddingRight: loading ? 40 : 13 }} />
          {loading && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin .7s linear infinite" }} />}
        </div>
        {q && <button onClick={() => handleChange("")} style={{ color: C.muted, background: "none", border: "none", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>}
      </div>

      <div style={{ padding: "0 20px" }}>
        {!q && (
          <>
            {/* AI badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 11, padding: "10px 13px", marginBottom: 20 }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <span style={{ color: C.text, fontSize: 13 }}>Ask in plain English — <span style={{ color: C.accent, fontWeight: 600 }}>AI understands you</span></span>
            </div>
            <div style={{ color: C.sub, fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: ".5px" }}>RECENT</div>
            {recent.map(r => (
              <div key={r} onClick={() => { setQ(r); runSearch(r); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                <span style={{ color: C.muted }}>🕐</span>
                <span style={{ flex: 1, fontSize: 14, color: C.text }}>{r}</span>
                <span style={{ color: C.muted }}>↗</span>
              </div>
            ))}
            <div style={{ color: C.sub, fontSize: 12, fontWeight: 600, margin: "20px 0 11px", letterSpacing: ".5px" }}>TRENDING</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {trending.map(t => (
                <div key={t} onClick={() => { setQ(t); runSearch(t); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>{t}</div>
              ))}
            </div>
          </>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ height: 36, background: C.card, borderRadius: 10, animation: "shimmer 1.4s ease-in-out infinite" }} />
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 72, background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, animation: "shimmer 1.4s ease-in-out infinite", animationDelay: `${i * .15}s` }} />
            ))}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div style={{ animation: "up .3s ease" }}>
            {/* Intent badge */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 11, padding: "10px 13px", marginBottom: 16 }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>✨</span>
              <span style={{ color: C.text, fontSize: 13, lineHeight: 1.5 }}>{results.intent}</span>
            </div>

            {results.results?.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🤷</div>
                <div style={{ color: C.text, fontWeight: 500 }}>Nothing found</div>
                <div style={{ color: C.sub, fontSize: 13, marginTop: 6 }}>Try a different search</div>
              </div>
            )}

            {results.results?.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 9 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{r.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{r.name}</div>
                  <div style={{ color: C.sub, fontSize: 12, marginTop: 1 }}>{r.store}</div>
                  <div style={{ color: C.muted, fontSize: 11.5, marginTop: 2, fontStyle: "italic" }}>{r.match}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="disp" style={{ color: C.accent, fontSize: 15 }}>₦{Number(r.price).toLocaleString()}</div>
                  <button style={{ marginTop: 6, padding: "5px 12px", background: C.accent, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    onClick={() => goTo("stores")}>Shop →</button>
                </div>
              </div>
            ))}

            {results.tip && (
              <div style={{ display: "flex", gap: 8, background: C.goldBg, border: `1px solid rgba(245,166,35,.2)`, borderRadius: 11, padding: "10px 13px", marginBottom: 16 }}>
                <span style={{ fontSize: 15 }}>💡</span>
                <span style={{ color: C.sub, fontSize: 13 }}>{results.tip}</span>
              </div>
            )}

            {/* Related searches */}
            {suggested.length > 0 && (
              <>
                <div style={{ color: C.sub, fontSize: 12, fontWeight: 600, margin: "4px 0 10px", letterSpacing: ".5px" }}>RELATED SEARCHES</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {suggested.map(s => (
                    <div key={s} onClick={() => { setQ(s); runSearch(s); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>{s}</div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STORES ──────────────────────────────────────────────────
function Stores({ goTo, onStore, C }) {
  const [cat, setCat] = useState("All");
  const cats = ["All", "Groceries", "Beauty", "Electronics", "Organic", "Home"];
  const [filtering, setFiltering] = useState(false);
  const revealRef = useScrollReveal();
  const handleCat = (c) => { if (c === cat) return; setFiltering(true); setTimeout(() => { setCat(c); setFiltering(false); }, 160); };
  const filtered = cat === "All" ? STORES : STORES.filter(s => s.cat === cat);
  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("home")} C={C} />
        <div>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>Stores</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{STORES.filter(s => s.open).length} open now · {STORES.length} total</div>
        </div>
      </div>
      <div className="hrow" style={{ padding: "0 20px 16px" }}>
        {cats.map(c => <button key={c} onClick={() => handleCat(c)} style={{ padding: "7px 16px", borderRadius: 20, border: "none", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 13, cursor: "pointer", background: cat === c ? C.accent : C.card, color: cat === c ? "#fff" : C.sub, flexShrink: 0, transition: "all .16s" }}>{c}</button>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
        {filtering ? [1,2,3].map(i => <SkelCard key={i} C={C} />) : filtered.map(s => (
          <div key={s.id} onClick={() => onStore(s)} className="reveal tap" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: "flex", gap: 13, cursor: "pointer", transition: "border-color .15s, transform .1s ease" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accentLine}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{s.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                <span className="disp" style={{ fontSize: 15, color: C.text }}>{s.name}</span>
                {s.verified && <span title="Verified" style={{ fontSize: 12 }}>✅</span>}
                <Tag color={s.open ? "green" : ""} C={C}>{s.open ? "Open" : "Closed"}</Tag>
              </div>
              <div style={{ color: C.sub, fontSize: 12 }}>⭐ {s.rating} · {s.reviews.toLocaleString()} reviews</div>
              <div style={{ color: C.muted, fontSize: 11.5, marginTop: 3 }}>🕐 {s.eta}  ·  Min ₦{s.min.toLocaleString()}</div>
            </div>
            <span style={{ color: C.muted, fontSize: 18, alignSelf: "center" }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── STORE DETAIL ────────────────────────────────────────────
function StoreDetail({ store, onBack, addToCart, C }) {
  const toast = useToast();
  const [tab, setTab] = useState("products");
  const [chatOpen, setChatOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgs, setMsgs] = useState([{ from: "s", text: `Welcome to ${store.name}! How can we help? 😊` }]);
  const products = PRODUCTS[store.id] || [];
  const reviews = [
    { user: "Amaka O.", rating: 5, text: "Fastest delivery, freshest produce!", date: "Feb 20" },
    { user: "Chidi N.", rating: 4, text: "Great quality, slight delay but worth it.", date: "Feb 17" },
    { user: "Temi A.", rating: 5, text: "My forever go-to store.", date: "Feb 14" },
  ];
  const sendMsg = () => {
    if (!msg.trim()) return;
    const m = msg; setMsgs(p => [...p, { from: "me", text: m }]); setMsg("");
    setTimeout(() => setMsgs(p => [...p, { from: "s", text: "Got it! We'll respond within 2 minutes ⚡" }]), 900);
  };
  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
          <Back onClick={onBack} C={C} />
          <div style={{ width: 50, height: 50, borderRadius: 15, background: `${store.color}18`, border: `1px solid ${store.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{store.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="disp" style={{ fontSize: 18, color: C.text }}>{store.name}</div>
            <div style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>⭐ {store.rating} · {store.reviews.toLocaleString()} reviews · {store.cat}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn C={C} sm onClick={() => setChatOpen(true)}>💬 Chat</Btn>
          <Btn C={C} sm outline>📅 Schedule</Btn>
          <button style={{ width: 36, height: 36, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>❤️</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.card, borderRadius: 12, margin: "14px 20px 0", padding: 3, border: `1px solid ${C.border}` }}>
        {[["products","Products"],["reviews","Reviews"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13.5, transition: "all .18s", background: tab === id ? C.accent : "transparent", color: tab === id ? "#fff" : C.sub }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: "14px 20px 0" }}>
        {tab === "products" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {products.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>No products listed yet</div>}
            {products.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 13, background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "13px 14px" }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{p.name}</div>
                  <div className="disp" style={{ color: C.accent, fontSize: 15, marginTop: 2 }}>₦{p.price.toLocaleString()}</div>
                </div>
                <button onClick={() => { addToCart(p); toast(`${p.name} added`, "🛒", "success"); }}
                  style={{ width: 32, height: 32, borderRadius: 9, background: C.accent, border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>+</button>
              </div>
            ))}
          </div>
        )}
        {tab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, display: "flex", gap: 22, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div className="disp" style={{ fontSize: 42, color: C.gold }}>{store.rating}</div>
                <div style={{ color: C.gold, fontSize: 13, marginTop: 2 }}>{"★".repeat(Math.floor(store.rating))}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{store.reviews.toLocaleString()} reviews</div>
              </div>
              <div style={{ flex: 1 }}>
                {[5,4,3,2,1].map(n => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span style={{ color: C.muted, fontSize: 11, width: 8 }}>{n}</span>
                    <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${[72,18,6,3,1][5-n]}%`, background: C.gold, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {reviews.map((r, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{r.user}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>{r.date}</span>
                </div>
                <div style={{ color: C.gold, fontSize: 12, marginBottom: 7 }}>{"★".repeat(r.rating)}</div>
                <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.55 }}>{r.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={chatOpen} onClose={() => setChatOpen(false)} C={C} title={`Chat · ${store.name}`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, maxHeight: 220, overflowY: "auto", marginBottom: 14 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", background: m.from === "me" ? C.accent : C.card, color: m.from === "me" ? "#fff" : C.text, borderRadius: 12, padding: "9px 13px", fontSize: 13.5, maxWidth: "80%", border: m.from !== "me" ? `1px solid ${C.border}` : "none", display: "inline-block", lineHeight: 1.5 }}>{m.text}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input C={C} placeholder="Type a message…" value={msg} onChange={e => setMsg(e.target.value)} style={{ flex: 1 }} />
          <Btn C={C} onClick={sendMsg} style={{ padding: "11px 16px" }}>→</Btn>
        </div>
      </Sheet>
    </div>
  );
}

// ── SHOPPERS ─────────────────────────────────────────────────
function Shoppers({ goTo, onShopper, C }) {
  const toast = useToast();
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listText, setListText] = useState("");
  const [budget, setBudget] = useState("");
  const [posted, setPosted] = useState(false);
  const list = onlineOnly ? SHOPPERS.filter(s => s.online) : SHOPPERS;
  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("home")} C={C} />
        <div style={{ flex: 1 }}>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>Personal Shoppers</div>
          <div style={{ color: C.green, fontSize: 12, marginTop: 2 }}>● {SHOPPERS.filter(s => s.online).length} online now</div>
        </div>
      </div>

      {/* Post a list card */}
      <div style={{ margin: "0 20px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 2 }}>Post a shopping list</div>
          <div style={{ color: C.sub, fontSize: 12 }}>Multiple shoppers bid — you pick the best deal</div>
        </div>
        <Btn C={C} sm onClick={() => { setPosted(false); setListOpen(true); }}>+ Post</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "0 20px 14px" }}>
        {[false, true].map(v => (
          <button key={String(v)} onClick={() => setOnlineOnly(v)} style={{ padding: "7px 16px", borderRadius: 20, border: "none", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 13, cursor: "pointer", background: onlineOnly === v ? C.accent : C.card, color: onlineOnly === v ? "#fff" : C.sub, transition: "all .16s" }}>{v ? "● Online only" : "All shoppers"}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
        {list.map(s => (
          <div key={s.id} onClick={() => onShopper(s)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, cursor: "pointer", transition: "border-color .16s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accentLine}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: 15, background: C.surface, border: `2px solid ${s.online ? C.green : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{s.emoji}</div>
                {s.online && <div style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: C.green, border: `2px solid ${C.card}` }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div className="disp" style={{ fontSize: 15, color: C.text }}>{s.name}</div>
                  {s.verified && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenBg, padding: "2px 6px", borderRadius: 5 }}>✓ Verified</span>}
                </div>
                <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{s.specialty}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 5, alignItems: "center" }}>
                  <span style={{ color: C.gold, fontSize: 12 }}>★ {s.rating}</span>
                  <span style={{ color: C.sub, fontSize: 12 }}>({s.reviews})</span>
                  <span style={{ color: C.accent, fontSize: 12, fontWeight: 600 }}>₦{s.rate}/hr</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 12 }}>
              <span>✓ {s.errands.toLocaleString()} errands</span>
              {s.online && <span style={{ color: C.accent, fontWeight: 500 }}>Chat now →</span>}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={listOpen} onClose={() => setListOpen(false)} C={C} title="Post Shopping List">
        {!posted ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <Input C={C} placeholder={"2kg fresh tomatoes\nBasmati rice 5kg\nEggs ×12"} value={listText} onChange={e => setListText(e.target.value)} rows={5} />
            <Input C={C} icon="₦" placeholder="Budget (e.g. 8000)" value={budget} onChange={e => setBudget(e.target.value)} />
            <Btn C={C} block onClick={() => setPosted(true)}>Post to Shoppers</Btn>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
            <div className="disp" style={{ fontSize: 20, color: C.text, marginBottom: 8 }}>List is Live!</div>
            <div style={{ color: C.sub, fontSize: 14, marginBottom: 22, lineHeight: 1.6 }}>Shoppers are reviewing your list. Bids arrive within minutes.</div>
            <Btn C={C} block onClick={() => { setListOpen(false); toast("Your list is live!", "📋", "success"); }}>Done</Btn>
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ── SHOPPER CHAT ─────────────────────────────────────────────
function ShopperChat({ shopper, onBack, C }) {
  const toast = useToast();
  const [msgs, setMsgs] = useState([{ from: "s", text: `Hi! I'm ${shopper.name} and I'm available right now. Want me to send you a quote?` }]);
  const [msg, setMsg] = useState("");
  const [typing, setTyping] = useState(false);
  const [quoted, setQuoted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    if (!msg.trim()) return;
    const m = msg; setMsgs(p => [...p, { from: "me", text: m }]); setMsg(""); setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (!quoted) { setQuoted(true); setMsgs(p => [...p, { from: "s", text: "Here's my quote 👇", isQuote: true }]); }
      else { setMsgs(p => [...p, { from: "s", text: "On my way to the market! I'll send you item photos as I shop 🏃‍♀️" }]); toast(`${shopper.name.split(" ")[0]} is heading out!`, "✅", "success"); }
    }, 1200);
  };

  return (
    <div className="screen" style={{ background: C.bg, display: "flex", flexDirection: "column", paddingBottom: 0 }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
        <Back onClick={onBack} C={C} />
        <div style={{ width: 42, height: 42, borderRadius: 13, background: C.surface, border: `2px solid ${shopper.online ? C.green : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{shopper.emoji}</div>
        <div style={{ flex: 1 }}>
          <div className="disp" style={{ fontSize: 15, color: C.text }}>{shopper.name}</div>
          <div style={{ color: C.green, fontSize: 12, marginTop: 2 }}>● Online · {shopper.specialty}</div>
        </div>
        <button style={{ width: 36, height: 36, borderRadius: 10, background: C.greenBg, border: "none", fontSize: 17, cursor: "pointer" }}>📞</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 9 }}>
        {msgs.map((m, i) => (
          <div key={i}>
            <div style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", background: m.from === "me" ? C.accent : C.card, color: m.from === "me" ? "#fff" : C.text, borderRadius: 14, padding: "10px 14px", fontSize: 14, maxWidth: "80%", border: m.from !== "me" ? `1px solid ${C.border}` : "none", display: "inline-block", lineHeight: 1.5 }}>{m.text}</div>
            {m.isQuote && !accepted && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, margin: "10px 0" }}>
                <div className="disp" style={{ fontSize: 15, color: C.text, marginBottom: 12 }}>Quote</div>
                {[["Shopping rate", `₦${shopper.rate}/hr`], ["Estimated time", "45–60 min"], ["Service fee", "₦1,200"], ["Total estimate", `₦${(shopper.rate + 1200).toLocaleString()}`]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13.5 }}>
                    <span style={{ color: C.sub }}>{k}</span>
                    <span style={{ fontWeight: 600, color: k === "Total estimate" ? C.accent : C.text }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 9, marginTop: 13 }}>
                  <Btn C={C} sm block onClick={() => { setAccepted(true); setMsgs(p => [...p, { from: "me", text: "Accepted! Let's do it 🙌" }]); toast("Shopper hired!", "✅", "success"); }}>Accept Quote</Btn>
                  <Btn C={C} sm outline block>Negotiate</Btn>
                </div>
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 5, padding: "10px 13px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: 62, alignSelf: "flex-start" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.muted, animation: `blink 1.2s ${i*.2}s ease-in-out infinite` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 20px 32px", borderTop: `1px solid ${C.border}`, background: C.bg, display: "flex", gap: 9, flexShrink: 0 }}>
        <Input C={C} placeholder="Message…" value={msg} onChange={e => setMsg(e.target.value)} style={{ flex: 1 }} />
        <Btn C={C} onClick={send} style={{ padding: "11px 16px" }}>→</Btn>
      </div>
    </div>
  );
}

// ── TRACKING ─────────────────────────────────────────────────
function Tracking({ goTo, C }) {
  const { status: liveStatus } = useTracking("demo_order_001");
  const [step, setStep] = useState(2);
  const steps = [
    { label: "Order placed",        time: "2:30 PM",       icon: "📋" },
    { label: "Store confirmed",      time: "2:35 PM",       icon: "✅" },
    { label: "Shopper assigned",     time: "2:38 PM",       icon: "🧑‍💼" },
    { label: "Shopping in progress", time: "Est. 3:00 PM",  icon: "🛒" },
    { label: "Out for delivery",     time: "Est. 3:25 PM",  icon: "🛵" },
    { label: "Delivered!",           time: "Est. 3:40 PM",  icon: "🎉" },
  ];
  useEffect(() => { if (step < 5) { const t = setTimeout(() => setStep(s => s + 1), 3500); return () => clearTimeout(t); } }, [step]);

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("home")} C={C} />
        <div>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>Order #0893</div>
          <div style={{ color: C.green, fontSize: 12, marginTop: 2 }}>● Live tracking</div>
        </div>
      </div>

      {/* Map placeholder */}
      <div style={{ margin: "0 20px 18px", height: 176, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: C.dark ? "linear-gradient(160deg,#0d1520,#091020)" : "linear-gradient(160deg,#ddeaf5,#c8dcee)" }} />
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          <path d="M40 145 Q120 90 220 110 Q310 130 370 50" stroke={C.accent} strokeWidth="2.5" fill="none" strokeDasharray="7 5" opacity=".5" />
        </svg>
        <div style={{ position: "absolute", left: "8%", bottom: "22%", fontSize: 22 }}>🏪</div>
        <div style={{ position: "absolute", left: "54%", top: "24%", fontSize: 24, animation: step >= 4 ? "shimmer 1.5s ease-in-out infinite" : undefined }}>🛵</div>
        <div style={{ position: "absolute", right: "7%", top: "18%", fontSize: 22 }}>🏠</div>
        <div style={{ position: "absolute", bottom: 12, right: 14, background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.green, fontWeight: 600 }}>ETA ~23 min</div>
      </div>

      {/* Shopper strip */}
      <div style={{ margin: "0 20px 20px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: C.surface, border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👨🏾</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Emeka Nwosu</div>
          <div style={{ color: C.sub, fontSize: 12 }}>⭐ 4.9 · Your shopper</div>
        </div>
        <button style={{ width: 36, height: 36, borderRadius: 10, background: C.greenBg, border: "none", fontSize: 17, cursor: "pointer" }}>📞</button>
        <button style={{ width: 36, height: 36, borderRadius: 10, background: C.accentBg, border: "none", fontSize: 17, cursor: "pointer" }}>💬</button>
      </div>

      {/* Timeline */}
      <div style={{ padding: "0 20px" }}>
        {steps.map((s, i) => (
          <div key={i} className="reveal" style={{ display: "flex", gap: 14, position: "relative" }}>
            {i < steps.length - 1 && <div style={{ position: "absolute", left: 15, top: 34, width: 2, height: 38, background: i < step ? C.accent : C.border, transition: "background .6s" }} />}
            <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: i < step ? C.accent : i === step ? C.accentBg : C.card, border: `2px solid ${i <= step ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all .4s" }}>{i < step ? "✓" : s.icon}</div>
            <div style={{ paddingBottom: i < steps.length - 1 ? 24 : 0, paddingTop: 5 }}>
              <div style={{ fontWeight: i <= step ? 600 : 400, fontSize: 14, color: i <= step ? C.text : C.muted }}>{s.label}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{s.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CART ─────────────────────────────────────────────────────
function Cart({ goTo, cart, setCart, C }) {
  const toast = useToast();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(null);
  const [method, setMethod] = useState("wallet");
  const [done, setDone] = useState(false);

  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = discount === "FIRST50" ? Math.round(sub * .5) : discount === "ERRAND20" ? 2000 : 0;
  const total = sub - disc;
  const update = (id, d) => setCart(p => p.map(i => i.id === id ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0));

  if (done) return (
    <div className="screen" style={{ background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px" }}>
      <div style={{ textAlign: "center", animation: "up .4s ease" }}>
        <div style={{ fontSize: 68, marginBottom: 20 }}>🎊</div>
        <div className="disp" style={{ fontSize: 26, color: C.text, marginBottom: 8 }}>Order placed!</div>
        <div style={{ color: C.sub, fontSize: 14, marginBottom: 6 }}>Order #ERR-2025-0893</div>
        <div style={{ color: C.sub, fontSize: 14, marginBottom: 32 }}>You earned <span style={{ color: C.accent, fontWeight: 600 }}>+{Math.round(total / 100)} pts</span></div>
        <Btn C={C} block onClick={() => goTo("tracking")} style={{ marginBottom: 11 }}>Track Order →</Btn>
        <Btn C={C} block ghost onClick={() => { setCart([]); setDone(false); goTo("home"); }}>Back to Home</Btn>
      </div>
    </div>
  );

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("home")} C={C} />
        <div className="disp" style={{ fontSize: 20, color: C.text }}>Cart</div>
        {cart.length > 0 && <span style={{ color: C.sub, fontSize: 14 }}>({cart.reduce((s, i) => s + i.qty, 0)} items)</span>}
      </div>

      {cart.length === 0 ? (
        <div>
          <div style={{ textAlign: "center", padding: "50px 28px 28px" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
            <div className="disp" style={{ fontSize: 20, color: C.text, marginBottom: 8 }}>Cart is empty</div>
            <div style={{ color: C.sub, fontSize: 14, marginBottom: 24 }}>Add items from stores or flash deals</div>
            <Btn C={C} onClick={() => goTo("stores")}>Browse Stores</Btn>
          </div>
          <AIReorderSuggestions addToCart={addToCart} C={C} />
        </div>
      ) : (
        <div style={{ padding: "0 20px" }}>
          {/* Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "12px 13px" }}>
                <span style={{ fontSize: 28 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, color: C.text }}>{item.name}</div>
                  <div style={{ color: C.accent, fontWeight: 600, fontSize: 14, marginTop: 1 }}>₦{(item.price * item.qty).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <button onClick={() => update(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 17, cursor: "pointer" }}>−</button>
                  <span style={{ fontWeight: 600, fontSize: 14, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                  <button onClick={() => update(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 8, background: C.accent, border: "none", color: "#fff", fontSize: 17, cursor: "pointer" }}>+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div style={{ display: "flex", gap: 9, marginBottom: 13 }}>
            <Input C={C} icon="🎟️" placeholder="Coupon code" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} style={{ flex: 1 }} />
            <Btn C={C} sm onClick={() => {
              if (["FIRST50","ERRAND20"].includes(coupon)) { setDiscount(coupon); toast("Coupon applied!", "✓", "success"); }
              else toast("Invalid coupon code", "✕", "error");
            }}>Apply</Btn>
          </div>

          {/* Payment method */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "13px 14px", marginBottom: 13 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 11 }}>Payment method</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["wallet","💰 Wallet"],["card","💳 Card"],["transfer","🏦 Transfer"]].map(([id, l]) => (
                <button key={id} onClick={() => setMethod(id)} style={{ flex: 1, padding: "9px 4px", borderRadius: 10, border: `1.5px solid ${method === id ? C.accent : C.border}`, background: method === id ? C.accentBg : "transparent", color: method === id ? C.accent : C.sub, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: "all .16s" }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "13px 14px", marginBottom: 14 }}>
            {[["Subtotal", `₦${sub.toLocaleString()}`, false], ...(discount ? [["Discount", `-₦${disc.toLocaleString()}`, true]] : []), ["Delivery", "Free 🎉", false]].map(([k, v, isDisc]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                <span style={{ color: C.sub }}>{k}</span>
                <span style={{ color: isDisc ? C.green : C.text, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <Divider C={C} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0 0" }}>
              <span className="disp" style={{ fontSize: 16, color: C.text }}>Total</span>
              <span className="disp" style={{ fontSize: 17, color: C.accent }}>₦{total.toLocaleString()}</span>
            </div>
          </div>

          <PaystackCheckout total={total} cart={cart} goTo={goTo} userEmail="john.doe@gmail.com" C={C} />
        </div>
      )}
    </div>
  );
}

// ── WALLET ────────────────────────────────────────────────────
function Wallet({ goTo, C }) {
  const toast = useToast();
  const [action, setAction] = useState(null);
  const [amount, setAmount] = useState("");

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 16px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("profile")} C={C} />
        <div className="disp" style={{ fontSize: 20, color: C.text }}>Wallet</div>
      </div>

      {/* Balance card */}
      <div style={{ margin: "0 20px 18px", background: C.accent, borderRadius: 18, padding: "22px 20px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -28, right: -28, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ position: "absolute", bottom: -22, left: -22, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginBottom: 7, fontWeight: 500 }}>Available Balance</div>
        <div className="disp" style={{ fontSize: 36, color: "#fff", marginBottom: 20 }}>₦24,500</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["topup","+ Top up"],["transfer","↗ Send"],["withdraw","⬇ Withdraw"]].map(([id, l]) => (
            <button key={id} onClick={() => setAction(action === id ? null : id)} style={{ flex: 1, padding: "9px 4px", background: action === id ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.15)", border: `1px solid rgba(255,255,255,.2)`, borderRadius: 10, color: "#fff", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12, transition: "all .18s" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Action panel */}
      {action && (
        <div style={{ margin: "0 20px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, animation: "up .25s ease" }}>
          <div className="disp" style={{ fontSize: 16, color: C.text, marginBottom: 13 }}>{action === "topup" ? "Top up" : action === "transfer" ? "Send money" : "Withdraw"}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 13 }}>
            {[1000, 2000, 5000, 10000].map(a => (
              <button key={a} onClick={() => setAmount(String(a))} style={{ padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${String(amount) === String(a) ? C.accent : C.border}`, background: String(amount) === String(a) ? C.accentBg : "transparent", color: String(amount) === String(a) ? C.accent : C.sub, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>₦{a.toLocaleString()}</button>
            ))}
          </div>
          <Input C={C} placeholder="Custom amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ marginBottom: 13 }} />
          <Btn C={C} block onClick={() => { toast(`${action === "topup" ? "Topped up" : action === "transfer" ? "Sent" : "Withdrawal initiated"} ₦${Number(amount || 0).toLocaleString()}`, "✓", "success"); setAction(null); setAmount(""); }}>Confirm</Btn>
        </div>
      )}

      {/* Transactions */}
      <div style={{ padding: "0 20px" }}>
        <div className="disp" style={{ fontSize: 16, color: C.text, marginBottom: 14 }}>Transactions</div>
        {TXNS.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: t.cr ? C.greenBg : C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{t.label}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{t.date}</div>
            </div>
            <div className="disp" style={{ fontSize: 14, color: t.cr ? C.green : C.accent }}>{t.cr ? "+" : "−"}₦{Math.abs(t.amount).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── REWARDS ───────────────────────────────────────────────────
function Rewards({ goTo, C }) {
  const toast = useToast();
  const pts = 3240;
  const perks = [
    { icon: "🛵", title: "Free Delivery",    pts: 500,  ok: true },
    { icon: "💸", title: "₦1,500 Credit",    pts: 1000, ok: true },
    { icon: "⚡", title: "Priority Shopper", pts: 1500, ok: true },
    { icon: "👑", title: "1 Month Pass",     pts: 3000, ok: true },
    { icon: "💰", title: "₦5,000 Cashback",  pts: 5000, ok: false },
  ];
  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("profile")} C={C} />
        <div className="disp" style={{ fontSize: 20, color: C.text }}>Rewards</div>
      </div>

      {/* Points card */}
      <div style={{ margin: "0 20px 18px", background: C.dark ? "#1a1400" : "#fffbf0", border: `1px solid rgba(245,166,35,.25)`, borderRadius: 18, padding: "20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -14, right: -14, fontSize: 72, opacity: .06 }}>🏆</div>
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Gold Member</div>
        <div className="disp" style={{ fontSize: 40, color: C.text }}>{pts.toLocaleString()}</div>
        <div style={{ color: C.sub, fontSize: 13, marginBottom: 16 }}>Errand Points</div>
        <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 7 }}>
          <div style={{ height: "100%", width: `${(pts / 5000) * 100}%`, background: C.gold, borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.sub, fontSize: 12 }}>Gold</span>
          <span style={{ color: C.sub, fontSize: 12 }}>1,760 pts to Platinum 💎</span>
        </div>
      </div>

      {/* Ways to earn */}
      <div style={{ margin: "0 20px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 11 }}>Ways to earn</div>
        {[["📦","Complete order","+50 pts"],["⭐","Write review","+20 pts"],["👥","Refer friend","+500 pts"],["📅","Daily login","+10 pts"]].map(([e,a,p]) => (
          <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>{e}</span>
            <span style={{ flex: 1, fontSize: 13.5, color: C.text }}>{a}</span>
            <span style={{ color: C.accent, fontWeight: 600, fontSize: 13 }}>{p}</span>
          </div>
        ))}
      </div>

      {/* Redeem */}
      <div style={{ padding: "0 20px" }}>
        <div className="disp" style={{ fontSize: 16, color: C.text, marginBottom: 12 }}>Redeem</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {perks.map(p => (
            <div key={p.title} style={{ display: "flex", alignItems: "center", gap: 13, background: C.card, border: `1px solid ${p.ok ? C.green + "33" : C.border}`, borderRadius: 13, padding: "13px 14px", opacity: p.ok ? 1 : .5 }}>
              <span style={{ fontSize: 26 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{p.title}</div>
                <div style={{ color: C.accent, fontSize: 12, fontWeight: 600, marginTop: 1 }}>{p.pts} pts</div>
              </div>
              {p.ok ? <Btn C={C} sm onClick={() => toast("Reward redeemed!", "🎁", "success")}>Redeem</Btn> : <Tag C={C}>Locked</Tag>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── GROUP BUY ─────────────────────────────────────────────────
function GroupBuy({ goTo, C }) {
  const toast = useToast();
  const [groups, setGroups] = useState([
    { id: 1, name: "Office Lunch",  item: "🥗 Weekly Lunch Bundle", target: 15000, raised: 9500, members: 4, joined: true },
    { id: 2, name: "Grocery Split", item: "🛒 Monthly Haul",         target: 20000, raised: 6000, members: 3, joined: false },
    { id: 3, name: "Birthday Cake", item: "🎂 Custom Cake",          target: 8000,  raised: 3200, members: 2, joined: false },
  ]);
  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("home")} C={C} />
        <div style={{ flex: 1 }}>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>Group Buy</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>Split costs with friends</div>
        </div>
        <Btn C={C} sm onClick={() => toast("Group created!", "👥", "success")}>+ New</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
        {groups.map(g => {
          const pct = Math.round((g.raised / g.target) * 100);
          return (
            <div key={g.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div className="disp" style={{ fontSize: 15, color: C.text }}>{g.name}</div>
                {g.joined && <Tag color="green" C={C}>Joined ✓</Tag>}
              </div>
              <div style={{ color: C.sub, fontSize: 13, marginBottom: 13 }}>{g.item}</div>
              <div style={{ display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 12, marginBottom: 7 }}>
                <span>{g.members} members</span>
                <span>₦{g.raised.toLocaleString()} / ₦{g.target.toLocaleString()}</span>
              </div>
              <div style={{ height: 5, background: C.border, borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: C.accent, borderRadius: 3 }} />
              </div>
              {!g.joined && <Btn C={C} sm block onClick={() => { setGroups(gs => gs.map(x => x.id === g.id ? { ...x, joined: true } : x)); toast("Joined group!", "👥", "success"); }}>Join & Contribute</Btn>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PASS ─────────────────────────────────────────────────────
function Pass({ goTo, C }) {
  const toast = useToast();
  const [plan, setPlan] = useState("quarterly");
  const plans = [
    { id: "monthly",   label: "Monthly",   price: "₦1,999", note: "per month" },
    { id: "quarterly", label: "3 Months",  price: "₦4,999", note: "₦1,666/mo · save ₦998" },
    { id: "annual",    label: "Annual",    price: "₦14,999", note: "₦1,250/mo · best value 🔥" },
  ];
  const perks = ["Free unlimited delivery","Priority shopper (< 2 min)","Flash deal early access","Double loyalty points","₦500 monthly store credit","VIP support"];
  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("profile")} C={C} />
        <div className="disp" style={{ fontSize: 20, color: C.text }}>Errand Pass</div>
        <Tag color="gold" C={C} style={{ marginLeft: "auto" }}>👑 PRO</Tag>
      </div>
      <div style={{ textAlign: "center", padding: "8px 24px 24px" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>👑</div>
        <div className="disp" style={{ fontSize: 22, color: C.text, marginBottom: 8 }}>Shop like royalty</div>
        <div style={{ color: C.sub, fontSize: 14, lineHeight: 1.65 }}>Everything you need for the ultimate shopping experience.</div>
      </div>
      <div style={{ margin: "0 20px 18px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
        {perks.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < perks.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ color: C.green, fontWeight: 700, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 13.5, color: C.text }}>{p}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "0 20px 20px" }}>
        {plans.map(pl => (
          <div key={pl.id} onClick={() => setPlan(pl.id)} style={{ background: C.card, border: `2px solid ${plan === pl.id ? C.accent : C.border}`, borderRadius: 13, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "border-color .18s" }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, border: `2.5px solid ${plan === pl.id ? C.accent : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {plan === pl.id && <div style={{ width: 10, height: 10, borderRadius: 5, background: C.accent }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div className="disp" style={{ fontSize: 14, color: C.text }}>{pl.label}</div>
              <div style={{ color: C.sub, fontSize: 12 }}>{pl.note}</div>
            </div>
            <div className="disp" style={{ fontSize: 15, color: C.text }}>{pl.price}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        <Btn C={C} block onClick={() => toast("Errand Pass activated! 🎉", "👑", "success")} style={{ padding: "14px", marginBottom: 10 }}>Subscribe Now</Btn>
        <div style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>Cancel anytime · No hidden fees</div>
      </div>
    </div>
  );
}

// ── REFERRAL ─────────────────────────────────────────────────
function Referral({ goTo, C }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const code = "ERRAND-JOHN500";
  const refs = [
    { name: "Tunde A.", status: "Order completed ✓", pts: "+500", done: true },
    { name: "Ngozi M.", status: "Signed up, pending order", pts: "Pending", done: false },
    { name: "Aisha K.", status: "Order completed ✓", pts: "+500", done: true },
  ];
  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("profile")} C={C} />
        <div className="disp" style={{ fontSize: 20, color: C.text }}>Refer & Earn</div>
      </div>
      <div style={{ textAlign: "center", padding: "8px 24px 26px" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎁</div>
        <div className="disp" style={{ fontSize: 20, color: C.text, marginBottom: 8 }}>Earn 500 pts per referral</div>
        <div style={{ color: C.sub, fontSize: 14, lineHeight: 1.65 }}>Your friend gets ₦500 off their first order too.</div>
      </div>
      <div style={{ margin: "0 20px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", textAlign: "center" }}>
        <div style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>Your referral code</div>
        <div className="disp" style={{ fontSize: 22, letterSpacing: 2, color: C.accent, marginBottom: 16 }}>{code}</div>
        <Btn C={C} block onClick={() => { setCopied(true); toast("Code copied!", "📋", "success"); setTimeout(() => setCopied(false), 2200); }}>{copied ? "✓ Copied!" : "Copy Code"}</Btn>
      </div>
      <div style={{ display: "flex", gap: 9, padding: "0 20px 20px" }}>
        {[["📱","WhatsApp"],["📧","Email"],["🔗","Link"]].map(([icon, l]) => (
          <button key={l} onClick={() => toast(`Shared via ${l}!`, "📤", "success")} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ color: C.sub, fontSize: 11, fontWeight: 500 }}>{l}</span>
          </button>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        <div className="disp" style={{ fontSize: 15, color: C.text, marginBottom: 12 }}>Your referrals ({refs.length})</div>
        {refs.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `hsl(${i*110+30},45%,38%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14, flexShrink: 0 }}>{r.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{r.name}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{r.status}</div>
            </div>
            <span style={{ fontWeight: 600, color: r.done ? C.green : C.muted, fontSize: 13 }}>{r.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function Notifications({ goTo, C }) {
  const [notifs, setNotifs] = useState([
    { id: 1, icon: "🛵", text: "Your FoodMart order has been delivered!", time: "Just now", unread: true },
    { id: 2, icon: "⚡", text: "Flash deal: Earbuds 52% off — 4 left!", time: "20 min", unread: true },
    { id: 3, icon: "🎁", text: "Referral bonus: +500 pts from Tunde's order", time: "1h", unread: true },
    { id: 4, icon: "💬", text: "Amara: I'm at Oyingbo market now 📦", time: "2h", unread: false },
    { id: 5, icon: "🏆", text: "You've reached Gold membership!", time: "Yesterday", unread: false },
  ]);
  const unread = notifs.filter(n => n.unread).length;
  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("home")} C={C} />
        <div style={{ flex: 1 }}>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>Notifications</div>
          {unread > 0 && <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{unread} unread</div>}
        </div>
        {unread > 0 && <button onClick={() => setNotifs(n => n.map(x => ({ ...x, unread: false })))} style={{ color: C.accent, fontSize: 13, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>Mark all read</button>}
      </div>
      <div style={{ padding: "0 20px" }}>
        {notifs.map(n => (
          <div key={n.id} onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, unread: false } : x))} className="reveal tap" style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: n.unread ? C.accentBg : C.card, border: `1px solid ${n.unread ? C.accentLine : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.unread ? 600 : 400, fontSize: 14, color: C.text, lineHeight: 1.4 }}>{n.text}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{n.time}</div>
            </div>
            {n.unread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, flexShrink: 0, marginTop: 7 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DUAL PROFILE ──────────────────────────────────────────────
function DualProfile({ goTo, C }) {
  const toast = useToast();
  const [view, setView] = useState("hub");
  const [linked, setLinked] = useState({ shopper: false, store: false });
  const [sStep, setSStep] = useState(0);
  const [stStep, setStStep] = useState(0);
  const [sf, setSF] = useState({ bio: "", rate: "", areas: [], specialties: [], bank: "", account: "", idType: "" });
  const [stf, setSTF] = useState({ name: "", category: "", desc: "", phone: "", products: [{ name: "", price: "" }], bank: "", account: "", regType: "" });
  const [loading, setLoading] = useState(false);

  const complete = (type) => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setLinked(l => ({ ...l, [type]: true })); setView("success-" + type); }, 1800);
  };

  // success screen
  if (view.startsWith("success-")) {
    const type = view.split("-")[1];
    return (
      <div className="screen" style={{ background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 28px" }}>
        <div style={{ textAlign: "center", animation: "up .4s ease" }}>
          <div style={{ fontSize: 64, marginBottom: 18 }}>{type === "store" ? "🏪" : "🧑‍💼"}</div>
          <div className="disp" style={{ fontSize: 24, color: C.text, marginBottom: 10 }}>{type === "store" ? "Store Submitted!" : "Application Sent!"}</div>
          <div style={{ color: C.sub, fontSize: 14, lineHeight: 1.7, marginBottom: 30 }}>{type === "store" ? "Your store is under review. You'll hear back within 24h." : "Identity verification takes 2–4 hours on weekdays."}</div>
          <Btn C={C} block onClick={() => setView("hub")} style={{ marginBottom: 11 }}>Back to My Profiles</Btn>
          <Btn C={C} block ghost onClick={() => goTo("profile")}>Return to Profile</Btn>
        </div>
      </div>
    );
  }

  // Chip helper
  const Chips = ({ opts, field, multi, state, setState }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {opts.map(o => {
        const v = o.val || o, sel = multi ? (state[field] || []).includes(v) : state[field] === v;
        return (
          <button key={v} onClick={() => setState(s => ({ ...s, [field]: multi ? (sel ? (s[field]||[]).filter(x => x !== v) : [...(s[field]||[]), v]) : v }))}
            style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${sel ? C.accent : C.border}`, background: sel ? C.accentBg : "transparent", color: sel ? C.accent : C.sub, cursor: "pointer", fontSize: 12.5, fontWeight: 500, fontFamily: "'DM Sans',sans-serif", transition: "all .15s" }}>
            {o.label || o}
          </button>
        );
      })}
    </div>
  );

  // StepBar
  const StepBar = ({ steps, cur }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 20px 22px" }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ width: 28, height: 28, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, transition: "all .3s", background: i < cur ? C.green : i === cur ? C.accent : C.card, border: `2px solid ${i <= cur ? (i < cur ? C.green : C.accent) : C.border}`, color: i <= cur ? "#fff" : C.muted }}>{i < cur ? "✓" : i + 1}</div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < cur ? C.green : C.border, transition: "background .3s" }} />}
        </React.Fragment>
      ))}
    </div>
  );

  // Bottom nav for wizards
  const WizNav = ({ step, maxStep, onBack, onNext, onSubmit, isLast }) => (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "13px 20px env(safe-area-inset-bottom, 22px)", background: C.bg, borderTop: `1px solid ${C.border}`, display: "flex", gap: 9 }}>
      {step > 0 && <Btn C={C} outline onClick={onBack}>‹ Back</Btn>}
      <Btn C={C} block onClick={isLast ? onSubmit : onNext}>
        {loading ? <span style={{ width: 17, height: 17, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} /> : isLast ? "Submit" : "Continue →"}
      </Btn>
    </div>
  );

  // SHOPPER REGISTRATION
  if (view === "shopper-reg") {
    const steps = ["Profile", "Services", "Payout", "Verify"];
    return (
      <div className="screen" style={{ background: C.bg, paddingBottom: 90 }}>
        <div style={{ padding: "52px 20px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <Back onClick={() => setView("hub")} C={C} />
          <div>
            <div className="disp" style={{ fontSize: 18, color: C.text }}>Shopper Registration</div>
            <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>Step {sStep + 1} of {steps.length}</div>
          </div>
        </div>
        <StepBar steps={steps} cur={sStep} />
        <div style={{ padding: "0 20px", animation: "up .28s ease" }}>
          {sStep === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 4 }}>Your profile</div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>Bio <span style={{ color: C.muted }}>(min 20 characters)</span></div>
                <Input C={C} placeholder="Tell customers about yourself, your experience, and what makes you great…" value={sf.bio} onChange={e => setSF(s => ({ ...s, bio: e.target.value }))} rows={4} />
                <div style={{ fontSize: 11, marginTop: 5, color: sf.bio.length < 20 ? C.accent : C.green }}>{sf.bio.length} chars {sf.bio.length >= 20 ? "✓" : "(need 20+)"}</div>
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>Hourly rate (₦)</div>
                <Input C={C} placeholder="e.g. 500" value={sf.rate} onChange={e => setSF(s => ({ ...s, rate: e.target.value }))} />
                <div style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>Platform average: ₦450–₦700/hr</div>
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 9 }}>Response time</div>
                <Chips opts={["< 1 min","< 5 min","< 15 min","< 30 min"]} field="responseTime" multi={false} state={sf} setState={setSF} />
              </div>
            </div>
          )}
          {sStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="disp" style={{ fontSize: 18, color: C.text }}>Your services</div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 9 }}>Specialties</div>
                <Chips opts={["Groceries","Electronics","Fashion","Beauty","Pharmacy","Organic","Home","Sports"]} field="specialties" multi={true} state={sf} setState={setSF} />
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 9 }}>Service areas</div>
                <Chips opts={["Lekki","Victoria Island","Ikoyi","Lagos Island","Ikeja","Yaba","Surulere","Ajah","Gbagada","Ojodu"]} field="areas" multi={true} state={sf} setState={setSF} />
              </div>
            </div>
          )}
          {sStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div className="disp" style={{ fontSize: 18, color: C.text }}>Payout setup</div>
                <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>Earnings are paid every Friday.</div>
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 9 }}>Select bank</div>
                <Chips opts={["GTBank","Access","Zenith","First Bank","UBA","Opay","Kuda"]} field="bank" multi={false} state={sf} setState={setSF} />
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>Account number</div>
                <Input C={C} placeholder="10-digit account number" value={sf.account} onChange={e => setSF(s => ({ ...s, account: e.target.value.replace(/\D/g,"").slice(0,10) }))} />
              </div>
            </div>
          )}
          {sStep === 3 && (
            <ShopperVerification onBack={() => setSStep(2)} onDone={() => complete("shopper")} C={C} />
          )}
        </div>
        {sStep < 3 && <WizNav step={sStep} maxStep={3} onBack={() => setSStep(s => s - 1)} onNext={() => setSStep(s => s + 1)} onSubmit={() => complete("shopper")} isLast={false} />}
      </div>
    );
  }

  // STORE REGISTRATION
  if (view === "store-reg") {
    const steps = ["Store Info", "Products", "Payout", "Legal"];
    const addProduct = () => setSTF(f => ({ ...f, products: [...f.products, { name: "", price: "" }] }));
    const upProduct = (i, k, v) => setSTF(f => ({ ...f, products: f.products.map((p, j) => j === i ? { ...p, [k]: v } : p) }));
    return (
      <div className="screen" style={{ background: C.bg, paddingBottom: 90 }}>
        <div style={{ padding: "52px 20px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <Back onClick={() => setView("hub")} C={C} />
          <div>
            <div className="disp" style={{ fontSize: 18, color: C.text }}>Store Registration</div>
            <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>Step {stStep + 1} of {steps.length}</div>
          </div>
        </div>
        <StepBar steps={steps} cur={stStep} />
        <div style={{ padding: "0 20px", animation: "up .28s ease" }}>
          {stStep === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 4 }}>Store details</div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>Store name</div>
                <Input C={C} placeholder="e.g. FreshMart Lagos" value={stf.name} onChange={e => setSTF(s => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 9 }}>Category</div>
                <Chips opts={["Groceries","Beauty","Electronics","Fashion","Organic","Home","Pharmacy","Food"]} field="category" multi={false} state={stf} setState={setSTF} />
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>Description</div>
                <Input C={C} placeholder="Describe your store, products, and quality promise…" value={stf.desc} onChange={e => setSTF(s => ({ ...s, desc: e.target.value }))} rows={3} />
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>Business phone</div>
                <Input C={C} placeholder="+234 800 000 0000" value={stf.phone} onChange={e => setSTF(s => ({ ...s, phone: e.target.value }))} />
              </div>
            </div>
          )}
          {stStep === 1 && (
            <div>
              <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 16 }}>Your products</div>
              {stf.products.map((p, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "13px 14px", marginBottom: 9 }}>
                  <div style={{ color: C.sub, fontSize: 11, marginBottom: 7 }}>Product {i + 1}</div>
                  <Input C={C} placeholder="Product name" value={p.name} onChange={e => upProduct(i, "name", e.target.value)} style={{ marginBottom: 9 }} />
                  <Input C={C} placeholder="Price (₦)" value={p.price} onChange={e => upProduct(i, "price", e.target.value.replace(/\D/g, ""))} />
                </div>
              ))}
              <button onClick={addProduct} style={{ width: "100%", padding: "12px", background: C.card, border: `1.5px dashed ${C.border}`, borderRadius: 12, color: C.sub, cursor: "pointer", fontSize: 13.5, fontFamily: "'DM Sans',sans-serif" }}>+ Add another product</button>
            </div>
          )}
          {stStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div className="disp" style={{ fontSize: 18, color: C.text }}>Payout setup</div>
                <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>You keep 90% of every sale. Paid daily at 11pm.</div>
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 9 }}>Select bank</div>
                <Chips opts={["GTBank","Access","Zenith","First Bank","UBA","Opay","Kuda"]} field="bank" multi={false} state={stf} setState={setSTF} />
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>Account number</div>
                <Input C={C} placeholder="10-digit account number" value={stf.account} onChange={e => setSTF(s => ({ ...s, account: e.target.value.replace(/\D/g,"").slice(0,10) }))} />
              </div>
              <div>
                <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>Account name</div>
                <Input C={C} placeholder="Full account name" value={stf.accountName || ""} onChange={e => setSTF(s => ({ ...s, accountName: e.target.value }))} />
              </div>
            </div>
          )}
          {stStep === 3 && (
            <StoreVerification onBack={() => setStStep(2)} onDone={() => complete("store")} C={C} />
          )}
        </div>
        {stStep < 3 && <WizNav step={stStep} maxStep={3} onBack={() => setStStep(s => s - 1)} onNext={() => setStStep(s => s + 1)} onSubmit={() => complete("store")} isLast={false} />}
      </div>
    );
  }

  // HUB VIEW
  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("profile")} C={C} />
        <div>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>My Profiles</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>All your Errand identities</div>
        </div>
      </div>

      {/* User card */}
      <div style={{ margin: "0 20px 18px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 15, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>😊</div>
          <div>
            <div className="disp" style={{ fontSize: 16, color: C.text }}>John Doe</div>
            <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>@johndoe · Gold 🏆 · Lagos</div>
          </div>
        </div>
        <div style={{ display: "flex", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          {[["Orders","34"],["Points","3,240"],["Rating","4.9★"]].map(([l, v]) => (
            <div key={l} style={{ flex: 1, textAlign: "center" }}>
              <div className="disp" style={{ fontSize: 18, color: C.text }}>{v}</div>
              <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 13 }}>EARN ON ERRAND</div>

        {[
          { type: "shopper", icon: "🧑‍💼", title: "Personal Shopper", sub: "Earn ₦500–₦1,500/hr helping people shop", perks: ["Set your own hours & rate", "Build your client base", "Weekly payouts every Friday"] },
          { type: "store",   icon: "🏪",   title: "Store Owner",     sub: "List products, reach thousands of shoppers", perks: ["Integrated payment system", "Real-time order management", "Keep 90% of every sale"] },
        ].map(prof => (
          <div key={prof.type} style={{ background: C.card, border: `1px solid ${linked[prof.type] ? C.green + "44" : C.border}`, borderRadius: 16, marginBottom: 13, overflow: "hidden" }}>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{prof.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                    <div className="disp" style={{ fontSize: 15, color: C.text }}>{prof.title}</div>
                    {linked[prof.type] && <Tag color="green" C={C}>Active ✓</Tag>}
                  </div>
                  <div style={{ color: C.sub, fontSize: 13 }}>{prof.sub}</div>
                </div>
              </div>
              {!linked[prof.type] && prof.perks.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 13, color: C.sub }}>
                  <span style={{ color: C.green, flexShrink: 0 }}>✓</span>{p}
                </div>
              ))}
              {linked[prof.type] && (
                <div style={{ display: "flex" }}>
                  {[["Errands","0"],["Rating","—"],["Earned","₦0"]].map(([l,v]) => (
                    <div key={l} style={{ flex: 1, textAlign: "center" }}>
                      <div className="disp" style={{ fontSize: 17, color: C.text }}>{v}</div>
                      <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              {linked[prof.type]
                ? <Btn C={C} sm block onClick={() => toast("Dashboard coming soon!", "🔧")}>Open Dashboard →</Btn>
                : <Btn C={C} block onClick={() => { setView(prof.type === "shopper" ? "shopper-reg" : "store-reg"); setSStep(0); setStStep(0); }}>Register as {prof.title} →</Btn>
              }
            </div>
          </div>
        ))}

        <div style={{ background: C.goldBg, border: `1px solid rgba(245,166,35,.2)`, borderRadius: 13, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.55 }}>You can be a customer, shopper, <em>and</em> store owner all from one account.</div>
        </div>
      </div>
    </div>
  );
}

// ── PROFILE ───────────────────────────────────────────────────
function Profile({ goTo, C, dark, toggleDark }) {
  const toast = useToast();
  const [showDP, setShowDP] = useState(false);

  if (showDP) return <DualProfile goTo={goTo} C={C} />;

  const menu = [
    { section: "Shopping", items: [{ icon: "📦", label: "My Orders", go: "orders" }, { icon: "❤️", label: "Saved Stores" }, { icon: "🔔", label: "Notifications", go: "notifications" }] },
    { section: "Finance",  items: [{ icon: "💰", label: "Wallet", go: "wallet" }, { icon: "🏆", label: "Rewards", go: "rewards" }, { icon: "💳", label: "Payment Methods" }] },
    { section: "Discover", items: [{ icon: "👑", label: "Errand Pass", go: "pass" }, { icon: "👥", label: "Group Buy", go: "groupbuy" }, { icon: "🎁", label: "Refer & Earn", go: "referral" }] },
    { section: "Account",  items: [{ icon: "⚙️", label: "Settings", go: "settings" }, { icon: "❓", label: "Help & Support", go: "help" }, { icon: "🛡️", label: "Verification Queue", go: "verify-queue" }] },
  ];

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ padding: "52px 20px 22px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 72, height: 72, background: C.accent, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 14px", boxShadow: `0 4px 22px ${C.accent}44` }}>😊</div>
        <div className="disp" style={{ fontSize: 20, color: C.text }}>John Doe</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>@johndoe · Lagos, NG</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 11, background: C.goldBg, border: `1px solid rgba(245,166,35,.22)`, borderRadius: 20, padding: "5px 14px" }}>
          <span>🏆</span><span style={{ fontWeight: 600, fontSize: 13, color: C.gold }}>Gold · 3,240 pts</span>
        </div>
        <div style={{ display: "flex", paddingTop: 18, marginTop: 4 }}>
          {[["Orders","34"],["Saved","12"],["Referrals","3"],["Rating","4.9★"]].map(([l,v]) => (
            <div key={l} onClick={() => l === "Orders" ? goTo("orders") : null} style={{ flex: 1, textAlign: "center", cursor: l === "Orders" ? "pointer" : "default" }}>
              <div className="disp" style={{ fontSize: 17, color: C.text }}>{v}</div>
              <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Earn banner */}
      <div onClick={() => setShowDP(true)} style={{ margin: "14px 20px", background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{ display: "flex" }}>
          {["🧑‍💼","🏪"].map((e, i) => <div key={i} style={{ width: 36, height: 36, borderRadius: 11, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginLeft: i > 0 ? -8 : 0 }}>{e}</div>)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Earn on Errand</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 1 }}>Register as shopper or store owner</div>
        </div>
        <span style={{ color: C.accent, fontSize: 16 }}>›</span>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Dark mode */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 18 }}>{dark ? "🌙" : "☀️"}</span>
          <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: C.text }}>{dark ? "Dark Mode" : "Light Mode"}</span>
          <ToggleSwitch on={dark} onChange={toggleDark} C={C} />
        </div>

        {/* Menu */}
        {menu.map((sec, si) => (
          <div key={si} style={{ marginBottom: 18 }}>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{sec.section}</div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
              {sec.items.map((item, ii) => (
                <div key={ii} onClick={() => item.go ? goTo(item.go) : toast(`${item.label} coming soon`, "🔧")} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", borderBottom: ii < sec.items.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{item.icon}</span>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: C.text }}>{item.label}</span>
                  <span style={{ color: C.muted, fontSize: 16 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button style={{ width: "100%", padding: "13px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 13, color: "#EF4444", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14.5, marginBottom: 24 }}>Sign out</button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
//  NEW SCREENS: Onboarding · Order History · Settings · Help
// ─────────────────────────────────────────────────────────────

// ── ONBOARDING ───────────────────────────────────────────────
function Onboarding({ onDone, C }) {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState("");
  const [prefs, setPrefs] = useState([]);
  const [detecting, setDetecting] = useState(false);

  const SLIDES = [
    { emoji: "🛍️", title: "Welcome to Errand", sub: "Your personal market, delivered to your door anywhere in Lagos.", cta: "Get Started" },
    { emoji: "🧑‍💼", title: "Personal Shoppers", sub: "Real humans shop for you. Chat live, negotiate prices, track every step.", cta: "Sounds great" },
    { emoji: "⚡", title: "Flash Deals Daily", sub: "Up to 60% off on groceries, beauty, electronics & more — every single day.", cta: "Show me deals" },
    { emoji: "📍", title: "Set your location", sub: "We'll find the closest stores and shoppers to you.", cta: null, isLocation: true },
    { emoji: "🎯", title: "What do you shop for?", sub: "Pick your categories so we can personalise your feed.", cta: null, isPrefs: true },
  ];

  const CATS = ["🛒 Groceries","💄 Beauty","📱 Electronics","🌿 Organic","🏠 Home","⚽ Sports","👗 Fashion","💊 Pharmacy"];
  const AREAS = ["Victoria Island","Lekki","Ikoyi","Lagos Island","Ikeja","Yaba","Surulere","Ajah","Gbagada","Oniru"];

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const canNext = slide.isLocation ? location.trim().length > 0 : slide.isPrefs ? prefs.length > 0 : true;

  const detect = () => {
    setDetecting(true);
    setTimeout(() => { setLocation("Victoria Island, Lagos"); setDetecting(false); }, 1600);
  };

  const togglePref = (p) => setPrefs(ps => ps.includes(p) ? ps.filter(x => x !== p) : [...ps, p]);

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, display: "flex", flexDirection: "column" }}>
      {/* Progress dots */}
      <div style={{ padding: "52px 24px 0", display: "flex", justifyContent: "center", gap: 6 }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{ height: 4, borderRadius: 2, background: i <= step ? C.accent : C.border, width: i === step ? 22 : 8, transition: "all .25s ease" }} />
        ))}
      </div>

      {/* Slide content */}
      <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px", animation: "up .28s ease" }}>
        <div style={{ fontSize: 72, marginBottom: 28, filter: "drop-shadow(0 4px 16px rgba(0,0,0,.15))" }}>{slide.emoji}</div>
        <div className="disp" style={{ fontSize: 26, color: C.text, textAlign: "center", marginBottom: 12, lineHeight: 1.25 }}>{slide.title}</div>
        <div style={{ color: C.sub, fontSize: 15, textAlign: "center", lineHeight: 1.65, maxWidth: 320 }}>{slide.sub}</div>

        {/* Location step */}
        {slide.isLocation && (
          <div style={{ width: "100%", maxWidth: 360, marginTop: 32, display: "flex", flexDirection: "column", gap: 11 }}>
            <div style={{ position: "relative" }}>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Enter your area (e.g. Lekki Phase 1)"
                style={{ width: "100%", background: C.card, border: `1.5px solid ${location ? C.accent : C.border}`, borderRadius: 13, padding: "13px 46px 13px 44px", color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif" }}
              />
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>📍</span>
              {location && <span onClick={() => setLocation("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: C.muted, cursor: "pointer", fontSize: 18 }}>×</span>}
            </div>
            <button onClick={detect} disabled={detecting} style={{ width: "100%", padding: "12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, color: detecting ? C.muted : C.accent, fontWeight: 600, fontSize: 14, cursor: detecting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'DM Sans',sans-serif" }}>
              {detecting ? <><span style={{ width: 14, height: 14, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />Detecting…</> : "📡 Use my current location"}
            </button>
            {AREAS.slice(0,6).map(a => (
              <div key={a} onClick={() => setLocation(a + ", Lagos")} style={{ padding: "10px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, cursor: "pointer", fontSize: 13.5, color: C.sub }}>📍 {a}</div>
            ))}
          </div>
        )}

        {/* Preferences step */}
        {slide.isPrefs && (
          <div style={{ width: "100%", maxWidth: 360, marginTop: 32, display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center" }}>
            {CATS.map(c => {
              const sel = prefs.includes(c);
              return (
                <button key={c} onClick={() => togglePref(c)} style={{ padding: "10px 16px", borderRadius: 22, border: `1.5px solid ${sel ? C.accent : C.border}`, background: sel ? C.accentBg : C.card, color: sel ? C.accent : C.sub, fontWeight: sel ? 600 : 400, fontSize: 14, cursor: "pointer", transition: "all .15s", fontFamily: "'DM Sans',sans-serif" }}>{c}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA footer */}
      <div style={{ padding: "16px 28px 44px", display: "flex", flexDirection: "column", gap: 11 }}>
        {slide.cta && (
          <button onClick={() => setStep(s => s + 1)} className="btn-ripple" style={{ width: "100%", padding: "15px", background: C.accent, border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: `0 4px 18px ${C.accent}44` }}>{slide.cta} →</button>
        )}
        {(slide.isLocation || slide.isPrefs) && (
          <button onClick={() => { if (isLast) onDone(); else setStep(s => s + 1); }} disabled={!canNext} className="btn-ripple" style={{ width: "100%", padding: "15px", background: canNext ? C.accent : C.border, border: "none", borderRadius: 14, color: canNext ? "#fff" : C.muted, fontWeight: 700, fontSize: 16, cursor: canNext ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", transition: "background .2s", boxShadow: canNext ? `0 4px 18px ${C.accent}44` : "none" }}>
            {isLast ? "Start shopping 🎉" : "Continue →"}
          </button>
        )}
        {step > 0 && !isLast && (
          <button onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>
        )}
        {step === 0 && (
          <button onClick={onDone} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Skip for now</button>
        )}
      </div>
    </div>
  );
}

// ── ORDER HISTORY ─────────────────────────────────────────────
const ORDER_HISTORY = [
  { id: "ERR-0893", store: "FoodMart",  emoji: "🛒", date: "Today, 2:30 PM",   status: "delivered", total: 6200,  items: ["Fresh Tomatoes 1kg","Basmati Rice 5kg","Free-range Eggs ×12"], rating: null },
  { id: "ERR-0871", store: "GlowStore", emoji: "💄", date: "Feb 20, 4:15 PM",  status: "delivered", total: 9900,  items: ["Vitamin C Serum","Matte Lipstick Set"], rating: 5 },
  { id: "ERR-0854", store: "TechHub",   emoji: "📱", date: "Feb 17, 11:00 AM", status: "delivered", total: 26000, items: ["Wireless Earbuds","USB-C Fast Charger"], rating: 4 },
  { id: "ERR-0812", store: "FoodMart",  emoji: "🛒", date: "Feb 12, 6:20 PM",  status: "cancelled", total: 4800,  items: ["Chicken Breast 1kg","Basmati Rice 5kg"], rating: null },
  { id: "ERR-0790", store: "HomeNest",  emoji: "🛋️", date: "Feb 8, 1:45 PM",   status: "delivered", total: 11300, items: ["Throw Pillows ×2","Desk Lamp LED"], rating: 4 },
];

function OrderHistory({ goTo, addToCart, C }) {
  const toast = useToast();
  const revealRef = useScrollReveal();
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [rating, setRating] = useState({});
  const [ratingDone, setRatingDone] = useState({});

  const filtered = filter === "all" ? ORDER_HISTORY : ORDER_HISTORY.filter(o => o.status === filter);

  const statusColor = s => s === "delivered" ? C.green : s === "cancelled" ? "#EF4444" : C.accent;
  const statusBg    = s => s === "delivered" ? C.greenBg : s === "cancelled" ? "rgba(239,68,68,.1)" : C.accentBg;
  const statusLabel = s => s === "delivered" ? "Delivered ✓" : s === "cancelled" ? "Cancelled" : "In progress";

  const reorder = (order) => {
    order.items.forEach((name, i) => addToCart({ id: 700 + i, name, price: Math.round(order.total / order.items.length), emoji: order.emoji }));
    toast(`${order.items.length} items added to cart`, "🛒", "success");
    goTo("cart");
  };

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 86 }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 16px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("profile")} C={C} />
        <div>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>My Orders</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{ORDER_HISTORY.length} orders total</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="hrow" style={{ padding: "0 20px 16px" }}>
        {[["all","All"],["delivered","Delivered"],["cancelled","Cancelled"]].map(([id,l]) => (
          <button key={id} onClick={() => setFilter(id)} style={{ padding: "7px 18px", borderRadius: 20, border: "none", whiteSpace: "nowrap", fontWeight: 500, fontSize: 13, cursor: "pointer", background: filter === id ? C.accent : C.card, color: filter === id ? "#fff" : C.sub, flexShrink: 0, transition: "all .15s", fontFamily: "'DM Sans',sans-serif" }}>{l}</button>
        ))}
      </div>

      {/* Order list */}
      <div style={{ padding: "0 20px" }} ref={revealRef}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📦</div>
            <div style={{ color: C.text, fontWeight: 500, marginBottom: 6 }}>No orders here</div>
            <div style={{ color: C.sub, fontSize: 13 }}>Your {filter} orders will show up here</div>
          </div>
        )}

        {filtered.map((order, idx) => {
          const open = expanded === order.id;
          return (
            <div key={order.id} className="reveal" style={{ marginBottom: 11, transitionDelay: `${idx * 40}ms` }}>
              <div style={{ background: C.card, border: `1px solid ${open ? C.accentLine : C.border}`, borderRadius: 16, overflow: "hidden", transition: "border-color .2s" }}>
                {/* Order header */}
                <div onClick={() => setExpanded(open ? null : order.id)} style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{order.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <div className="disp" style={{ fontSize: 14.5, color: C.text }}>{order.store}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: statusBg(order.status), color: statusColor(order.status) }}>{statusLabel(order.status)}</div>
                    </div>
                    <div style={{ color: C.muted, fontSize: 11.5 }}>{order.id} · {order.date}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="disp" style={{ fontSize: 15, color: C.text }}>₦{order.total.toLocaleString()}</div>
                    <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{order.items.length} items</div>
                  </div>
                  <span style={{ color: C.muted, fontSize: 16, marginLeft: 4, transition: "transform .2s", transform: open ? "rotate(90deg)" : "" }}>›</span>
                </div>

                {/* Expanded detail */}
                {open && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px", animation: "up .2s ease" }}>
                    {/* Items list */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, letterSpacing: ".5px", marginBottom: 8 }}>ITEMS</div>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < order.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <span style={{ fontSize: 18 }}>{order.emoji}</span>
                          <span style={{ flex: 1, fontSize: 13.5, color: C.text }}>{item}</span>
                          <span style={{ color: C.sub, fontSize: 12 }}>₦{Math.round(order.total / order.items.length).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Rating */}
                    {order.status === "delivered" && !ratingDone[order.id] && (
                      <div style={{ marginBottom: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 9 }}>{order.rating ? "Your rating" : "Rate this order"}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} onClick={() => setRating(r => ({ ...r, [order.id]: s }))}
                              style={{ fontSize: 26, cursor: "pointer", filter: s <= (rating[order.id] || order.rating || 0) ? "none" : "grayscale(1)", transition: "filter .15s, transform .1s", transform: s === (rating[order.id] || order.rating) ? "scale(1.2)" : "" }}>⭐</span>
                          ))}
                          {(rating[order.id] || order.rating) > 0 && !order.rating && (
                            <button onClick={() => { setRatingDone(r => ({ ...r, [order.id]: true })); toast("Thanks for your rating!", "⭐", "success"); }}
                              style={{ marginLeft: "auto", padding: "5px 13px", background: C.accent, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Submit</button>
                          )}
                        </div>
                      </div>
                    )}
                    {ratingDone[order.id] && <div style={{ color: C.green, fontSize: 13, marginBottom: 14, fontWeight: 500 }}>✓ Rating submitted — thanks!</div>}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 9 }}>
                      {order.status === "delivered" && (
                        <button onClick={() => reorder(order)} className="btn-ripple" style={{ flex: 1, padding: "10px", background: C.accent, border: "none", borderRadius: 11, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>🔁 Reorder</button>
                      )}
                      <button onClick={() => goTo("tracking")} className="btn-ripple" style={{ flex: 1, padding: "10px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, color: C.text, fontWeight: 500, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        {order.status === "delivered" ? "📄 Receipt" : "📍 Track"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SETTINGS ─────────────────────────────────────────────────
// ── SignOutButton (uses Supabase auth) ───────────────────────
function SignOutButton({ C }) {
  const { signOut } = useAuth() || {};
  return (
    <button onClick={() => signOut?.()} style={{ width: "100%", padding: "13px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 13, color: "#EF4444", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14.5, marginBottom: 8 }}>Sign out</button>
  );
}


function Settings({ goTo, dark, toggleDark, C }) {
  const toast = useToast();
  const [notifs, setNotifs] = useState({ orders: true, deals: true, promos: false, shopper: true, system: true });
  const [privacy, setPrivacy] = useState({ location: true, analytics: false, personalised: true });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@gmail.com");
  const [phone, setPhone] = useState("+234 810 000 0000");

  const TogRow = ({ label, sub, val, onToggle }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{label}</div>
        {sub && <div style={{ color: C.muted, fontSize: 11.5, marginTop: 2 }}>{sub}</div>}
      </div>
      <ToggleSwitch on={val} onChange={onToggle} C={C} />
    </div>
  );

  const PAYMENT_METHODS = [
    { icon: "💳", name: "GTBank Debit ····4521", sub: "Expires 09/27", default: true },
    { icon: "🏦", name: "Access Bank ····9033", sub: "Linked account", default: false },
    { icon: "💰", name: "Errand Wallet", sub: "₦24,500 balance", default: false },
  ];

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 86 }}>
      <div style={{ padding: "52px 20px 16px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("profile")} C={C} />
        <div className="disp" style={{ fontSize: 20, color: C.text }}>Settings</div>
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Account info */}
        <div>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 9 }}>Account</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            {editing ? (
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Full name", name, setName],["Email", email, setEmail],["Phone", phone, setPhone]].map(([label, val, setter]) => (
                  <div key={label}>
                    <div style={{ color: C.sub, fontSize: 11, marginBottom: 5 }}>{label}</div>
                    <input value={val} onChange={e => setter(e.target.value)} style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                      onFocus={e => e.target.style.borderColor = C.accent}
                      onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 9, marginTop: 4 }}>
                  <button onClick={() => { setEditing(false); toast("Profile updated", "✓", "success"); }} style={{ flex: 1, padding: "10px", background: C.accent, border: "none", borderRadius: 10, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Save changes</button>
                  <button onClick={() => setEditing(false)} style={{ padding: "10px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 52, height: 52, background: C.accent, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>😊</div>
                  <div style={{ flex: 1 }}>
                    <div className="disp" style={{ fontSize: 15, color: C.text }}>{name}</div>
                    <div style={{ color: C.sub, fontSize: 12.5, marginTop: 2 }}>{email}</div>
                    <div style={{ color: C.sub, fontSize: 12.5 }}>{phone}</div>
                  </div>
                  <button onClick={() => setEditing(true)} style={{ padding: "6px 14px", background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 9, color: C.accent, fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Edit</button>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  {[["🔒","Change password"],["📍","Delivery addresses"],["🗑️","Delete account"]].map(([icon, label], i, arr) => (
                    <div key={label} onClick={() => toast(`${label} coming soon`, "🔧")} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
                      <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{icon}</span>
                      <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: label.includes("Delete") ? "#EF4444" : C.text }}>{label}</span>
                      <span style={{ color: C.muted }}>›</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 9 }}>Notifications</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <TogRow label="Order updates"   sub="Delivery, tracking, confirmations"     val={notifs.orders}   onToggle={() => setNotifs(n => ({...n, orders: !n.orders}))} />
            <TogRow label="Flash deals"     sub="Limited-time offers from your stores"  val={notifs.deals}    onToggle={() => setNotifs(n => ({...n, deals: !n.deals}))} />
            <TogRow label="Promotions"      sub="Vouchers, cashback, campaigns"          val={notifs.promos}   onToggle={() => setNotifs(n => ({...n, promos: !n.promos}))} />
            <TogRow label="Shopper messages" sub="Chat notifications from your shoppers" val={notifs.shopper}  onToggle={() => setNotifs(n => ({...n, shopper: !n.shopper}))} />
            <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>System alerts</div>
                <div style={{ color: C.muted, fontSize: 11.5, marginTop: 2 }}>App updates, security notices</div>
              </div>
              <ToggleSwitch on={notifs.system} onChange={() => setNotifs(n => ({...n, system: !n.system}))} C={C} />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 9 }}>Appearance</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{dark ? "🌙" : "☀️"}</span>
              <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: C.text }}>Dark Mode</span>
              <ToggleSwitch on={dark} onChange={toggleDark} C={C} />
            </div>
            {["System font size","Language","Currency"].map((label, i, arr) => (
              <div key={label} onClick={() => toast(`${label} coming soon`, "🔧")} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{["🔡","🌐","💱"][i]}</span>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: C.text }}>{label}</span>
                <span style={{ color: C.sub, fontSize: 13, marginRight: 6 }}>{["Default","English","₦ NGN"][i]}</span>
                <span style={{ color: C.muted }}>›</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 9 }}>Payment Methods</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            {PAYMENT_METHODS.map((pm, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", borderBottom: i < PAYMENT_METHODS.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{pm.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{pm.name}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{pm.sub}</div>
                </div>
                {pm.default ? <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: C.greenBg, color: C.green }}>Default</span> : <span onClick={() => toast("Set as default", "✓", "success")} style={{ color: C.sub, fontSize: 12, cursor: "pointer" }}>Set default</span>}
              </div>
            ))}
            <div onClick={() => toast("Add payment method coming soon", "💳")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }}>
              <span style={{ fontSize: 20, color: C.accent }}>＋</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.accent }}>Add new payment method</span>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 9 }}>Privacy</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            <TogRow label="Location access"     sub="Required for delivery matching"        val={privacy.location}     onToggle={() => setPrivacy(p => ({...p, location: !p.location}))} />
            <TogRow label="Analytics"           sub="Help us improve the app (anonymous)"   val={privacy.analytics}    onToggle={() => setPrivacy(p => ({...p, analytics: !p.analytics}))} />
            <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>Personalised ads</div>
                <div style={{ color: C.muted, fontSize: 11.5, marginTop: 2 }}>Relevant deals based on shopping history</div>
              </div>
              <ToggleSwitch on={privacy.personalised} onChange={() => setPrivacy(p => ({...p, personalised: !p.personalised}))} C={C} />
            </div>
          </div>
        </div>

        <SignOutButton C={C} />
        <div style={{ textAlign: "center", color: C.muted, fontSize: 11, paddingBottom: 8 }}>Errand v2.4.1 · Made with ❤️ in Lagos</div>
      </div>
    </div>
  );
}

// ── HELP & SUPPORT ────────────────────────────────────────────
const FAQS = [
  { q: "How do I track my order?", a: "Go to the Tracking screen from Home or your order history. You'll see live updates from your shopper including real-time map location." },
  { q: "Can I cancel an order?", a: "You can cancel within 5 minutes of placing an order. After that, contact your shopper directly via chat to arrange a cancellation." },
  { q: "How are shoppers vetted?", a: "All shoppers go through identity verification, background checks, and a test errand before being listed. They're rated after every order." },
  { q: "What's the delivery fee?", a: "Delivery fees start from ₦500 and depend on distance. Errand Pass members get free unlimited delivery." },
  { q: "How do I get a refund?", a: "Refunds for wrong or missing items are processed automatically within 24 hours. For other issues, raise a support ticket." },
  { q: "What areas do you cover?", a: "We currently cover all major areas in Lagos including VI, Lekki, Ikoyi, Ikeja, Yaba, Surulere, Ajah, and more." },
  { q: "How do loyalty points work?", a: "Earn 50 pts per order, 20 pts per review, 500 pts per referral. Redeem for free delivery, credits, and more from the Rewards screen." },
];

function HelpSupport({ goTo, C }) {
  const toast = useToast();
  const [openFaq, setOpenFaq] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketType, setTicketType] = useState("");
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketSent, setTicketSent] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([
    { from: "s", text: "Hi John! 👋 I'm Tobi from Errand Support. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs, chatOpen]);

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput; setChatInput(""); setChatLoading(true);
    setChatMsgs(m => [...m, { from: "me", text: msg }]);
    try {
      const reply = await askClaude(
        APP_CONTEXT + "\nYou are Tobi, a friendly Errand customer support agent in Lagos. Help users with their issues concisely (2-3 sentences). Be warm, use the user's name (John), and offer concrete next steps.",
        msg
      );
      setChatMsgs(m => [...m, { from: "s", text: reply }]);
    } catch {
      setChatMsgs(m => [...m, { from: "s", text: "Sorry, I'm having trouble connecting. Please try again or raise a ticket! 🙏" }]);
    }
    setChatLoading(false);
  };

  const TICKET_TYPES = ["Wrong item delivered","Missing item","Damaged item","Shopper issue","Payment problem","App bug","Other"];

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 86 }}>
      <div style={{ padding: "52px 20px 16px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("profile")} C={C} />
        <div>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>Help & Support</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>We're here for you</div>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Contact options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          {[
            { icon: "💬", label: "Live Chat", sub: "~2 min response", color: C.accent, action: () => setChatOpen(true) },
            { icon: "🎫", label: "Raise Ticket", sub: "24h response",   color: C.green,  action: () => setTicketOpen(true) },
            { icon: "📞", label: "Call Us",     sub: "Mon–Fri 8am–8pm", color: C.gold,   action: () => toast("Calling 0800-ERRAND", "📞") },
            { icon: "📧", label: "Email",       sub: "support@errand.ng",color: "#8B5CF6",action: () => toast("Email copied!", "📧") },
          ].map(opt => (
            <div key={opt.label} onClick={opt.action} className="tap" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 14px", cursor: "pointer", transition: "border-color .15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = opt.color + "55"}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: opt.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 9 }}>{opt.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 2 }}>{opt.label}</div>
              <div style={{ color: C.muted, fontSize: 11.5 }}>{opt.sub}</div>
            </div>
          ))}
        </div>

        {/* Order help quick links */}
        <div style={{ background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 13, padding: "13px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => goTo("orders")}>
          <span style={{ fontSize: 22 }}>📦</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: C.text }}>Issue with a recent order?</div>
            <div style={{ color: C.sub, fontSize: 12, marginTop: 1 }}>View your orders and request help</div>
          </div>
          <span style={{ color: C.accent }}>›</span>
        </div>

        {/* FAQ */}
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 11 }}>FREQUENTLY ASKED</div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 22 }}>
          {FAQS.map((faq, i) => {
            const open = openFaq === i;
            return (
              <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div onClick={() => setOpenFaq(open ? null : i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: C.text, lineHeight: 1.4 }}>{faq.q}</span>
                  <span style={{ color: C.muted, fontSize: 18, transition: "transform .2s", transform: open ? "rotate(90deg)" : "", flexShrink: 0 }}>›</span>
                </div>
                {open && (
                  <div style={{ padding: "0 16px 14px", color: C.sub, fontSize: 13.5, lineHeight: 1.65, animation: "up .18s ease" }}>{faq.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Chat Sheet */}
      <Sheet open={chatOpen} onClose={() => setChatOpen(false)} C={C} title="Live Chat — Support">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 0 14px", borderBottom: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎧</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Tobi — Support Agent</div>
            <div style={{ color: C.green, fontSize: 11.5 }}>● Online · Typically replies in 2 min</div>
          </div>
        </div>
        <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", background: m.from === "me" ? C.accent : C.card, color: m.from === "me" ? "#fff" : C.text, borderRadius: 13, padding: "9px 13px", fontSize: 13.5, maxWidth: "85%", border: m.from !== "me" ? `1px solid ${C.border}` : "none", lineHeight: 1.5 }}>{m.text}</div>
          ))}
          {chatLoading && (
            <div style={{ alignSelf: "flex-start", display: "flex", gap: 4, padding: "9px 13px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.muted, animation: `blink 1.2s ${i*.2}s ease-in-out infinite` }} />)}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
            placeholder="Type your message…"
            style={{ flex: 1, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13.5, outline: "none", fontFamily: "'DM Sans',sans-serif" }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border} />
          <button onClick={sendChat} style={{ width: 38, height: 38, borderRadius: 10, background: chatInput.trim() ? C.accent : C.border, border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>→</button>
        </div>
      </Sheet>

      {/* Raise Ticket Sheet */}
      <Sheet open={ticketOpen} onClose={() => { setTicketOpen(false); setTicketSent(false); setTicketMsg(""); setTicketType(""); }} C={C} title="Raise a Ticket">
        {!ticketSent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div>
              <div style={{ color: C.sub, fontSize: 12, marginBottom: 9 }}>Issue type</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {TICKET_TYPES.map(t => (
                  <button key={t} onClick={() => setTicketType(t)} style={{ padding: "7px 13px", borderRadius: 20, border: `1.5px solid ${ticketType === t ? C.accent : C.border}`, background: ticketType === t ? C.accentBg : "transparent", color: ticketType === t ? C.accent : C.sub, cursor: "pointer", fontSize: 12.5, fontWeight: ticketType === t ? 600 : 400, fontFamily: "'DM Sans',sans-serif" }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>Describe the issue</div>
              <textarea value={ticketMsg} onChange={e => setTicketMsg(e.target.value)} placeholder="Tell us what happened…" rows={4}
                style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "11px 13px", color: C.text, fontSize: 14, outline: "none", resize: "none", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border} />
            </div>
            <button disabled={!ticketType || ticketMsg.length < 10} onClick={() => setTicketSent(true)}
              style={{ width: "100%", padding: "13px", background: ticketType && ticketMsg.length >= 10 ? C.accent : C.border, border: "none", borderRadius: 12, color: ticketType && ticketMsg.length >= 10 ? "#fff" : C.muted, fontWeight: 600, fontSize: 14.5, cursor: ticketType && ticketMsg.length >= 10 ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif" }}>
              Submit Ticket
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎫</div>
            <div className="disp" style={{ fontSize: 20, color: C.text, marginBottom: 8 }}>Ticket submitted!</div>
            <div style={{ color: C.sub, fontSize: 13.5, lineHeight: 1.65, marginBottom: 22 }}>We'll respond within 24 hours to <b style={{ color: C.text }}>john.doe@gmail.com</b>.<br/>Ticket ID: <b style={{ color: C.accent }}>#TKT-4821</b></div>
            <button onClick={() => { setTicketOpen(false); setTicketSent(false); }} style={{ width: "100%", padding: "13px", background: C.accent, border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, fontSize: 14.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Done</button>
          </div>
        )}
      </Sheet>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
//  REALTIME LOCATION SYSTEM
// ─────────────────────────────────────────────────────────────

// ── useGeolocation: gets + watches the device's GPS position ──
function useGeolocation() {
  const [pos, setPos] = useState(null);
  const [error, setError] = useState(null);
  const watchId = useRef(null);

  const start = useCallback(() => {
    if (!navigator.geolocation) { setError("GPS not supported"); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, []);

  const stop = useCallback(() => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  useEffect(() => () => stop(), [stop]);
  return { pos, error, start, stop };
}

// ── useShopperLocation: broadcasts GPS to Supabase realtime ──
// Used by the shopper's device
function useShopperLocation(orderId, enabled) {
  const { pos, error, start, stop } = useGeolocation();
  const lastPush = useRef(0);

  useEffect(() => {
    if (enabled) start(); else stop();
    return stop;
  }, [enabled]);

  useEffect(() => {
    if (!pos || !orderId) return;
    const now = Date.now();
    if (now - lastPush.current < 4000) return; // throttle to every 4s
    lastPush.current = now;
    sb.db.update("orders", {
      shopper_location: { lat: pos.lat, lng: pos.lng, ts: now }
    }, `id=eq.${orderId}`).catch(() => {});
  }, [pos, orderId]);

  return { pos, error };
}

// ── useCustomerLocation: one-time fetch of customer's address coords ──
function useCustomerLocation() {
  const [pos, setPos] = useState(null);
  const [asked, setAsked] = useState(false);

  const request = useCallback(() => {
    if (asked) return;
    setAsked(true);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    );
  }, [asked]);

  return { pos, request };
}

// ── LiveMapCanvas: renders an animated map using only Canvas + SVG ──
// No external map library needed
function LiveMapCanvas({ shopperPos, customerPos, eta, step, C }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const shopperMarker = useRef({ x: 0.22, y: 0.62 });
  const [markerPos, setMarkerPos] = useState({ x: 0.22, y: 0.62 });

  // Interpolate shopper marker smoothly when real position arrives
  useEffect(() => {
    if (!shopperPos) return;
    // Map lat/lng delta to canvas fractions (demo: VI Lagos area)
    const BASE_LAT = 6.4281, BASE_LNG = 3.4219;
    const SCALE_LAT = 80, SCALE_LNG = 80;
    const x = 0.5 + (shopperPos.lng - BASE_LNG) * SCALE_LNG;
    const y = 0.5 - (shopperPos.lat - BASE_LAT) * SCALE_LAT;
    const clampedX = Math.max(0.08, Math.min(0.92, x));
    const clampedY = Math.max(0.08, Math.min(0.92, y));
    // Smooth animate
    let start = null;
    const from = { ...shopperMarker.current };
    const to = { x: clampedX, y: clampedY };
    const animate = (ts) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / 800, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      shopperMarker.current = { x: from.x + (to.x - from.x) * ease, y: from.y + (to.y - from.y) * ease };
      setMarkerPos({ ...shopperMarker.current });
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [shopperPos]);

  const storePos = { x: 0.10, y: 0.74 };
  const homePos  = { x: 0.88, y: 0.20 };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Map background */}
      <div style={{ position: "absolute", inset: 0, background: C.dark
        ? "linear-gradient(160deg,#0a1525 0%,#071020 50%,#0d1a2e 100%)"
        : "linear-gradient(160deg,#ddeaf5 0%,#c8dcee 50%,#d4e6f4 100%)" }} />

      {/* Road grid (SVG) */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 400 220" preserveAspectRatio="none">
        {/* Main roads */}
        <path d="M0 110 L400 110" stroke={C.dark ? "#1a2a3a" : "#c5d8e8"} strokeWidth="10" fill="none" />
        <path d="M200 0 L200 220" stroke={C.dark ? "#1a2a3a" : "#c5d8e8"} strokeWidth="8" fill="none" />
        <path d="M0 55 L400 55" stroke={C.dark ? "#162030" : "#cde0ed"} strokeWidth="5" fill="none" />
        <path d="M0 165 L400 165" stroke={C.dark ? "#162030" : "#cde0ed"} strokeWidth="5" fill="none" />
        <path d="M100 0 L100 220" stroke={C.dark ? "#162030" : "#cde0ed"} strokeWidth="5" fill="none" />
        <path d="M300 0 L300 220" stroke={C.dark ? "#162030" : "#cde0ed"} strokeWidth="5" fill="none" />
        {/* Road labels */}
        <text x="205" y="107" fontSize="6" fill={C.dark ? "#2a4060" : "#8aa8c0"} fontFamily="sans-serif">AHMADU BELLO WAY</text>
        <text x="5" y="108" fontSize="6" fill={C.dark ? "#2a4060" : "#8aa8c0"} fontFamily="sans-serif">OZUMBA MBADIWE</text>
        {/* Blocks */}
        {[[15,15,75,35],[120,15,70,35],[210,15,75,35],[320,15,65,35],
          [15,70,75,30],[120,70,70,30],[210,70,75,30],[320,70,65,30],
          [15,120,75,35],[120,120,70,35],[210,120,75,35],[320,120,65,35],
          [15,175,75,30],[120,175,70,30],[210,175,75,30],[320,175,65,30]].map(([x,y,w,h],i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="3"
            fill={C.dark ? `rgba(20,35,55,${0.6+Math.random()*0.3})` : `rgba(180,205,225,${0.4+Math.random()*0.3})`} />
        ))}
        {/* Route line */}
        <path
          d={`M${storePos.x*400} ${storePos.y*220} Q${markerPos.x*400} ${storePos.y*220} ${markerPos.x*400} ${markerPos.y*220} Q${markerPos.x*400} ${homePos.y*220} ${homePos.x*400} ${homePos.y*220}`}
          stroke={C.accent} strokeWidth="2.5" fill="none" strokeDasharray="7 4" opacity="0.7"
          style={{ transition: "d 0.8s ease" }}
        />
      </svg>

      {/* Store pin */}
      <div style={{ position: "absolute", left: `${storePos.x*100}%`, top: `${storePos.y*100}%`, transform: "translate(-50%,-100%)", fontSize: 22, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.4))" }}>🏪</div>

      {/* Shopper pin — animated */}
      <div style={{ position: "absolute", left: `${markerPos.x*100}%`, top: `${markerPos.y*100}%`, transform: "translate(-50%,-50%)", zIndex: 10, transition: step >= 4 ? "left 0.8s ease, top 0.8s ease" : "none" }}>
        <div style={{ position: "relative" }}>
          {/* Pulse ring */}
          <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: `${C.accent}30`, animation: "spin 2s linear infinite", border: `1.5px solid ${C.accent}60` }} />
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 3px 12px ${C.accent}66`, border: "2.5px solid #fff" }}>🛵</div>
        </div>
      </div>

      {/* Customer / home pin */}
      <div style={{ position: "absolute", left: `${homePos.x*100}%`, top: `${homePos.y*100}%`, transform: "translate(-50%,-100%)", fontSize: 22, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.4))" }}>🏠</div>

      {/* ETA badge */}
      <div style={{ position: "absolute", bottom: 10, right: 12, background: C.dark ? "rgba(10,20,35,.92)" : "rgba(255,255,255,.92)", border: `1px solid ${C.green}44`, borderRadius: 9, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(8px)" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, flexShrink: 0, animation: "blink 1.4s ease-in-out infinite" }} />
        <span style={{ color: C.green, fontWeight: 700, fontSize: 12 }}>ETA {eta}</span>
      </div>

      {/* Accuracy indicator */}
      {shopperPos && (
        <div style={{ position: "absolute", top: 10, left: 12, background: C.dark ? "rgba(10,20,35,.85)" : "rgba(255,255,255,.85)", borderRadius: 7, padding: "3px 9px", fontSize: 10, color: C.sub, backdropFilter: "blur(6px)" }}>
          📡 GPS ±{Math.round(shopperPos.accuracy || 15)}m
        </div>
      )}
    </div>
  );
}

// ── LiveTracking: full tracking screen with realtime map ─────
function LiveTracking({ goTo, orderId = "demo_order_001", C }) {
  const { status: liveStatus } = useTracking(orderId);
  const [step, setStep] = useState(2);
  const [shopperGPS, setShopperGPS] = useState(null);
  const [eta, setEta] = useState("23 min");
  const [expanded, setExpanded] = useState(false);
  const { pos: customerPos, request: requestCustomerLoc } = useCustomerLocation();

  // Demo: simulate shopper moving along a route
  useEffect(() => {
    const ROUTE = [
      { lat: 6.4272, lng: 3.4104 }, { lat: 6.4276, lng: 3.4132 },
      { lat: 6.4279, lng: 3.4158 }, { lat: 6.4281, lng: 3.4185 },
      { lat: 6.4280, lng: 3.4210 }, { lat: 6.4279, lng: 3.4225 },
    ];
    let i = 0;
    const interval = setInterval(() => {
      setShopperGPS({ ...ROUTE[i % ROUTE.length], accuracy: 12 });
      const remaining = ROUTE.length - (i % ROUTE.length);
      setEta(`${remaining * 3} min`);
      i++;
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Request customer location on mount
  useEffect(() => { requestCustomerLoc(); }, []);

  // Auto-advance step in demo
  useEffect(() => {
    if (step < 5) { const t = setTimeout(() => setStep(s => s + 1), 3500); return () => clearTimeout(t); }
  }, [step]);

  const steps = [
    { label: "Order placed",        time: "2:30 PM",      icon: "📋" },
    { label: "Store confirmed",      time: "2:35 PM",      icon: "✅" },
    { label: "Shopper assigned",     time: "2:38 PM",      icon: "🧑‍💼" },
    { label: "Shopping in progress", time: "Est. 3:00 PM", icon: "🛒" },
    { label: "Out for delivery",     time: "Est. 3:25 PM", icon: "🛵" },
    { label: "Delivered!",           time: "Est. 3:40 PM", icon: "🎉" },
  ];

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("home")} C={C} />
        <div style={{ flex: 1 }}>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>Order #0893</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 7, padding: "3px 9px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "blink 1.4s ease-in-out infinite" }} />
              <span style={{ color: C.green, fontWeight: 700, fontSize: 11 }}>LIVE</span>
            </div>
            {liveStatus && <span style={{ color: C.sub, fontSize: 12 }}>· {liveStatus}</span>}
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ padding: "6px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.sub, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          {expanded ? "Collapse" : "Expand map"}
        </button>
      </div>

      {/* Live Map */}
      <div style={{ margin: "0 20px 16px", height: expanded ? 300 : 200, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", position: "relative", transition: "height .3s ease" }}>
        <LiveMapCanvas shopperPos={shopperGPS} customerPos={customerPos} eta={eta} step={step} C={C} />
      </div>

      {/* Customer location prompt */}
      {!customerPos && (
        <div onClick={requestCustomerLoc} style={{ margin: "0 20px 14px", background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: C.text }}>Share your location</div>
            <div style={{ color: C.sub, fontSize: 12, marginTop: 1 }}>So your shopper can find you easily</div>
          </div>
          <span style={{ color: C.accent, fontSize: 14 }}>→</span>
        </div>
      )}
      {customerPos && (
        <div style={{ margin: "0 20px 14px", background: C.greenBg, border: `1px solid ${C.green}33`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <span style={{ color: C.green, fontSize: 13, fontWeight: 500 }}>Your location is shared with the shopper</span>
        </div>
      )}

      {/* Shopper strip */}
      <div style={{ margin: "0 20px 18px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "13px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: C.surface, border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👨🏾</div>
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 13, height: 13, borderRadius: "50%", background: C.green, border: `2px solid ${C.bg}` }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Emeka Nwosu</div>
            <div style={{ color: C.sub, fontSize: 12, marginTop: 1 }}>⭐ 4.9 · 284 deliveries · Verified ✓</div>
          </div>
          <button style={{ width: 36, height: 36, borderRadius: 10, background: C.greenBg, border: "none", fontSize: 17, cursor: "pointer" }}>📞</button>
          <button style={{ width: 36, height: 36, borderRadius: 10, background: C.accentBg, border: "none", fontSize: 17, cursor: "pointer" }}>💬</button>
        </div>

        {/* Live GPS data row */}
        {shopperGPS && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            {[
              { label: "ETA", value: eta, icon: "⏱️" },
              { label: "Speed", value: "28 km/h", icon: "🛵" },
              { label: "Distance", value: "1.8 km", icon: "📍" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ flex: 1, textAlign: "center", background: C.surface, borderRadius: 9, padding: "8px 4px" }}>
                <div style={{ fontSize: 15, marginBottom: 2 }}>{icon}</div>
                <div className="disp" style={{ fontSize: 13, color: C.text }}>{value}</div>
                <div style={{ color: C.muted, fontSize: 10.5, marginTop: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>ORDER TIMELINE</div>
        {steps.map((s, i) => (
          <div key={i} className="reveal" style={{ display: "flex", gap: 14, position: "relative", transitionDelay: `${i * 40}ms` }}>
            {i < steps.length - 1 && <div style={{ position: "absolute", left: 15, top: 34, width: 2, height: 38, background: i < step ? C.accent : C.border, transition: "background .6s" }} />}
            <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: i < step ? C.accent : i === step ? C.accentBg : C.card, border: `2px solid ${i <= step ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all .4s" }}>
              {i < step ? "✓" : s.icon}
            </div>
            <div style={{ paddingBottom: i < steps.length - 1 ? 24 : 0, paddingTop: 5 }}>
              <div style={{ fontWeight: i <= step ? 600 : 400, fontSize: 14, color: i <= step ? C.text : C.muted }}>{s.label}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{s.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
//  IDENTITY VERIFICATION SYSTEM
//  Shopper: NIN / Passport + Selfie
//  Store:   BVN / CAC + Selfie
//  Admin:   Review queue
// ─────────────────────────────────────────────────────────────

// ── File upload helper: reads file → base64 preview ──────────
function useFileUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const clear = () => { setFile(null); setPreview(null); };

  // In production: uploads to Supabase Storage
  const upload = async (bucket, path) => {
    if (!file) return null;
    setUploading(true);
    // Simulate upload delay; replace with real Supabase Storage call:
    // const { data } = await supabase.storage.from(bucket).upload(path, file);
    await new Promise(r => setTimeout(r, 1400));
    setUploading(false);
    return `https://storage.example.com/${bucket}/${path}`; // mock URL
  };

  return { file, preview, pick, clear, upload, uploading };
}

// ── UploadBox: drag-n-drop + tap file picker ─────────────────
function UploadBox({ label, hint, accept = "image/*,.pdf", preview, onPick, onClear, C }) {
  const inputRef = useRef(null);
  return (
    <div>
      <div style={{ color: C.sub, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {preview ? (
        <div style={{ position: "relative", borderRadius: 13, overflow: "hidden", border: `1.5px solid ${C.green}`, background: C.card }}>
          {preview.startsWith("data:image") ? (
            <img src={preview} alt="upload" style={{ width: "100%", height: 140, objectFit: "cover" }} />
          ) : (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <span style={{ color: C.text, fontSize: 13 }}>Document uploaded ✓</span>
            </div>
          )}
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <button onClick={onClear} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <div style={{ position: "absolute", bottom: 8, left: 8, background: C.greenBg, borderRadius: 6, padding: "3px 9px" }}>
            <span style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>✓ Uploaded</span>
          </div>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} style={{ border: `1.5px dashed ${C.border}`, borderRadius: 13, padding: "22px 16px", textAlign: "center", cursor: "pointer", background: C.card, transition: "border-color .18s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: C.text, marginBottom: 4 }}>Tap to upload</div>
          <div style={{ color: C.muted, fontSize: 11.5 }}>{hint}</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={onPick} style={{ display: "none" }} />
    </div>
  );
}

// ── SelfieCapture: camera selfie or file upload ───────────────
function SelfieCapture({ preview, onCapture, onClear, C }) {
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStream(s);
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
    } catch { inputRef.current?.click(); } // fallback to file picker
  };

  const snap = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.85));
    stream?.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
  };

  const closeCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
  };

  return (
    <div>
      <div style={{ color: C.sub, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Selfie / Liveness check</div>
      {cameraOpen ? (
        <div style={{ borderRadius: 13, overflow: "hidden", background: "#000", position: "relative" }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", display: "block", maxHeight: 240 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: 120, height: 160, borderRadius: "50%", border: "2.5px dashed rgba(255,255,255,.5)" }} />
          </div>
          <div style={{ padding: "12px 14px", display: "flex", gap: 9, background: "rgba(0,0,0,.7)" }}>
            <button onClick={snap} style={{ flex: 1, padding: "10px", background: C.accent, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>📸 Take Photo</button>
            <button onClick={closeCamera} style={{ padding: "10px 14px", background: "rgba(255,255,255,.15)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
          </div>
        </div>
      ) : preview ? (
        <div style={{ position: "relative", borderRadius: 13, overflow: "hidden", border: `1.5px solid ${C.green}` }}>
          <img src={preview} alt="selfie" style={{ width: "100%", height: 160, objectFit: "cover" }} />
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <button onClick={onClear} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.6)", border: "none", color: "#fff", cursor: "pointer", fontSize: 14 }}>×</button>
          </div>
          <div style={{ position: "absolute", bottom: 8, left: 8, background: C.greenBg, borderRadius: 6, padding: "3px 9px" }}>
            <span style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>✓ Selfie captured</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 9 }}>
          <div onClick={openCamera} style={{ flex: 1, border: `1.5px dashed ${C.border}`, borderRadius: 13, padding: "18px 10px", textAlign: "center", cursor: "pointer", background: C.card }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>📷</div>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text }}>Camera</div>
          </div>
          <div onClick={() => inputRef.current?.click()} style={{ flex: 1, border: `1.5px dashed ${C.border}`, borderRadius: 13, padding: "18px 10px", textAlign: "center", cursor: "pointer", background: C.card }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>🖼️</div>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text }}>Upload</div>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="user" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => onCapture(ev.target.result); r.readAsDataURL(f); } }} style={{ display: "none" }} />
      <div style={{ color: C.muted, fontSize: 11, marginTop: 7 }}>Face the camera clearly · Good lighting · No glasses</div>
    </div>
  );
}

// ── VerificationStatusBadge ───────────────────────────────────
function VerificationBadge({ status, C }) {
  const map = {
    unverified: { color: C.muted,  bg: C.card,    icon: "○", label: "Not verified" },
    pending:    { color: C.gold,   bg: C.goldBg,  icon: "⏳", label: "Under review" },
    verified:   { color: C.green,  bg: C.greenBg, icon: "✓", label: "Verified" },
    rejected:   { color: "#EF4444",bg:"rgba(239,68,68,.1)",icon:"✗", label: "Rejected" },
  };
  const m = map[status] || map.unverified;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: m.bg, border: `1px solid ${m.color}33`, borderRadius: 7, padding: "3px 9px" }}>
      <span style={{ color: m.color, fontWeight: 700, fontSize: 12 }}>{m.icon}</span>
      <span style={{ color: m.color, fontWeight: 600, fontSize: 11 }}>{m.label}</span>
    </div>
  );
}

// ── ShopperVerification: full verification wizard ─────────────
function ShopperVerification({ onBack, onDone, C }) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const idUpload = useFileUpload();
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const STEPS = ["ID Type", "Upload ID", "Selfie", "Review"];
  const canNext = [
    () => !!idType,
    () => !!idUpload.preview && idNumber.length >= 8,
    () => !!selfiePreview,
    () => true,
  ];

  const submit = async () => {
    setSubmitting(true);
    // In production: save to Supabase verifications table
    // await sb.db.insert("verifications", { type: "shopper", id_type: idType, id_number: idNumber, status: "pending" });
    await new Promise(r => setTimeout(r, 2000));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "32px 24px", textAlign: "center", animation: "up .35s ease" }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: C.goldBg, border: `1px solid ${C.gold}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 20 }}>⏳</div>
      <div className="disp" style={{ fontSize: 22, color: C.text, marginBottom: 10 }}>Verification Submitted!</div>
      <div style={{ color: C.sub, fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>We're reviewing your identity documents.</div>
      <div style={{ background: C.goldBg, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: "12px 16px", marginBottom: 28, width: "100%", maxWidth: 320 }}>
        <div style={{ color: C.gold, fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>What happens next?</div>
        {["Your NIN/passport is verified with NIMC", "Selfie is matched with ID photo", "You receive email + in-app confirmation", "Typically takes 2–4 hours on weekdays"].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 8, color: C.sub, fontSize: 12.5, marginTop: 7 }}>
            <span style={{ color: C.gold, flexShrink: 0 }}>{i + 1}.</span>{t}
          </div>
        ))}
      </div>
      <Btn C={C} block onClick={onDone}>Done</Btn>
    </div>
  );

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={onBack} C={C} />
        <div>
          <div className="disp" style={{ fontSize: 17, color: C.text }}>Identity Verification</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>Step {step + 1} of {STEPS.length}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><VerificationBadge status="pending" C={C} /></div>
      </div>

      {/* Step bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 20px 20px" }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i < step ? C.green : i === step ? C.accent : C.card, border: `2px solid ${i <= step ? (i < step ? C.green : C.accent) : C.border}`, color: i <= step ? "#fff" : C.muted, transition: "all .3s" }}>{i < step ? "✓" : i + 1}</div>
              <div style={{ fontSize: 9, color: i <= step ? C.text : C.muted, fontWeight: i === step ? 600 : 400, whiteSpace: "nowrap" }}>{s}</div>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? C.green : C.border, marginBottom: 14, transition: "background .3s" }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ padding: "0 20px", animation: "up .25s ease" }}>
        {/* Step 0: ID type */}
        {step === 0 && (
          <div>
            <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 6 }}>Choose ID type</div>
            <div style={{ color: C.sub, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>We'll verify your identity with the Nigerian government database.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "nin", label: "National ID (NIN)", sub: "National Identification Number", icon: "🪪" },
                { id: "passport", label: "International Passport", sub: "Nigerian passport (any valid)", icon: "📘" },
                { id: "drivers", label: "Driver's License", sub: "FRSC-issued license", icon: "🚗" },
                { id: "voters", label: "Voter's Card", sub: "INEC permanent voter card", icon: "🗳️" },
              ].map(opt => (
                <div key={opt.id} onClick={() => setIdType(opt.id)} style={{ display: "flex", alignItems: "center", gap: 13, background: C.card, border: `1.5px solid ${idType === opt.id ? C.accent : C.border}`, borderRadius: 13, padding: "13px 16px", cursor: "pointer", transition: "border-color .15s" }}>
                  <span style={{ fontSize: 26 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{opt.label}</div>
                    <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${idType === opt.id ? C.accent : C.border}`, background: idType === opt.id ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", transition: "all .15s" }}>{idType === opt.id ? "✓" : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Upload ID + number */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 2 }}>Upload your ID</div>
            <div>
              <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>
                {idType === "nin" ? "NIN number (11 digits)" : idType === "passport" ? "Passport number" : "ID number"}
              </div>
              <input value={idNumber} onChange={e => setIdNumber(e.target.value)}
                placeholder={idType === "nin" ? "e.g. 12345678901" : "Enter ID number"}
                style={{ width: "100%", background: C.card, border: `1.5px solid ${idNumber.length >= 8 ? C.green : C.border}`, borderRadius: 11, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif" }} />
              {idNumber.length > 0 && idNumber.length < 8 && <div style={{ color: C.accent, fontSize: 11, marginTop: 5 }}>Enter at least 8 characters</div>}
            </div>
            <UploadBox
              label="Front of ID (clear photo or scan)"
              hint="JPG, PNG or PDF · Max 5MB · Ensure all text is readable"
              preview={idUpload.preview}
              onPick={idUpload.pick}
              onClear={idUpload.clear}
              C={C}
            />
            <div style={{ background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 11, padding: "10px 13px" }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text, marginBottom: 4 }}>📋 Tips for a good upload</div>
              {["All four corners visible", "No glare or shadow", "Text must be clearly readable", "Expiry date must be valid"].map(t => (
                <div key={t} style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>· {t}</div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Selfie */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 2 }}>Take a selfie</div>
            <div style={{ color: C.sub, fontSize: 13.5, lineHeight: 1.6 }}>We'll match this with your ID photo. Look directly at the camera.</div>
            <SelfieCapture preview={selfiePreview} onCapture={setSelfiePreview} onClear={() => setSelfiePreview(null)} C={C} />
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 2 }}>Review & submit</div>
            {[
              { label: "ID type", value: { nin:"National ID (NIN)", passport:"International Passport", drivers:"Driver's License", voters:"Voter's Card" }[idType] || idType, icon: "🪪" },
              { label: "ID number", value: idNumber.slice(0,4) + "·".repeat(idNumber.length - 4), icon: "🔢" },
              { label: "Document photo", value: idUpload.preview ? "Uploaded ✓" : "Missing ✗", icon: "📄" },
              { label: "Selfie", value: selfiePreview ? "Captured ✓" : "Missing ✗", icon: "📸" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.muted, fontSize: 11.5 }}>{label}</div>
                  <div style={{ color: C.text, fontWeight: 500, fontSize: 13.5, marginTop: 2 }}>{value}</div>
                </div>
              </div>
            ))}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", fontSize: 12.5, color: C.sub, lineHeight: 1.65 }}>
              By submitting, you confirm this is your own valid ID and that all information is accurate. False submissions may result in account suspension.
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "13px 20px env(safe-area-inset-bottom, 20px)", background: C.bg, borderTop: `1px solid ${C.border}`, display: "flex", gap: 9 }}>
        {step > 0 && <Btn C={C} outline onClick={() => setStep(s => s - 1)}>‹ Back</Btn>}
        <Btn C={C} block onClick={step === STEPS.length - 1 ? submit : () => setStep(s => s + 1)} style={{ opacity: canNext[step]() ? 1 : .5 }}>
          {submitting
            ? <span style={{ width: 17, height: 17, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
            : step === STEPS.length - 1 ? "Submit for review" : "Continue →"}
        </Btn>
      </div>
    </div>
  );
}

// ── StoreVerification: BVN / CAC + selfie ────────────────────
function StoreVerification({ onBack, onDone, C }) {
  const [step, setStep] = useState(0);
  const [bizType, setBizType] = useState("");
  const [bvn, setBvn] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const cacUpload = useFileUpload();
  const utilityUpload = useFileUpload();
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const STEPS = ["Biz Type", "Documents", "Selfie", "Review"];
  const canNext = [
    () => !!bizType,
    () => bvn.length === 11 && (bizType === "individual" || (cacNumber.length >= 6 && !!cacUpload.preview)),
    () => !!selfiePreview,
    () => true,
  ];

  const submit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "32px 24px", textAlign: "center", animation: "up .35s ease" }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: C.goldBg, border: `1px solid ${C.gold}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 20 }}>🏪</div>
      <div className="disp" style={{ fontSize: 22, color: C.text, marginBottom: 10 }}>Store Submitted!</div>
      <div style={{ color: C.sub, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>Your store documents are under review. We'll notify you within 24 hours.</div>
      <Btn C={C} block onClick={onDone}>Done</Btn>
    </div>
  );

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "20px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={onBack} C={C} />
        <div>
          <div className="disp" style={{ fontSize: 17, color: C.text }}>Store Verification</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>Step {step + 1} of {STEPS.length}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><VerificationBadge status="pending" C={C} /></div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 20px 20px" }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i < step ? C.green : i === step ? C.accent : C.card, border: `2px solid ${i <= step ? (i < step ? C.green : C.accent) : C.border}`, color: i <= step ? "#fff" : C.muted, transition: "all .3s" }}>{i < step ? "✓" : i + 1}</div>
              <div style={{ fontSize: 9, color: i <= step ? C.text : C.muted, fontWeight: i === step ? 600 : 400, whiteSpace: "nowrap" }}>{s}</div>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? C.green : C.border, marginBottom: 14, transition: "background .3s" }} />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ padding: "0 20px", animation: "up .25s ease" }}>
        {step === 0 && (
          <div>
            <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 6 }}>Business type</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {[
                { id: "individual", label: "Individual / Sole trader", sub: "No registered business — verified with BVN only", icon: "👤" },
                { id: "registered", label: "Registered business", sub: "CAC-registered company or enterprise", icon: "🏢" },
                { id: "partnership", label: "Partnership", sub: "Two or more partners, CAC-registered", icon: "🤝" },
              ].map(opt => (
                <div key={opt.id} onClick={() => setBizType(opt.id)} style={{ display: "flex", alignItems: "center", gap: 13, background: C.card, border: `1.5px solid ${bizType === opt.id ? C.accent : C.border}`, borderRadius: 13, padding: "13px 16px", cursor: "pointer", transition: "border-color .15s" }}>
                  <span style={{ fontSize: 26 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{opt.label}</div>
                    <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{opt.sub}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${bizType === opt.id ? C.accent : C.border}`, background: bizType === opt.id ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", transition: "all .15s" }}>{bizType === opt.id ? "✓" : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 2 }}>Business documents</div>
            <div>
              <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>BVN (Bank Verification Number) <span style={{ color: C.accent }}>*</span></div>
              <input value={bvn} onChange={e => setBvn(e.target.value.replace(/\D/g,"").slice(0,11))}
                placeholder="11-digit BVN"
                style={{ width: "100%", background: C.card, border: `1.5px solid ${bvn.length === 11 ? C.green : C.border}`, borderRadius: 11, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif" }} />
              <div style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>Dial *565*0# on your registered bank number to retrieve your BVN</div>
            </div>
            {bizType !== "individual" && (
              <>
                <div>
                  <div style={{ color: C.sub, fontSize: 12, marginBottom: 7 }}>CAC Registration Number <span style={{ color: C.accent }}>*</span></div>
                  <input value={cacNumber} onChange={e => setCacNumber(e.target.value)}
                    placeholder="e.g. RC-1234567"
                    style={{ width: "100%", background: C.card, border: `1.5px solid ${cacNumber.length >= 6 ? C.green : C.border}`, borderRadius: 11, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif" }} />
                </div>
                <UploadBox label="CAC Certificate" hint="Certificate of Incorporation or Business Name Registration · JPG/PNG/PDF" preview={cacUpload.preview} onPick={cacUpload.pick} onClear={cacUpload.clear} C={C} />
                <UploadBox label="Utility bill (optional)" hint="Proof of business address · Dated within last 3 months" preview={utilityUpload.preview} onPick={utilityUpload.pick} onClear={utilityUpload.clear} C={C} />
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 2 }}>Owner selfie</div>
            <div style={{ color: C.sub, fontSize: 13.5, lineHeight: 1.6 }}>Take a selfie as the business owner. This must match the person linked to the BVN.</div>
            <SelfieCapture preview={selfiePreview} onCapture={setSelfiePreview} onClear={() => setSelfiePreview(null)} C={C} />
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div className="disp" style={{ fontSize: 18, color: C.text, marginBottom: 2 }}>Review & submit</div>
            {[
              { label: "Business type", value: { individual: "Individual / Sole trader", registered: "Registered business", partnership: "Partnership" }[bizType], icon: "🏢" },
              { label: "BVN", value: "·".repeat(7) + bvn.slice(-4), icon: "🏦" },
              bizType !== "individual" && { label: "CAC number", value: cacNumber, icon: "📋" },
              bizType !== "individual" && { label: "CAC document", value: cacUpload.preview ? "Uploaded ✓" : "Missing ✗", icon: "📄" },
              { label: "Owner selfie", value: selfiePreview ? "Captured ✓" : "Missing ✗", icon: "📸" },
            ].filter(Boolean).map(({ label, value, icon }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.muted, fontSize: 11.5 }}>{label}</div>
                  <div style={{ color: C.text, fontWeight: 500, fontSize: 13.5, marginTop: 2 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "13px 20px env(safe-area-inset-bottom, 20px)", background: C.bg, borderTop: `1px solid ${C.border}`, display: "flex", gap: 9 }}>
        {step > 0 && <Btn C={C} outline onClick={() => setStep(s => s - 1)}>‹ Back</Btn>}
        <Btn C={C} block onClick={step === STEPS.length - 1 ? submit : () => setStep(s => s + 1)} style={{ opacity: canNext[step]() ? 1 : .5 }}>
          {submitting
            ? <span style={{ width: 17, height: 17, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
            : step === STEPS.length - 1 ? "Submit for review" : "Continue →"}
        </Btn>
      </div>
    </div>
  );
}

// ── AdminVerificationQueue ────────────────────────────────────
function AdminVerificationQueue({ goTo, C }) {
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState("");
  const [note, setNote] = useState("");
  const toast = useToast();

  const QUEUE = [
    { id: "v001", name: "Adebayo Okafor",   type: "shopper", idType: "NIN",      submitted: "2 hours ago",  status: "pending",  selfie: true, doc: true },
    { id: "v002", name: "Chiamaka Foods Ltd",type: "store",   idType: "CAC",      submitted: "4 hours ago",  status: "pending",  selfie: true, doc: true },
    { id: "v003", name: "Tunde Williams",   type: "shopper", idType: "Passport", submitted: "6 hours ago",  status: "pending",  selfie: true, doc: false },
    { id: "v004", name: "Fresh Basket NG",  type: "store",   idType: "CAC",      submitted: "1 day ago",    status: "verified", selfie: true, doc: true },
    { id: "v005", name: "Ngozi Adeyemi",    type: "shopper", idType: "NIN",      submitted: "1 day ago",    status: "rejected", selfie: true, doc: true },
    { id: "v006", name: "QuickMart Lekki",  type: "store",   idType: "BVN+CAC",  submitted: "2 days ago",   status: "verified", selfie: true, doc: true },
  ];

  const filtered = filter === "all" ? QUEUE : QUEUE.filter(v => v.status === filter);

  const statusColor = s => s === "verified" ? C.green : s === "rejected" ? "#EF4444" : C.gold;
  const statusBg    = s => s === "verified" ? C.greenBg : s === "rejected" ? "rgba(239,68,68,.1)" : C.goldBg;

  const approve = (id) => { toast("Approved ✓", "✅", "success"); setSelected(null); };
  const reject  = (id) => { toast("Rejected — notification sent", "✗"); setSelected(null); };

  const sel = QUEUE.find(v => v.id === selected);

  return (
    <div className="screen" style={{ background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: "52px 20px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <Back onClick={() => goTo("profile")} C={C} />
        <div style={{ flex: 1 }}>
          <div className="disp" style={{ fontSize: 20, color: C.text }}>Verification Queue</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{QUEUE.filter(v => v.status === "pending").length} pending review</div>
        </div>
        <div style={{ background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: C.accent }}>ADMIN</div>
      </div>

      <div className="hrow" style={{ padding: "0 20px 14px" }}>
        {["pending","verified","rejected","all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 20, border: "none", whiteSpace: "nowrap", fontWeight: 500, fontSize: 13, cursor: "pointer", background: filter === f ? C.accent : C.card, color: filter === f ? "#fff" : C.sub, flexShrink: 0, fontFamily: "'DM Sans',sans-serif", transition: "all .15s" }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f !== "all" && `(${QUEUE.filter(v => v.status === f).length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(v => (
          <div key={v.id} onClick={() => setSelected(v.id)} className="tap" style={{ background: C.card, border: `1.5px solid ${selected === v.id ? C.accent : C.border}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "border-color .15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: v.type === "store" ? C.accentBg : C.greenBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{v.type === "store" ? "🏪" : "🧑‍💼"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="disp" style={{ fontSize: 14, color: C.text }}>{v.name}</div>
                  <VerificationBadge status={v.status} C={C} />
                </div>
                <div style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>{v.type === "store" ? "Store owner" : "Personal shopper"} · {v.idType} · {v.submitted}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 10.5, color: v.doc ? C.green : "#EF4444", background: v.doc ? C.greenBg : "rgba(239,68,68,.1)", padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>📄 Doc {v.doc ? "✓" : "✗"}</span>
                  <span style={{ fontSize: 10.5, color: v.selfie ? C.green : "#EF4444", background: v.selfie ? C.greenBg : "rgba(239,68,68,.1)", padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>📸 Selfie {v.selfie ? "✓" : "✗"}</span>
                </div>
              </div>
              <span style={{ color: C.muted, fontSize: 18 }}>›</span>
            </div>

            {/* Expanded detail + actions */}
            {selected === v.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`, animation: "up .2s ease" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 13 }}>
                  {[["ID Type", v.idType],["Submitted", v.submitted],["Document", v.doc ? "Uploaded" : "Missing"],["Selfie", v.selfie ? "Captured" : "Missing"]].map(([l, val]) => (
                    <div key={l} style={{ background: C.surface, borderRadius: 9, padding: "9px 11px" }}>
                      <div style={{ color: C.muted, fontSize: 10.5, marginBottom: 3 }}>{l}</div>
                      <div style={{ color: C.text, fontWeight: 500, fontSize: 13 }}>{val}</div>
                    </div>
                  ))}
                </div>
                {v.status === "pending" && (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>Rejection note (if rejecting)</div>
                      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Document is blurry, please re-upload…" rows={2}
                        style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", color: C.text, fontSize: 13, outline: "none", resize: "none", fontFamily: "'DM Sans',sans-serif" }} />
                    </div>
                    <div style={{ display: "flex", gap: 9 }}>
                      <button onClick={() => approve(v.id)} style={{ flex: 1, padding: "11px", background: C.green, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✓ Approve</button>
                      <button onClick={() => reject(v.id)} style={{ flex: 1, padding: "11px", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, color: "#EF4444", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✗ Reject</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ── BOTTOM NAV ────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home",     icon: "🏠", label: "Home" },
  { id: "stores",   icon: "🏪", label: "Stores" },
  { id: "shoppers", icon: "🧑‍💼", label: "Shoppers" },
  { id: "cart",     icon: "🛒", label: "Cart" },
  { id: "profile",  icon: "👤", label: "Profile" },
];

function Nav({ view, goTo, cartCount, C }) {
  const active = NAV_ITEMS.find(i => i.id === view)?.id;
  return (
    <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: C.nav, backdropFilter: "blur(18px)", borderTop: `1px solid ${C.border}`, display: "flex", padding: "9px 0 env(safe-area-inset-bottom, 18px)" }}>
      {NAV_ITEMS.map(item => {
        const on = active === item.id;
        return (
          <div key={item.id} onClick={() => goTo(item.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 0", position: "relative" }}>
            <div style={{ position: "relative" }}>
              <span style={{ fontSize: 23, opacity: on ? 1 : .55, filter: on ? "none" : "grayscale(.2)", transition: "all .18s" }}>{item.icon}</span>
              {item.id === "cart" && <div style={{ position: "absolute", top: -4, right: -9 }}><CartBadge count={cartCount} C={C} /></div>}
            </div>
            <span style={{ fontSize: 10, color: on ? C.accent : C.muted, fontWeight: on ? 700 : 400, transition: "color .18s" }}>{item.label}</span>
            {on && <div style={{ position: "absolute", bottom: -9, width: 18, height: 3, borderRadius: 1.5, background: C.accent }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────
const RF = { Fragment: ({ children }) => children };
if (typeof React === "undefined") var React = RF;

export default function ErrandApp() {
  const { user, signOut: sbSignOut } = useAuth() || {};
  const [dark, setDark] = useState(true);
  const C = T(dark);
  const bp = useBP();

  const [phase, setPhase] = useState("splash"); // splash | auth | onboarding | app
  const [view, setView] = useState("home");
  const [sub, setSub] = useState(null); // { type: "store"|"shopper", data }
  const [cart, setCart] = useState([]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = useCallback(p => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
    });
  }, []);

  const [transDir, setTransDir] = useState('fwd');
  const [screenKey, setScreenKey] = useState(0);

  const NAV_ORDER = ["home","stores","shoppers","cart","tracking","wallet","rewards","groupbuy","referral","pass","notifications","profile","search","orders","settings","help","verify-queue"];
  const goTo = v => {
    const curIdx = NAV_ORDER.indexOf(view);
    const nxtIdx = NAV_ORDER.indexOf(v);
    setTransDir(nxtIdx >= 0 && curIdx >= 0 && nxtIdx < curIdx ? 'back' : 'fwd');
    setSub(null);
    setView(v);
    setScreenKey(k => k + 1);
  };

  const MAIN = ["home","stores","shoppers","cart","profile","tracking","wallet","rewards","groupbuy","referral","pass","notifications","search","orders","settings","help","verify-queue"];
  const showNav = phase === "app" && !sub && MAIN.includes(view);

  const Screen = () => {
    if (sub?.type === "store")   return <StoreDetail store={sub.data} onBack={() => setSub(null)} addToCart={addToCart} C={C} />;
    if (sub?.type === "shopper") return <ShopperChat shopper={sub.data} onBack={() => setSub(null)} C={C} />;
    const screen = (() => {
      switch (view) {
        case "home":          return <Home goTo={goTo} cart={cart} addToCart={addToCart} C={C} dark={dark} toggleDark={() => setDark(d => !d)} />;
        case "search":        return <Search goTo={goTo} C={C} />;
        case "stores":        return <Stores goTo={goTo} onStore={s => setSub({ type: "store", data: s })} C={C} />;
        case "shoppers":      return <Shoppers goTo={goTo} onShopper={s => setSub({ type: "shopper", data: s })} C={C} />;
        case "cart":          return <Cart goTo={goTo} cart={cart} setCart={setCart} C={C} />;
        case "tracking":      return <LiveTracking goTo={goTo} C={C} />;
        case "wallet":        return <Wallet goTo={goTo} C={C} />;
        case "rewards":       return <Rewards goTo={goTo} C={C} />;
        case "groupbuy":      return <GroupBuy goTo={goTo} C={C} />;
        case "pass":          return <Pass goTo={goTo} C={C} />;
        case "referral":      return <Referral goTo={goTo} C={C} />;
        case "notifications": return <Notifications goTo={goTo} C={C} />;
        case "profile":       return <Profile goTo={goTo} C={C} dark={dark} toggleDark={() => setDark(d => !d)} />;
        case "orders":        return <OrderHistory goTo={goTo} addToCart={addToCart} C={C} />;
        case "settings":      return <Settings goTo={goTo} C={C} dark={dark} toggleDark={() => setDark(d => !d)} />;
        case "help":          return <HelpSupport goTo={goTo} C={C} />;
        case "verify-queue":  return <AdminVerificationQueue goTo={goTo} C={C} />;
        default:              return <Home goTo={goTo} cart={cart} addToCart={addToCart} C={C} dark={dark} toggleDark={() => setDark(d => !d)} />;
      }
    })();
    return <div key={screenKey} className={transDir === 'back' ? 'screen-back' : 'screen-enter'} style={{position:'absolute',inset:0,overflow:'hidden'}}>{screen}</div>;
  };

  const isDesktop = bp === "lg";

  return (
    <AuthProvider C={C}>
      <style>{CSS(C)}</style>
      {phase === "splash" && <Splash onDone={() => setPhase("auth")} C={C} />}
      {phase === "auth" && <AuthScreen onDone={() => setPhase("onboarding")} C={C} />}
      {phase === "onboarding" && <Onboarding onDone={() => setPhase("app")} C={C} />}
      {phase === "app" && (
        <div className="app-shell" style={{ background: C.bg }}>
          {isDesktop && (
            <div className="sidebar" style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, padding: "0 6px" }}>
                <div style={{ width: 36, height: 36, background: C.accent, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🛍️</div>
                <span className="disp" style={{ fontSize: 20, color: C.text }}>errand</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                {[{id:"home",icon:"🏠",label:"Home"},{id:"stores",icon:"🏪",label:"Stores"},{id:"shoppers",icon:"🧑‍💼",label:"Shoppers"},{id:"cart",icon:"🛒",label:"Cart"},{id:"tracking",icon:"📍",label:"Tracking"},{id:"wallet",icon:"💰",label:"Wallet"},{id:"rewards",icon:"🏆",label:"Rewards"},{id:"groupbuy",icon:"👥",label:"Group Buy"},{id:"pass",icon:"👑",label:"Errand Pass"},{id:"referral",icon:"🎁",label:"Refer & Earn"},{id:"profile",icon:"👤",label:"Profile"}].map(item => {
                  const on = view === item.id;
                  return (
                    <div key={item.id} onClick={() => goTo(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, cursor: "pointer", background: on ? C.accentBg : "transparent", color: on ? C.accent : C.sub, fontWeight: on ? 600 : 400, fontSize: 14, transition: "all .15s", position: "relative" }}
                      onMouseEnter={e => { if(!on) e.currentTarget.style.background = C.card; }}
                      onMouseLeave={e => { if(!on) e.currentTarget.style.background = "transparent"; }}>
                      {on && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: C.accent, borderRadius: "0 3px 3px 0" }} />}
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                      <span>{item.label}</span>
                      {item.id === "cart" && cartCount > 0 && <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9, background: C.accent, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{cartCount}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 17 }}>{dark ? "🌙" : "☀️"}</span>
                <span style={{ flex: 1, fontSize: 13, color: C.sub }}>Dark mode</span>
                <div onClick={() => setDark(d=>!d)} style={{ width: 42, height: 24, borderRadius: 12, background: dark ? C.accent : C.border, cursor: "pointer", position: "relative", transition: "background .22s" }}>
                  <div style={{ position: "absolute", top: 2, left: dark ? 19 : 2, width: 20, height: 20, borderRadius: 10, background: "#fff", transition: "left .22s" }} />
                </div>
              </div>
            </div>
          )}
          <div className="main-col" style={{ background: C.bg }}>
            <Screen />
          </div>
          {!isDesktop && showNav && <Nav view={view} goTo={goTo} cartCount={cartCount} C={C} />}
          {showNav && <AIAssistant goTo={goTo} addToCart={addToCart} C={C} />}
        </div>
      )}
      <Toasts C={C} />
    </AuthProvider>
  );
}
