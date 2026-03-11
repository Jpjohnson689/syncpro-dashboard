import { useState, useRef, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

const COLORS = ["#00C9A7", "#4F8EF7", "#F7B731", "#FC5C65", "#A55EEA"];

const salesData = [
  { date: "Feb 1", sales: 1200 }, { date: "Feb 5", sales: 2100 },
  { date: "Feb 9", sales: 1800 }, { date: "Feb 13", sales: 3200 },
  { date: "Feb 17", sales: 2800 }, { date: "Feb 21", sales: 4100 },
  { date: "Feb 25", sales: 3700 }, { date: "Mar 1", sales: 5200 },
];

const topProducts = [
  { name: "Handmade Ceramic Mug Set", sku: "HCM-001", sold: 142, revenue: 4970, channel: "Etsy" },
  { name: "Minimalist Wall Art Print", sku: "WAP-204", sold: 98, revenue: 2940, channel: "Shopify" },
  { name: "Vintage Leather Wallet", sku: "VLW-093", sold: 87, revenue: 5220, channel: "Etsy" },
  { name: "Scented Soy Candle Bundle", sku: "SSC-045", sold: 76, revenue: 1900, channel: "Both" },
  { name: "Custom Portrait Commission", sku: "CPC-012", sold: 54, revenue: 8100, channel: "Etsy" },
];

const ordersByChannel = [
  { name: "Etsy", value: 62 },
  { name: "Shopify", value: 31 },
  { name: "Amazon", value: 7 },
];

const inventoryItems = [
  { id: 1, img: "🧱", name: "Handmade Ceramic Mug Set", sku: "HCM-001", condition: "New", location: "Warehouse A", available: 24, reserved: 6, onHand: 30, price: 34.99, modified: "Mar 4, 2026" },
  { id: 2, img: "🖼️", name: "Minimalist Wall Art Print – 18x24", sku: "WAP-204", condition: "New", location: "Warehouse A", available: 52, reserved: 3, onHand: 55, price: 29.99, modified: "Mar 4, 2026" },
  { id: 3, img: "👜", name: "Vintage Leather Wallet (Brown)", sku: "VLW-093", condition: "New", location: "Warehouse B", available: 18, reserved: 2, onHand: 20, price: 59.99, modified: "Mar 3, 2026" },
  { id: 4, img: "🕯️", name: "Scented Soy Candle Bundle (4pk)", sku: "SSC-045", condition: "New", location: "Warehouse A", available: 40, reserved: 8, onHand: 48, price: 24.99, modified: "Mar 2, 2026" },
  { id: 5, img: "🎨", name: "Custom Portrait Commission – Digital", sku: "CPC-012", condition: "New", location: "Digital", available: 999, reserved: 12, onHand: 999, price: 150.00, modified: "Mar 1, 2026" },
];

const channels = [
  { name: "Etsy", icon: "🟠", desc: "Specialized for handmade, vintage goods and craft supplies.", connected: true, color: "#F56400" },
  { name: "Shopify", icon: "🟢", desc: "Your own branded online store with full customization.", connected: true, color: "#96BF48" },
  { name: "Amazon", icon: "🟡", desc: "World's largest marketplace with tens of millions of shoppers.", connected: false, color: "#FF9900" },
  { name: "eBay", icon: "🔵", desc: "Sell everything to millions of shoppers worldwide.", connected: false, color: "#0064D2" },
  { name: "Walmart", icon: "⭐", desc: "Exclusive, but opens the door to millions of shoppers.", connected: false, color: "#0071CE" },
  { name: "TikTok Shop", icon: "⚫", desc: "Reach Gen Z buyers through social commerce.", connected: false, color: "#010101" },
  { name: "Google Shopping", icon: "🔴", desc: "Increase sales through Google product listings.", connected: false, color: "#DB4437" },
  { name: "Facebook Shop", icon: "🔵", desc: "Sell directly through Facebook and Instagram.", connected: false, color: "#1877F2" },
];

const announcements = [
  { date: "Mar 4, 2026", text: "Etsy API rate limits have been updated. Sync intervals may be slightly longer during peak hours." },
  { date: "Feb 28, 2026", text: "New feature: Bulk listing editor now supports variant-level pricing rules across all channels." },
  { date: "Feb 20, 2026", text: "Amazon connection stability improved. Reconnect your Amazon channel to apply the fix." },
  { date: "Feb 14, 2026", text: "Scheduled maintenance on Feb 17th from 10–11 PM PST. Sync operations will pause briefly." },
];

const BOT_PROMPTS = [
  "How do I sync inventory?",
  "How do I add a new channel?",
  "How do I bulk edit listings?",
  "What does 'Reserved' mean?",
];

const BOT_RESPONSES = {
  "How do I sync inventory?": "Great question! Head to the **Products** tab and click **Manage Locations**. From there you can toggle auto-sync per channel. Sync runs every 15 minutes by default, but you can force a manual sync anytime with the refresh icon.",
  "How do I add a new channel?": "Easy! Click the **Listings** tab in the top nav, then select **Connect a New Channel**. You'll see all available marketplaces. Click **Connect** on the one you want and follow the OAuth flow.",
  "How do I bulk edit listings?": "In the **Products** tab, check the boxes next to multiple SKUs and click **Bulk Editor** at the top. You can update price, quantity, title, and tags across all selected items at once.",
  "What does 'Reserved' mean?": "**Reserved** inventory is stock that has been committed to an open order but not yet shipped. It won't be available for new purchases. Once shipped, it moves out of Reserved and reduces your On Hand count.",
};

function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your Sync Pro guide. Ask me anything or pick a common question below 👇" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: msg }]);
    setLoading(true);

    // Check local answers first
    if (BOT_RESPONSES[msg]) {
      setTimeout(() => {
        setMessages(prev => [...prev, { from: "bot", text: BOT_RESPONSES[msg] }]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are SyncBot, a friendly assistant embedded inside Sync Pro — a multi-channel e-commerce platform that connects Etsy, Shopify, Amazon, eBay and more. Help users manage inventory, listings, orders, and channels. Keep answers concise, helpful, and practical. Use markdown bold for key terms.",
          messages: [{ role: "user", content: msg }]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
      setMessages(prev => [...prev, { from: "bot", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Network error. Please try again shortly." }]);
    }
    setLoading(false);
  };

  const renderText = (text) => {
    return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? <strong key={i} style={{ color: "#00C9A7" }}>{part}</strong> : part
    );
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: "50%", background: "linear-gradient(135deg, #00C9A7, #4F8EF7)",
        border: "none", cursor: "pointer", fontSize: 24, boxShadow: "0 4px 20px rgba(0,201,167,0.4)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform 0.2s"
      }}>{open ? "✕" : "💬"}</button>

      {open && (
        <div style={{
          position: "fixed", bottom: 90, right: 24, width: 360, height: 480,
          background: "#0F1923", border: "1px solid rgba(0,201,167,0.2)",
          borderRadius: 16, display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 999, overflow: "hidden"
        }}>
          <div style={{ padding: "14px 16px", background: "linear-gradient(135deg, #00C9A7, #4F8EF7)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>SyncBot</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Your Sync Pro guide</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%", padding: "9px 13px", borderRadius: m.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.from === "user" ? "linear-gradient(135deg, #00C9A7, #4F8EF7)" : "#1A2535",
                  color: "#fff", fontSize: 13, lineHeight: 1.5
                }}>
                  {renderText(m.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 4, padding: "8px 13px", background: "#1A2535", borderRadius: "14px 14px 14px 4px", width: "fit-content" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C9A7", animation: `bounce 1s ${i * 0.2}s infinite` }} />)}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {BOT_PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)} style={{
                  fontSize: 11, padding: "4px 9px", borderRadius: 20,
                  background: "rgba(0,201,167,0.1)", border: "1px solid rgba(0,201,167,0.3)",
                  color: "#00C9A7", cursor: "pointer", whiteSpace: "nowrap"
                }}>{p}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Ask anything..." style={{
                  flex: 1, background: "#1A2535", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, outline: "none"
                }} />
              <button onClick={() => send()} style={{
                padding: "8px 14px", background: "linear-gradient(135deg, #00C9A7, #4F8EF7)",
                border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700
              }}>→</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </>
  );
}

function OnboardingBanner({ step, setStep, dismiss }) {
  const steps = [
    { num: 1, title: "Where you sell", desc: "Connect your store and marketplaces to auto-import listing and order data.", action: "Connect your channels", icon: "🔗" },
    { num: 2, title: "What you sell", desc: "Automatically add your products to create a unified view of everything you sell.", action: "Add your products", icon: "📦" },
    { num: 3, title: "Ready to sell!", desc: "Confirm your imported listings are linked to their matching products.", action: "Link listings", icon: "🚀" },
  ];
  return (
    <div style={{ background: "linear-gradient(135deg, #0D1F2D 0%, #1A2E40 100%)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, border: "1px solid rgba(0,201,167,0.15)", position: "relative" }}>
      <button onClick={dismiss} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>Dismiss ✕</button>
      <h2 style={{ margin: "0 0 4px", color: "#fff", fontSize: 22, fontFamily: "'DM Serif Display', Georgia, serif" }}>Get setup in 3 easy steps</h2>
      <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>You're almost ready to start syncing across channels.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {steps.map((s) => (
          <div key={s.num} onClick={() => setStep(s.num)} style={{
            background: step === s.num ? "rgba(0,201,167,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${step === s.num ? "rgba(0,201,167,0.4)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 12, padding: "20px 18px", cursor: "pointer", transition: "all 0.2s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: step >= s.num ? "linear-gradient(135deg, #00C9A7, #4F8EF7)" : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
              }}>{step > s.num ? "✓" : s.icon}</div>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 }}>Step {s.num}</span>
            </div>
            <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6, fontSize: 15 }}>{s.title}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>{s.desc}</div>
            <button style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: step === s.num ? "linear-gradient(135deg, #00C9A7, #4F8EF7)" : "rgba(255,255,255,0.08)",
              color: "#fff"
            }}>{s.action}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 6 }}>{label}</div>
          <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, fontFamily: "'DM Serif Display', Georgia, serif" }}>{value}</div>
          {sub && <div style={{ color: color || "#00C9A7", fontSize: 12, marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 28 }}>{icon}</div>
      </div>
    </div>
  );
}

export default function SyncPro() {
  const [tab, setTab] = useState("dashboard");
  const [onboardStep, setOnboardStep] = useState(1);
  const [showOnboard, setShowOnboard] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchInventory, setSearchInventory] = useState("");
  const [channelList, setChannelList] = useState(channels);
  const [activeRange, setActiveRange] = useState("30Days");
  const [showConnectModal, setShowConnectModal] = useState(null);

  const toggleRow = (id) => setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filteredInventory = inventoryItems.filter(i =>
    i.name.toLowerCase().includes(searchInventory.toLowerCase()) ||
    i.sku.toLowerCase().includes(searchInventory.toLowerCase())
  );

  const connectChannel = (name) => {
    setChannelList(prev => prev.map(c => c.name === name ? { ...c, connected: true } : c));
    setShowConnectModal(null);
  };

  const navItems = ["dashboard", "products", "listings", "orders", "reports"];

  return (
    <div style={{ minHeight: "100vh", background: "#071015", color: "#fff", fontFamily: "'Outfit', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #071015; } ::-webkit-scrollbar-thumb { background: rgba(0,201,167,0.3); border-radius: 4px; }
        table { border-collapse: collapse; width: 100%; }
        th { color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 14px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
        td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        tr:hover td { background: rgba(255,255,255,0.02); }
        input[type=text]:focus { outline: none; }
        button:hover { opacity: 0.88; }
      `}</style>

      {/* Top Nav */}
      <nav style={{ background: "#0A1720", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px", display: "flex", alignItems: "center", height: 58, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 40 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #00C9A7, #4F8EF7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: 18, background: "linear-gradient(135deg, #00C9A7, #4F8EF7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SyncPro</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {navItems.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "6px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600,
              background: tab === t ? "rgba(0,201,167,0.12)" : "transparent",
              color: tab === t ? "#00C9A7" : "rgba(255,255,255,0.5)",
              textTransform: "capitalize", transition: "all 0.15s"
            }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <button style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 18 }}>⚙️</button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #00C9A7, #4F8EF7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>OB</div>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px" }}>

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div>
            {showOnboard && <OnboardingBanner step={onboardStep} setStep={setOnboardStep} dismiss={() => setShowOnboard(false)} />}

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <StatCard label="Total Sales" value="$28,492" sub="↑ 14.2% this month" icon="💰" color="#00C9A7" />
              <StatCard label="Total Orders" value="6,103" sub="↑ 9.8% vs last period" icon="🛒" color="#4F8EF7" />
              <StatCard label="Active Listings" value="10,116" sub="Across 2 channels" icon="📋" color="#F7B731" />
              <StatCard label="Low Stock SKUs" value="7" sub="Needs attention" icon="⚠️" color="#FC5C65" />
            </div>

            {/* Main Charts + Sidebar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 20 }}>
              {/* Sales Chart */}
              <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>Total Sales</div>
                    <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'DM Serif Display', Georgia, serif" }}>$28,492</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["1 Day", "7 Days", "30 Days"].map(r => (
                      <button key={r} onClick={() => setActiveRange(r.replace(" ", ""))} style={{
                        padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                        background: activeRange === r.replace(" ", "") ? "linear-gradient(135deg, #00C9A7, #4F8EF7)" : "rgba(255,255,255,0.07)",
                        color: "#fff"
                      }}>{r}</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1A2E40", border: "1px solid rgba(0,201,167,0.3)", borderRadius: 8, color: "#fff" }} />
                    <Line type="monotone" dataKey="sales" stroke="url(#lineGrad)" strokeWidth={2.5} dot={{ fill: "#00C9A7", r: 4 }} />
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00C9A7" /><stop offset="100%" stopColor="#4F8EF7" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Order Breakdown */}
              <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Total Orders</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 16, fontFamily: "'DM Serif Display', Georgia, serif" }}>6,103</div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={ordersByChannel} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {ordersByChannel.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1A2E40", border: "none", borderRadius: 8, color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {ordersByChannel.map((c, i) => (
                    <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i] }} />
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{c.name}</span>
                      </div>
                      <span style={{ color: COLORS[i], fontWeight: 700 }}>{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products + Right Panel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
              {/* Top Products */}
              <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>⭐ Top 5 Products</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["$ Sold", "# Sold"].map(r => (
                      <button key={r} style={{ padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: r === "$ Sold" ? "rgba(0,201,167,0.2)" : "rgba(255,255,255,0.06)", color: r === "$ Sold" ? "#00C9A7" : "rgba(255,255,255,0.5)" }}>{r}</button>
                    ))}
                  </div>
                </div>
                <table>
                  <thead><tr><th>Product</th><th>Channel</th><th># Sold</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{p.name}</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{p.sku}</div>
                        </td>
                        <td><span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.channel === "Etsy" ? "rgba(245,100,0,0.15)" : p.channel === "Both" ? "rgba(0,201,167,0.15)" : "rgba(150,191,72,0.15)", color: p.channel === "Etsy" ? "#F56400" : p.channel === "Both" ? "#00C9A7" : "#96BF48" }}>{p.channel}</span></td>
                        <td style={{ color: "rgba(255,255,255,0.7)" }}>{p.sold}</td>
                        <td style={{ color: "#00C9A7", fontWeight: 700 }}>${p.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Announcements + Resource Guide */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📢 Announcements</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {announcements.map((a, i) => (
                      <div key={i} style={{ borderLeft: "2px solid rgba(0,201,167,0.3)", paddingLeft: 12 }}>
                        <div style={{ fontSize: 11, color: "#00C9A7", marginBottom: 3 }}>{a.date}</div>
                        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{a.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>❓ Resource Guide</div>
                  {[["🎓", "Sync Pro Academy", "Training videos & tutorials"],["💡", "Help Center", "Answers to popular questions"],["📺", "Webinars", "Recorded sessions on key features"]].map(([icon, title, sub]) => (
                    <div key={title} style={{ display: "flex", gap: 10, marginBottom: 12, cursor: "pointer" }}>
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#4F8EF7" }}>{title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* To Do + Recent Activity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
              <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 24px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>✅ To Do</div>
                {[["Create your first listing", onboardStep >= 1], ["Enable inventory sync", onboardStep >= 2], ["Fulfill an order", onboardStep >= 3]].map(([label, done]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${done ? "#00C9A7" : "rgba(255,255,255,0.2)"}`, background: done ? "#00C9A7" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{done ? "✓" : ""}</div>
                      <span style={{ fontSize: 13.5, color: done ? "rgba(255,255,255,0.4)" : "#fff", textDecoration: done ? "line-through" : "none" }}>{label}</span>
                    </div>
                    {!done && <button onClick={() => setOnboardStep(prev => Math.min(prev + 1, 3))} style={{ padding: "5px 14px", borderRadius: 8, background: "linear-gradient(135deg, #00C9A7, #4F8EF7)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Start</button>}
                  </div>
                ))}
              </div>
              <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 24px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🕐 Recent Activity</div>
                {[
                  { time: "2m ago", text: "Order #4821 received from Etsy", icon: "🛒" },
                  { time: "14m ago", text: "Inventory synced across 2 channels", icon: "🔄" },
                  { time: "1h ago", text: "Listing 'Ceramic Mug Set' updated on Etsy", icon: "✏️" },
                  { time: "3h ago", text: "Shopify connection refreshed successfully", icon: "✅" },
                ].map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 16 }}>{a.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{a.text}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 4 }}>📦 Inventory</h1>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{filteredInventory.length} inventory SKUs found</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>⬆ Import from CSV</button>
                <button style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>🏢 Manage Locations</button>
                <button style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>⬇ Export</button>
              </div>
            </div>

            <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input value={searchInventory} onChange={e => setSearchInventory(e.target.value)}
                  placeholder="🔍  Search inventory by name or SKU..."
                  style={{ flex: 1, minWidth: 200, padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 13 }} />
                {selectedRows.length > 0 && (
                  <>
                    <button style={{ padding: "8px 14px", borderRadius: 8, background: "linear-gradient(135deg, #00C9A7, #4F8EF7)", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>✏️ Bulk Editor ({selectedRows.length})</button>
                    <button style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(252,92,101,0.15)", border: "1px solid rgba(252,92,101,0.3)", color: "#FC5C65", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>🗑 Delete</button>
                  </>
                )}
                <button style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13 }}>Add Tags</button>
                <button style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13 }}>Categorize</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}><input type="checkbox" onChange={e => setSelectedRows(e.target.checked ? filteredInventory.map(i => i.id) : [])} style={{ cursor: "pointer" }} /></th>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Condition</th>
                    <th>Location</th>
                    <th>Available</th>
                    <th>Reserved</th>
                    <th>On Hand</th>
                    <th>Price</th>
                    <th>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => (
                    <tr key={item.id}>
                      <td><input type="checkbox" checked={selectedRows.includes(item.id)} onChange={() => toggleRow(item.id)} style={{ cursor: "pointer" }} /></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{item.img}</div>
                          <span style={{ fontWeight: 600, color: "#fff" }}>{item.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontSize: 12 }}>{item.sku}</td>
                      <td><span style={{ padding: "2px 9px", borderRadius: 20, background: "rgba(0,201,167,0.1)", color: "#00C9A7", fontSize: 12, fontWeight: 600 }}>{item.condition}</span></td>
                      <td style={{ color: "rgba(255,255,255,0.6)" }}>{item.location}</td>
                      <td style={{ color: "#4F8EF7", fontWeight: 700 }}>{item.available}</td>
                      <td style={{ color: item.reserved > 0 ? "#F7B731" : "rgba(255,255,255,0.3)" }}>{item.reserved}</td>
                      <td style={{ color: "rgba(255,255,255,0.7)" }}>{item.onHand}</td>
                      <td style={{ color: "#00C9A7", fontWeight: 700 }}>${item.price.toFixed(2)}</td>
                      <td style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{item.modified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                <span>Showing 1–{filteredInventory.length} of {inventoryItems.length} Inventory SKUs</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {["First", "Prev", "1", "Next", "Last"].map(p => (
                    <button key={p} style={{ padding: "4px 10px", borderRadius: 6, background: p === "1" ? "rgba(0,201,167,0.15)" : "rgba(255,255,255,0.05)", border: "none", color: p === "1" ? "#00C9A7" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LISTINGS TAB */}
        {tab === "listings" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 6 }}>🔗 Connect a New Sales Channel</h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Add marketplaces and shopping carts to sync your inventory and listings automatically.</p>
            </div>

            {/* Connected Channels */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Connected Channels</div>
              <div style={{ display: "flex", gap: 14 }}>
                {channelList.filter(c => c.connected).map(c => (
                  <div key={c.name} style={{ background: "#0D1F2D", border: "1px solid rgba(0,201,167,0.25)", borderRadius: 14, padding: "16px 20px", minWidth: 180 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{c.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C9A7" }} />
                      <span style={{ fontSize: 12, color: "#00C9A7" }}>Connected & Syncing</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketplaces */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Marketplaces</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {channelList.filter(c => !c.connected).map(c => (
                  <div key={c.name} style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
                    <span style={{ fontSize: 36 }}>{c.icon}</span>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, flex: 1 }}>{c.desc}</div>
                    <button onClick={() => setShowConnectModal(c.name)} style={{
                      width: "100%", padding: "9px 0", borderRadius: 8, border: "none",
                      background: "linear-gradient(135deg, #00C9A7, #4F8EF7)",
                      color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13
                    }}>Connect</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🛒</div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, marginBottom: 8 }}>No orders yet</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Orders from all your connected channels will appear here once you start selling.</p>
            <button onClick={() => setTab("listings")} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 8, background: "linear-gradient(135deg, #00C9A7, #4F8EF7)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Connect a Channel</button>
          </div>
        )}

        {/* REPORTS TAB */}
        {tab === "reports" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 24 }}>📊 Reports</h1>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Sales Reports</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {[["Sales by Time Period", "View your sales for each channel by time period.", "📅"], ["Sales by SKU", "View your sales by SKU on each channel during a specified time period.", "🏷️"]].map(([title, desc, icon]) => (
                  <div key={title} style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px", display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,201,167,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{title}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Inventory Reports</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {[["Low Stock Report", "View a list of inventory SKUs that are low in stock for reordering purposes.", "⚠️"], ["Inventory Valuation", "Total estimated value of your current inventory across all warehouses.", "💰"]].map(([title, desc, icon]) => (
                  <div key={title} style={{ background: "#0D1F2D", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px", display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(79,142,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{title}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={() => setShowConnectModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0D1F2D", border: "1px solid rgba(0,201,167,0.2)", borderRadius: 20, padding: "36px", width: 400, textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{channelList.find(c => c.name === showConnectModal)?.icon}</div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, marginBottom: 8 }}>Connect {showConnectModal}</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>You'll be redirected to {showConnectModal} to authorize Sync Pro to access your account and sync listings, inventory, and orders.</p>
            <button onClick={() => connectChannel(showConnectModal)} style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: "linear-gradient(135deg, #00C9A7, #4F8EF7)", border: "none", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 10 }}>Authorize & Connect</button>
            <button onClick={() => setShowConnectModal(null)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      )}

      <ChatBot />
    </div>
  );
}
