import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   DOCFLOW AI — Complete Platform
   Auth · Dashboard · Doc Generator · Resume Analyzer
   ═══════════════════════════════════════════════════════════ */

// ── Design tokens ──────────────────────────────────────────
const T = {
  bg:       "#07070a",
  bg1:      "#0d0d12",
  bg2:      "#13131a",
  bg3:      "#1a1a24",
  border:   "#1e1e2e",
  border2:  "#2a2a3e",
  text:     "#e2e2f0",
  muted:    "#6b6b8a",
  faint:    "#2a2a3e",
  violet:   "#8b5cf6",
  violet2:  "#a78bfa",
  cyan:     "#22d3ee",
  emerald:  "#10b981",
  amber:    "#f59e0b",
  rose:     "#f43f5e",
  blue:     "#3b82f6",
};

const FONT = "'IBM Plex Mono', 'Fira Code', monospace";

// ── Fake AI call using Anthropic API ───────────────────────
async function callAI(prompt, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Error generating response.";
}

// ── Shared UI primitives ────────────────────────────────────
const css = (obj) => Object.entries(obj).map(([k,v]) => `${k.replace(/([A-Z])/g,'-$1').toLowerCase()}:${v}`).join(';');

function Spinner({ size = 16, color = T.violet }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid ${color}30`,
      borderTop: `2px solid ${color}`, borderRadius: "50%",
      animation: "spin 0.7s linear infinite", display: "inline-block",
    }} />
  );
}

function Tag({ children, color = T.violet }) {
  return (
    <span style={{
      fontSize: 9, padding: "2px 7px", borderRadius: 4,
      background: color + "20", color, fontWeight: 700,
      letterSpacing: "0.06em", fontFamily: FONT,
    }}>{children}</span>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, style = {} }) {
  const base = {
    fontFamily: FONT, fontSize: 12, padding: "9px 20px",
    borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600, letterSpacing: "0.04em", transition: "all 0.2s",
    opacity: disabled ? 0.5 : 1, ...style,
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${T.violet}, ${T.blue})`, color: "#fff" },
    ghost:   { background: "transparent", color: T.muted, border: `1px solid ${T.border}` },
    danger:  { background: T.rose + "20", color: T.rose, border: `1px solid ${T.rose}40` },
    success: { background: T.emerald + "20", color: T.emerald, border: `1px solid ${T.emerald}40` },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, letterSpacing: "0.05em" }}>{label}</div>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>{icon}</span>}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: T.bg2, border: `1px solid ${focused ? T.violet + "60" : T.border}`,
            borderRadius: 8, color: T.text, fontSize: 13, fontFamily: FONT,
            padding: icon ? "10px 12px 10px 36px" : "10px 14px",
            outline: "none", transition: "border 0.2s",
          }}
        />
      </div>
    </div>
  );
}

function Card({ children, style = {}, glow }) {
  return (
    <div style={{
      background: T.bg1, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: 20,
      boxShadow: glow ? `0 0 30px ${T.violet}15` : "none",
      ...style,
    }}>{children}</div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, color: T.muted, letterSpacing: "0.12em",
      textTransform: "uppercase", marginBottom: 14, fontFamily: FONT,
    }}>{children}</div>
  );
}

// ── Toast system ────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: T.bg2, border: `1px solid ${t.type === "success" ? T.emerald : t.type === "error" ? T.rose : T.violet}40`,
          borderRadius: 8, padding: "10px 16px", fontSize: 12, color: T.text,
          fontFamily: FONT, animation: "fadeIn 0.3s ease",
          display: "flex", alignItems: "center", gap: 8, minWidth: 240,
        }}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : "◈"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = (msg, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return { toasts, push };
}

// ══════════════════════════════════════════════════════════════
//  1. AUTH PAGES
// ══════════════════════════════════════════════════════════════
function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: "100vh", background: T.bg, display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: FONT,
      position: "relative", overflow: "hidden",
    }}>
      {/* Grid background */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${T.violet} 1px, transparent 1px), linear-gradient(90deg, ${T.violet} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />
      {/* Glow orb */}
      <div style={{
        position: "absolute", width: 400, height: 400,
        background: `radial-gradient(circle, ${T.violet}20 0%, transparent 70%)`,
        top: "10%", left: "50%", transform: "translateX(-50%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "6px 14px", borderRadius: 8,
            border: `1px solid ${T.border}`, background: T.bg1,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: `linear-gradient(135deg, ${T.violet}, ${T.blue})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12,
            }}>⬡</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "0.06em" }}>DOCFLOW AI</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginPage({ onLogin, onGo }) {
  const [email, setEmail] = useState("demo@docflow.ai");
  const [pass, setPass] = useState("password");
  const [loading, setLoading] = useState(false);
  const { toasts, push } = useToast();

  const submit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    push("Login successful. Welcome back.", "success");
    setTimeout(() => onLogin({ email, name: "Alex Kumar", plan: "Pro" }), 500);
  };

  return (
    <AuthLayout>
      <Toast toasts={toasts} />
      <Card glow>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 6 }}>Sign in</div>
          <div style={{ fontSize: 12, color: T.muted }}>to DocFlow AI Platform</div>
        </div>

        {/* Google OAuth button */}
        <button onClick={() => { push("Google OAuth — wiring to backend", "info"); }} style={{
          width: "100%", background: T.bg2, border: `1px solid ${T.border}`,
          borderRadius: 8, color: T.text, fontSize: 12, fontFamily: FONT,
          padding: "10px", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, marginBottom: 16, fontWeight: 600,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ fontSize: 10, color: T.muted }}>OR</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        <Input label="EMAIL" icon="✉" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="PASSWORD" type="password" icon="◉" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} />

        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: T.violet, cursor: "pointer" }} onClick={() => onGo("forgot")}>
            Forgot password?
          </span>
        </div>

        <Btn onClick={submit} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? <><Spinner size={13} /> &nbsp;Authenticating...</> : "Sign in →"}
        </Btn>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.muted }}>
          No account?{" "}
          <span style={{ color: T.violet, cursor: "pointer" }} onClick={() => onGo("signup")}>Create one free</span>
        </div>
      </Card>
    </AuthLayout>
  );
}

function SignupPage({ onLogin, onGo }) {
  const [form, setForm] = useState({ name: "", email: "", pass: "" });
  const [loading, setLoading] = useState(false);
  const { toasts, push } = useToast();

  const submit = async () => {
    if (!form.name || !form.email || !form.pass) { push("All fields required", "error"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    push("Account created! Welcome to DocFlow.", "success");
    setTimeout(() => onLogin({ email: form.email, name: form.name, plan: "Free" }), 600);
  };

  return (
    <AuthLayout>
      <Toast toasts={toasts} />
      <Card glow>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 6 }}>Create account</div>
          <div style={{ fontSize: 12, color: T.muted }}>Start free — no credit card needed</div>
        </div>
        <Input label="FULL NAME" icon="◈" placeholder="Alex Kumar" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
        <Input label="EMAIL" icon="✉" placeholder="you@company.com" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
        <Input label="PASSWORD" type="password" icon="◉" placeholder="min 8 characters" value={form.pass} onChange={e => setForm(p => ({...p, pass: e.target.value}))} />
        <Btn onClick={submit} disabled={loading} style={{ width: "100%", marginTop: 4 }}>
          {loading ? <><Spinner size={13}/> &nbsp;Creating...</> : "Create account →"}
        </Btn>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.muted }}>
          Have an account?{" "}
          <span style={{ color: T.violet, cursor: "pointer" }} onClick={() => onGo("login")}>Sign in</span>
        </div>
      </Card>
    </AuthLayout>
  );
}

function ForgotPage({ onGo }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <AuthLayout>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 6 }}>Reset password</div>
          <div style={{ fontSize: 12, color: T.muted }}>We'll send a reset link to your email</div>
        </div>
        {sent ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉</div>
            <div style={{ fontSize: 13, color: T.emerald, marginBottom: 6 }}>Reset link sent!</div>
            <div style={{ fontSize: 11, color: T.muted }}>Check {email}</div>
          </div>
        ) : (
          <>
            <Input label="EMAIL" icon="✉" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <Btn onClick={async () => { setLoading(true); await new Promise(r=>setTimeout(r,1000)); setLoading(false); setSent(true); }} disabled={loading || !email} style={{ width: "100%" }}>
              {loading ? <Spinner size={13}/> : "Send reset link"}
            </Btn>
          </>
        )}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ fontSize: 11, color: T.violet, cursor: "pointer" }} onClick={() => onGo("login")}>← Back to login</span>
        </div>
      </Card>
    </AuthLayout>
  );
}

// ══════════════════════════════════════════════════════════════
//  2. DASHBOARD SHELL
// ══════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { id: "home",     icon: "⬡", label: "Dashboard" },
  { id: "docs",     icon: "◈", label: "Doc Generator" },
  { id: "resume",   icon: "◉", label: "Resume Analyzer" },
  { id: "ppt",      icon: "▣", label: "Presentations" },
  { id: "notes",    icon: "◎", label: "Notes & Study" },
  { id: "content",  icon: "◆", label: "Content AI" },
  { id: "settings", icon: "⬤", label: "Settings" },
];

const QUICK_STATS = [
  { label: "Docs Created",   value: "47",    delta: "+8 this week",  color: T.violet },
  { label: "AI Tokens Used", value: "124K",  delta: "876K remaining", color: T.cyan },
  { label: "Exports",        value: "31",    delta: "PDF · DOCX · PPTX", color: T.emerald },
  { label: "ATS Score",      value: "87%",   delta: "+12 from last", color: T.amber },
];

function MiniBar({ vals, color }) {
  const max = Math.max(...vals);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32, marginTop: 8 }}>
      {vals.map((v, i) => (
        <div key={i} style={{
          flex: 1, height: `${(v / max) * 100}%`,
          background: color, opacity: 0.15 + (i / vals.length) * 0.85,
          borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

function DashboardHome({ user }) {
  const chartData = [42, 65, 38, 80, 71, 90, 55, 88, 76, 95, 82, 100];
  const recentDocs = [
    { name: "Q3 Internship Report", type: "DOCX", model: "Claude",  time: "5m ago",  status: T.emerald },
    { name: "FullStack Dev Resume",  type: "PDF",  model: "GPT-4",   time: "1h ago",  status: T.emerald },
    { name: "Startup Pitch Deck",    type: "PPTX", model: "Gemini",  time: "3h ago",  status: T.emerald },
    { name: "ML Research Notes",     type: "PDF",  model: "Claude",  time: "1d ago",  status: T.emerald },
    { name: "API Documentation",     type: "DOCX", model: "Claude",  time: "2d ago",  status: T.emerald },
  ];
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
          Good morning, {user.name.split(" ")[0]} ◈
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          &nbsp;·&nbsp;
          <span style={{ color: T.violet }}>{user.plan} Plan</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {QUICK_STATS.map(s => (
          <Card key={s.label} style={{ padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: s.color, marginTop: 4 }}>{s.delta}</div>
            <MiniBar vals={chartData} color={s.color} />
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
        {/* Recent docs */}
        <Card>
          <SectionTitle>Recent Documents</SectionTitle>
          {recentDocs.map((d, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 0", borderBottom: i < recentDocs.length - 1 ? `1px solid ${T.faint}` : "none",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.status, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 12, color: T.text, minWidth: 0 }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
              </div>
              <Tag color={T.violet}>{d.type}</Tag>
              <Tag color={T.muted}>{d.model}</Tag>
              <span style={{ fontSize: 10, color: T.muted, whiteSpace: "nowrap" }}>{d.time}</span>
            </div>
          ))}
        </Card>

        {/* AI Usage */}
        <Card>
          <SectionTitle>AI Model Usage</SectionTitle>
          {[
            { model: "Claude 3.5", pct: 52, color: T.violet },
            { model: "GPT-4o",     pct: 31, color: T.blue },
            { model: "Gemini Pro", pct: 17, color: T.cyan },
          ].map(m => (
            <div key={m.model} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 5 }}>
                <span>{m.model}</span><span style={{ color: m.color }}>{m.pct}%</span>
              </div>
              <div style={{ height: 4, background: T.faint, borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${m.pct}%`, background: m.color, borderRadius: 2, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: "10px 12px", background: T.bg2, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Monthly token budget</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.text, marginBottom: 6 }}>
              <span>124,832 used</span><span style={{ color: T.muted }}>1,000,000 total</span>
            </div>
            <div style={{ height: 5, background: T.faint, borderRadius: 3 }}>
              <div style={{ height: "100%", width: "12.5%", background: `linear-gradient(90deg, ${T.violet}, ${T.cyan})`, borderRadius: 3 }} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  3. AI DOCUMENT GENERATOR
// ══════════════════════════════════════════════════════════════
const DOC_TEMPLATES = [
  { id: "internship",  label: "Internship Report",      icon: "◈", desc: "6-week internship documentation with achievements" },
  { id: "project",     label: "Project Report",          icon: "▣", desc: "Technical project report with methodology" },
  { id: "research",    label: "Research Documentation",  icon: "◎", desc: "Academic research with citations" },
  { id: "api",         label: "API Documentation",       icon: "⬡", desc: "Complete REST API docs with endpoints" },
  { id: "business",    label: "Business Proposal",       icon: "◆", desc: "Executive summary + business case" },
  { id: "technical",   label: "Technical Specification", icon: "⬟", desc: "SRS / TDD / System design doc" },
];

const DOC_TYPES = ["Project Report", "Internship Report", "API Docs", "Research Paper", "Business Proposal", "Technical Spec"];
const AI_MODELS = ["Claude 3.5 Sonnet", "GPT-4o", "Gemini Pro"];
const EXPORT_TYPES = ["PDF", "DOCX", "PPTX"];

function DocGenerator() {
  const [step, setStep] = useState(1); // 1=template, 2=configure, 3=generate, 4=done
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState({ title: "", company: "", duration: "", model: "Claude 3.5 Sonnet", details: "" });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState("");
  const [selectedExport, setSelectedExport] = useState("PDF");
  const { toasts, push } = useToast();

  const generate = async () => {
    if (!form.title) { push("Enter a document title", "error"); return; }
    setStep(3);
    setGenerating(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => setProgress(p => Math.min(p + Math.random() * 15, 90)), 400);

    const prompt = `Generate a professional ${selectedTemplate?.label || "document"} titled "${form.title}".
${form.company ? `Company/Organization: ${form.company}` : ""}
${form.duration ? `Duration: ${form.duration}` : ""}
${form.details ? `Additional context: ${form.details}` : ""}

Create a complete, professional document with proper sections, headings, and detailed content.`;

    try {
      const result = await callAI(prompt,
        "You are a professional technical writer. Generate well-structured, professional documents. Format with clear sections using markdown. Be detailed and specific. Create content that looks genuinely professional and complete."
      );
      clearInterval(interval);
      setProgress(100);
      setOutput(result);
      setStep(4);
      push("Document generated successfully!", "success");
    } catch {
      clearInterval(interval);
      push("Generation failed. Check API key.", "error");
      setStep(2);
    }
    setGenerating(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>◈ AI Document Generator</div>
        <div style={{ fontSize: 12, color: T.muted }}>Generate professional documents in seconds using AI</div>
      </div>
      <Toast toasts={toasts} />

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
        {["Template", "Configure", "Generate", "Export"].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
              background: step > i + 1 ? T.emerald : step === i + 1 ? T.violet : T.bg2,
              color: step >= i + 1 ? "#fff" : T.muted,
              border: `1px solid ${step >= i + 1 ? "transparent" : T.border}`,
            }}>{step > i + 1 ? "✓" : i + 1}</div>
            <div style={{ fontSize: 11, color: step === i + 1 ? T.text : T.muted, marginLeft: 6, marginRight: 16 }}>{s}</div>
            {i < 3 && <div style={{ width: 24, height: 1, background: step > i + 1 ? T.emerald : T.border, marginRight: 16 }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Template */}
      {step === 1 && (
        <div>
          <SectionTitle>Choose a Template</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {DOC_TEMPLATES.map(t => (
              <div key={t.id} onClick={() => { setSelectedTemplate(t); setStep(2); }}
                style={{
                  background: selectedTemplate?.id === t.id ? T.violet + "15" : T.bg1,
                  border: `1px solid ${selectedTemplate?.id === t.id ? T.violet + "50" : T.border}`,
                  borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
                }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn variant="ghost" onClick={() => { setSelectedTemplate({ id: "custom", label: "Custom Document", icon: "⬟" }); setStep(2); }}>
              + Start from scratch
            </Btn>
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>{selectedTemplate?.icon}</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{selectedTemplate?.label}</div>
            <Btn variant="ghost" style={{ padding: "4px 10px", fontSize: 10, marginLeft: "auto" }} onClick={() => setStep(1)}>
              ← Change
            </Btn>
          </div>
          <Input label="DOCUMENT TITLE *" placeholder="e.g. Internship Report — SDE at Flipkart" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
          <Input label="COMPANY / ORGANIZATION" placeholder="e.g. Flipkart, IIT Delhi, My Startup" value={form.company} onChange={e => setForm(p => ({...p, company: e.target.value}))} />
          <Input label="DURATION / PERIOD" placeholder="e.g. June–August 2025, 6 weeks" value={form.duration} onChange={e => setForm(p => ({...p, duration: e.target.value}))} />

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, letterSpacing: "0.05em" }}>AI MODEL</div>
            <div style={{ display: "flex", gap: 6 }}>
              {AI_MODELS.map(m => (
                <button key={m} onClick={() => setForm(p => ({...p, model: m}))} style={{
                  padding: "6px 12px", borderRadius: 6, fontFamily: FONT, fontSize: 11, cursor: "pointer",
                  background: form.model === m ? T.violet + "20" : T.bg2,
                  border: `1px solid ${form.model === m ? T.violet + "50" : T.border}`,
                  color: form.model === m ? T.violet2 : T.muted,
                }}>{m}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, letterSpacing: "0.05em" }}>ADDITIONAL DETAILS</div>
            <textarea
              value={form.details} onChange={e => setForm(p => ({...p, details: e.target.value}))}
              placeholder="Add any specific topics, technologies, achievements, or requirements..."
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box", background: T.bg2,
                border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
                fontSize: 12, fontFamily: FONT, padding: "10px 14px", outline: "none", resize: "none",
              }}
            />
          </div>
          <Btn onClick={generate} style={{ marginRight: 8 }}>⬡ Generate Document</Btn>
          <Btn variant="ghost" onClick={() => setStep(1)}>Back</Btn>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === 3 && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <Spinner size={32} />
          <div style={{ fontSize: 14, color: T.text, marginTop: 20, marginBottom: 8 }}>
            {form.model} is crafting your document...
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 24 }}>This takes 10–30 seconds</div>
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
            <div style={{ height: 4, background: T.faint, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progress}%`,
                background: `linear-gradient(90deg, ${T.violet}, ${T.cyan})`,
                borderRadius: 2, transition: "width 0.4s ease",
              }} />
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 8 }}>{Math.round(progress)}%</div>
          </div>
        </Card>
      )}

      {/* Step 4: Result */}
      {step === 4 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.emerald }}>✓ Document Ready</div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {EXPORT_TYPES.map(e => (
                <button key={e} onClick={() => { setSelectedExport(e); push(`Exporting as ${e}...`, "info"); }} style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 11, fontFamily: FONT, cursor: "pointer",
                  background: selectedExport === e ? T.violet + "20" : T.bg2,
                  border: `1px solid ${selectedExport === e ? T.violet + "50" : T.border}`,
                  color: selectedExport === e ? T.violet2 : T.muted,
                }}>{e}</button>
              ))}
              <Btn style={{ padding: "5px 14px" }} onClick={() => push(`Downloaded as ${selectedExport}!`, "success")}>
                ↓ Export {selectedExport}
              </Btn>
            </div>
          </div>
          <Card style={{ maxHeight: 420, overflowY: "auto" }}>
            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{output}</div>
          </Card>
          <div style={{ marginTop: 12 }}>
            <Btn variant="ghost" onClick={() => { setStep(1); setOutput(""); setProgress(0); }}>
              + Generate Another
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  4. RESUME ANALYZER
// ══════════════════════════════════════════════════════════════
function ResumeAnalyzer() {
  const [stage, setStage] = useState("upload"); // upload | analyzing | results
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("score");
  const { toasts, push } = useToast();
  const fileRef = useRef();

  const analyze = async () => {
    if (!resumeText.trim()) { push("Paste your resume text first", "error"); return; }
    setStage("analyzing");
    setAnalyzing(true);

    const prompt = `Analyze this resume and provide detailed feedback. Resume text:
---
${resumeText}
---
${jobDesc ? `Target job description:\n${jobDesc}\n---` : ""}

Return ONLY valid JSON with this exact structure:
{
  "ats_score": <number 0-100>,
  "overall_rating": "<Excellent|Good|Fair|Needs Work>",
  "sections": {
    "formatting": <number 0-100>,
    "keywords": <number 0-100>,
    "experience": <number 0-100>,
    "skills": <number 0-100>,
    "education": <number 0-100>
  },
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<improvement1>", "<improvement2>", "<improvement3>", "<improvement4>"],
  "missing_keywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"],
  "hr_feedback": "<2-3 sentence HR perspective on this resume>",
  "rewrite_tip": "<one specific high-impact rewrite suggestion>"
}`;

    try {
      const raw = await callAI(prompt,
        "You are a senior HR professional and ATS expert with 15 years of recruiting experience. Analyze resumes critically and objectively. Return ONLY valid JSON, no markdown, no explanation."
      );
      const clean = raw.replace(/```json|```/g, "").trim();
      const data = JSON.parse(clean);
      setResults(data);
      setStage("results");
      push("Analysis complete!", "success");
    } catch {
      push("Analysis failed. Try pasting resume text.", "error");
      setStage("upload");
    }
    setAnalyzing(false);
  };

  const scoreColor = (score) => {
    if (score >= 80) return T.emerald;
    if (score >= 60) return T.amber;
    return T.rose;
  };

  const ArcGauge = ({ score }) => {
    const color = scoreColor(score);
    const r = 54, cx = 64, cy = 64;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ * 0.75;
    return (
      <svg width="128" height="100" viewBox="0 0 128 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.faint} strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round"
          transform="rotate(135, 64, 64)" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(135, 64, 64)"
          style={{ transition: "stroke-dasharray 1s ease" }} />
        <text x="64" y="66" textAnchor="middle" fill={color} fontSize="22" fontWeight="700" fontFamily={FONT}>{score}</text>
        <text x="64" y="80" textAnchor="middle" fill={T.muted} fontSize="9" fontFamily={FONT}>ATS SCORE</text>
      </svg>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>◉ Resume Analyzer</div>
        <div style={{ fontSize: 12, color: T.muted }}>ATS scoring · AI feedback · Skill gap analysis · HR simulation</div>
      </div>
      <Toast toasts={toasts} />

      {stage === "upload" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <SectionTitle>Resume Text *</SectionTitle>
            {/* File upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${T.border2}`, borderRadius: 10, padding: "20px",
                textAlign: "center", cursor: "pointer", marginBottom: 12,
                transition: "border 0.2s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>⬆</div>
              <div style={{ fontSize: 12, color: T.muted }}>Drop PDF/DOCX or click to upload</div>
              <div style={{ fontSize: 10, color: T.faint, marginTop: 4 }}>or paste text below</div>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }}
                onChange={() => push("File uploaded! For demo, paste text below.", "info")} />
            </div>
            <textarea
              value={resumeText} onChange={e => setResumeText(e.target.value)}
              placeholder={`Paste your resume text here...\n\nExample:\nJohn Doe\njohn@email.com | +91-9876543210\n\nSKILLS\nReact, Node.js, Python, AWS, PostgreSQL\n\nEXPERIENCE\nSDE Intern — Google (June 2025 – Aug 2025)\n• Built real-time dashboard reducing load time by 40%\n• Implemented ML pipeline processing 1M+ records/day\n\nEDUCATION\nB.Tech Computer Science — IIT Delhi (2022–2026) | GPA: 8.9/10`}
              rows={12}
              style={{
                width: "100%", boxSizing: "border-box", background: T.bg2,
                border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
                fontSize: 11, fontFamily: FONT, padding: "10px 14px", outline: "none", resize: "vertical",
              }}
            />
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <SectionTitle>Target Job Description (Optional)</SectionTitle>
              <textarea
                value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                placeholder="Paste the job description to get role-specific keyword analysis and ATS matching..."
                rows={6}
                style={{
                  width: "100%", boxSizing: "border-box", background: T.bg2,
                  border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
                  fontSize: 11, fontFamily: FONT, padding: "10px 14px", outline: "none", resize: "none",
                }}
              />
            </Card>
            <Card>
              <SectionTitle>What You'll Get</SectionTitle>
              {[
                [T.violet,  "ATS compatibility score (0–100)"],
                [T.cyan,    "Section-by-section breakdown"],
                [T.emerald, "Specific improvement suggestions"],
                [T.amber,   "Missing keywords analysis"],
                [T.blue,    "HR perspective simulation"],
                [T.rose,    "High-impact rewrite tips"],
              ].map(([color, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 11, color: T.muted }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </Card>
            <Btn onClick={analyze} disabled={!resumeText.trim()} style={{ width: "100%" }}>
              ◉ Analyze Resume
            </Btn>
          </div>
        </div>
      )}

      {stage === "analyzing" && (
        <Card style={{ textAlign: "center", padding: 56 }}>
          <Spinner size={36} />
          <div style={{ fontSize: 14, color: T.text, marginTop: 24, marginBottom: 8 }}>Analyzing your resume...</div>
          <div style={{ fontSize: 11, color: T.muted }}>Running ATS check · Keyword analysis · HR simulation</div>
        </Card>
      )}

      {stage === "results" && results && (
        <div>
          {/* Top summary */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, marginBottom: 16 }}>
            <Card style={{ textAlign: "center", padding: "16px 24px" }}>
              <ArcGauge score={results.ats_score} />
              <div style={{
                fontSize: 11, fontWeight: 700, color: scoreColor(results.ats_score),
                marginTop: 4, letterSpacing: "0.06em",
              }}>{results.overall_rating}</div>
            </Card>
            <Card>
              <SectionTitle>Section Scores</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {Object.entries(results.sections || {}).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginBottom: 4 }}>
                      <span style={{ textTransform: "capitalize" }}>{key}</span>
                      <span style={{ color: scoreColor(val) }}>{val}/100</span>
                    </div>
                    <div style={{ height: 4, background: T.faint, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${val}%`, background: scoreColor(val), borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14, borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>
            {["score", "improve", "keywords", "hr"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: "5px 14px", borderRadius: 6, fontSize: 11, fontFamily: FONT, cursor: "pointer",
                background: activeTab === t ? T.bg2 : "transparent",
                border: `1px solid ${activeTab === t ? T.border2 : "transparent"}`,
                color: activeTab === t ? T.text : T.muted,
              }}>
                {{ score: "Strengths", improve: "Improvements", keywords: "Keywords", hr: "HR Feedback" }[t]}
              </button>
            ))}
            <Btn variant="ghost" style={{ marginLeft: "auto", padding: "4px 12px", fontSize: 10 }}
              onClick={() => { setStage("upload"); setResults(null); }}>
              ← Analyze Another
            </Btn>
          </div>

          {activeTab === "score" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Card>
                <SectionTitle>✓ Strengths</SectionTitle>
                {(results.strengths || []).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 12, color: T.text, borderBottom: `1px solid ${T.faint}` }}>
                    <span style={{ color: T.emerald, flexShrink: 0 }}>✓</span> {s}
                  </div>
                ))}
              </Card>
              <Card>
                <SectionTitle>High-Impact Tip</SectionTitle>
                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7, padding: "8px 10px", background: T.violet + "12", borderRadius: 8, border: `1px solid ${T.violet}25` }}>
                  {results.rewrite_tip}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "improve" && (
            <Card>
              <SectionTitle>Improvement Actions</SectionTitle>
              {(results.improvements || []).map((imp, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.faint}` }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", background: T.amber + "20",
                    color: T.amber, fontSize: 10, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>{imp}</div>
                </div>
              ))}
            </Card>
          )}

          {activeTab === "keywords" && (
            <Card>
              <SectionTitle>Missing Keywords (Add These)</SectionTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {(results.missing_keywords || []).map(k => (
                  <span key={k} style={{
                    padding: "5px 12px", borderRadius: 6,
                    background: T.rose + "15", color: T.rose,
                    border: `1px solid ${T.rose}30`, fontSize: 11, fontFamily: FONT,
                  }}>{k}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.muted, padding: "8px 12px", background: T.bg2, borderRadius: 6 }}>
                💡 Add these keywords naturally in your skills section, experience bullets, or summary to improve ATS matching.
              </div>
            </Card>
          )}

          {activeTab === "hr" && (
            <Card>
              <SectionTitle>HR Professional Perspective</SectionTitle>
              <div style={{
                fontSize: 13, color: T.text, lineHeight: 1.8,
                padding: "16px", background: T.bg2, borderRadius: 8,
                borderLeft: `3px solid ${T.cyan}`, marginBottom: 12,
              }}>
                "{results.hr_feedback}"
              </div>
              <div style={{ fontSize: 10, color: T.muted }}>
                — Simulated by AI based on 15+ years of recruiting patterns
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  5. SETTINGS PAGE
// ══════════════════════════════════════════════════════════════
function Settings({ user, onLogout }) {
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 24 }}>⬤ Settings</div>
      <Card style={{ marginBottom: 12 }}>
        <SectionTitle>Profile</SectionTitle>
        <Input label="FULL NAME" value={user.name} onChange={() => {}} />
        <Input label="EMAIL" value={user.email} onChange={() => {}} />
        <Tag color={T.violet}>{user.plan} Plan</Tag>
      </Card>
      <Card style={{ marginBottom: 12 }}>
        <SectionTitle>AI Models</SectionTitle>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>Default model for generation</div>
        {AI_MODELS.map(m => (
          <div key={m} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.faint}` }}>
            <span style={{ fontSize: 12, color: T.text }}>{m}</span>
            <Tag color={m.includes("Claude") ? T.violet : m.includes("GPT") ? T.blue : T.cyan}>
              {m.includes("Claude") ? "DEFAULT" : "AVAILABLE"}
            </Tag>
          </div>
        ))}
      </Card>
      <Btn variant="danger" onClick={onLogout}>Sign out</Btn>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PLACEHOLDER FOR OTHER PAGES
// ══════════════════════════════════════════════════════════════
function ComingSoon({ title, icon }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 24 }}>This module is built and ready to wire up.</div>
      <Tag color={T.violet}>Sprint 2</Tag>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD SHELL
// ══════════════════════════════════════════════════════════════
function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState("home");

  const pages = {
    home:     <DashboardHome user={user} />,
    docs:     <DocGenerator />,
    resume:   <ResumeAnalyzer />,
    ppt:      <ComingSoon title="PPT Generator" icon="▣" />,
    notes:    <ComingSoon title="Notes & Study AI" icon="◎" />,
    content:  <ComingSoon title="Content Assistant" icon="◆" />,
    settings: <Settings user={user} onLogout={onLogout} />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: FONT, overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{
        width: 210, background: T.bg1, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", padding: "16px 10px", flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", marginBottom: 24 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: `linear-gradient(135deg, ${T.violet}, ${T.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
          }}>⬡</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: "0.05em" }}>DOCFLOW AI</span>
        </div>

        {/* Nav */}
        <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.1em", padding: "0 8px", marginBottom: 6 }}>WORKSPACE</div>
        {NAV_ITEMS.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
            borderRadius: 7, border: "none", width: "100%", textAlign: "left",
            background: page === n.id ? T.bg2 : "transparent",
            color: page === n.id ? T.text : T.muted,
            cursor: "pointer", fontSize: 12, fontFamily: FONT,
            marginBottom: 2, transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{n.icon}</span>
            {n.label}
            {page === n.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.violet, marginLeft: "auto" }} />}
          </button>
        ))}

        {/* Bottom — user */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ padding: "0 8px", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.08em", marginBottom: 5 }}>TOKEN USAGE</div>
            <div style={{ height: 4, background: T.faint, borderRadius: 2 }}>
              <div style={{ height: "100%", width: "12%", background: `linear-gradient(90deg, ${T.violet}, ${T.cyan})`, borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 4 }}>124K / 1M</div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
            borderRadius: 8, background: T.bg2,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.violet}, ${T.blue})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>{user.name[0]}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 9, color: T.violet }}>{user.plan}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        {pages[page]}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ROOT APP — Router
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [route, setRoute] = useState("login");
  const [user, setUser] = useState(null);

  const handleLogin = (u) => { setUser(u); setRoute("dashboard"); };
  const handleLogout = () => { setUser(null); setRoute("login"); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${T.bg}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 2px; }
        textarea::placeholder, input::placeholder { color: ${T.muted}; opacity: 0.5; }
      `}</style>

      {route === "login"    && <LoginPage onLogin={handleLogin} onGo={setRoute} />}
      {route === "signup"   && <SignupPage onLogin={handleLogin} onGo={setRoute} />}
      {route === "forgot"   && <ForgotPage onGo={setRoute} />}
      {route === "dashboard" && user && <Dashboard user={user} onLogout={handleLogout} />}
    </>
  );
}
