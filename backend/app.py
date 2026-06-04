import streamlit as st
import os
from groq import Groq

st.set_page_config(page_title="DocFlow AI", page_icon="⬡", layout="wide")

if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "user" not in st.session_state:
    st.session_state.user = {}
if "page" not in st.session_state:
    st.session_state.page = "🏠 Dashboard"

def call_ai(prompt: str, system_prompt: str) -> str:
    api_key = st.secrets.get("GROQ_API_KEY", os.getenv("GROQ_API_KEY", ""))
    if not api_key:
        raise ValueError("GROQ_API_KEY not set.")
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

def login_page():
    col1, col2, col3 = st.columns([1,2,1])
    with col2:
        st.markdown("""<div style="text-align:center;padding:40px 0 20px 0;">
            <h1 style="font-size:3em;">⬡</h1><h2>DOCFLOW AI</h2>
            <p style="color:#94a3b8;">AI-Powered Document Intelligence Platform</p>
        </div>""", unsafe_allow_html=True)
        email = st.text_input("Email", value="demo@docflow.ai")
        password = st.text_input("Password", type="password", placeholder="Enter any password")
        if st.button("Sign in →", type="primary", use_container_width=True):
            if email and password:
                st.session_state.logged_in = True
                st.session_state.user = {"name":"Alex Kumar","email":email,"plan":"Pro"}
                st.rerun()
            else:
                st.error("Please enter email and password.")

def sidebar():
    user = st.session_state.user
    with st.sidebar:
        st.markdown("## ⬡ DocFlow AI")
        st.markdown(f"👤 **{user.get('name','User')}**")
        st.markdown(f"📧 {user.get('email','')}")
        st.markdown(f"🏅 {user.get('plan','Pro')} Plan")
        st.markdown("---")
        pages = ["🏠 Dashboard","📝 AI Document Generator","📊 Resume Analyzer","⚙️ Settings"]
        page = st.radio("Navigate", pages, index=pages.index(st.session_state.page))
        st.session_state.page = page
        st.markdown("---")
        if st.button("🚪 Logout", use_container_width=True):
            st.session_state.logged_in = False
            st.session_state.user = {}
            st.session_state.page = "🏠 Dashboard"
            st.rerun()

def page_dashboard():
    user = st.session_state.user
    st.markdown(f"""<div style="background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);
        padding:32px;border-radius:16px;margin-bottom:24px;">
        <h1 style="color:white;margin:0;">⬡ DocFlow AI</h1>
        <p style="color:#a0aec0;margin:8px 0 0 0;">Welcome back, {user.get('name','User')} · {user.get('plan','Pro')} Plan</p>
    </div>""", unsafe_allow_html=True)
    c1,c2,c3,c4 = st.columns(4)
    c1.metric("📄 Docs Generated","128","+12 this week")
    c2.metric("📋 Resumes Analyzed","47","+5 this week")
    c3.metric("⚡ Avg Gen Time","3.2s","-0.4s")
    c4.metric("✅ ATS Score Avg","82%","+4%")
    st.markdown("---")
    st.subheader("🚀 Quick Actions")
    col1,col2,col3 = st.columns(3)
    with col1:
        st.markdown("""<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;">
            <div style="font-size:2.5em;">📝</div><h3 style="color:white;">AI Document Generator</h3>
            <p style="color:#94a3b8;font-size:0.9em;">Generate professional documents in seconds.</p></div>""", unsafe_allow_html=True)
        if st.button("Open Generator →", use_container_width=True):
            st.session_state.page="📝 AI Document Generator"; st.rerun()
    with col2:
        st.markdown("""<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;">
            <div style="font-size:2.5em;">📊</div><h3 style="color:white;">Resume Analyzer</h3>
            <p style="color:#94a3b8;font-size:0.9em;">Get ATS score and improvement tips.</p></div>""", unsafe_allow_html=True)
        if st.button("Analyze Resume →", use_container_width=True):
            st.session_state.page="📊 Resume Analyzer"; st.rerun()
    with col3:
        st.markdown("""<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;">
            <div style="font-size:2.5em;">⚙️</div><h3 style="color:white;">Settings</h3>
            <p style="color:#94a3b8;font-size:0.9em;">Manage account and preferences.</p></div>""", unsafe_allow_html=True)
        if st.button("Open Settings →", use_container_width=True):
            st.session_state.page="⚙️ Settings"; st.rerun()

def page_doc_generator():
    st.title("📝 AI Document Generator")
    doc_type = st.selectbox("Document Type",["Business Report","Project Proposal","Cover Letter","Executive Summary","Meeting Minutes","Technical Documentation","Research Summary","Business Email"])
    col1,col2 = st.columns(2)
    with col1: tone = st.selectbox("Tone",["Professional","Formal","Friendly","Persuasive","Concise"])
    with col2: length = st.selectbox("Length",["Short (1 page)","Medium (2-3 pages)","Long (4+ pages)"])
    topic = st.text_area("Topic / Brief Description", placeholder="E.g. Q3 sales performance review...", height=120)
    extra = st.text_area("Additional Instructions (optional)", height=80)
    if st.button("⚡ Generate Document", type="primary", use_container_width=True):
        if not topic.strip(): st.error("Please enter a topic."); return
        with st.spinner("Generating..."):
            try:
                result = call_ai(
                    f"Generate a {doc_type} about: {topic}\nInstructions: {extra}\nLength: {length}\nTone: {tone}\nWrite complete document with proper structure and headings.",
                    f"You are an expert professional document writer. Generate well-structured {doc_type.lower()}s."
                )
                st.success("Document generated!")
                st.markdown("---")
                st.markdown(result)
                st.download_button("⬇️ Download", data=result, file_name=f"{doc_type.lower().replace(' ','_')}.txt", mime="text/plain", use_container_width=True)
            except Exception as e:
                st.error(f"Error: {e}")

def page_resume_analyzer():
    st.title("📊 Resume Analyzer")
    jd = st.text_area("Job Description (optional)", placeholder="Paste job description for targeted analysis...", height=100)
    uploaded = st.file_uploader("Upload Resume (.txt or .pdf)", type=["txt","pdf"])
    resume_text = ""
    if uploaded:
        if uploaded.type == "text/plain":
            resume_text = uploaded.read().decode("utf-8")
        elif uploaded.type == "application/pdf":
            try:
                import pdfplumber
                with pdfplumber.open(uploaded) as pdf:
                    resume_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
            except:
                resume_text = uploaded.read().decode("utf-8", errors="ignore")
        if resume_text:
            st.success("Resume loaded!")
            with st.expander("Preview"): st.text(resume_text[:1500])
    if st.button("🔍 Analyze Resume", type="primary", use_container_width=True):
        if not resume_text.strip(): st.error("Please upload a resume first."); return
        with st.spinner("Analyzing..."):
            try:
                jd_part = f"\n\nJob Description:\n{jd}" if jd.strip() else ""
                result = call_ai(
                    f"Analyze this resume:\n{resume_text[:4000]}{jd_part}\n\nProvide: 1) ATS Score (0-100) 2) Key Strengths 3) Missing Keywords 4) Improvement Suggestions 5) Formatting Assessment",
                    "You are an expert ATS resume analyst and career coach."
                )
                st.markdown("---")
                st.markdown(result)
                st.download_button("⬇️ Download Analysis", data=result, file_name="resume_analysis.txt", mime="text/plain", use_container_width=True)
            except Exception as e:
                st.error(f"Error: {e}")

def page_settings():
    st.title("⚙️ Settings")
    user = st.session_state.user
    tab1,tab2,tab3 = st.tabs(["👤 Profile","🔑 API Key","ℹ️ About"])
    with tab1:
        name = st.text_input("Full Name", value=user.get("name",""))
        email = st.text_input("Email", value=user.get("email",""))
        plan = st.selectbox("Plan",["Free","Pro","Enterprise"],index=["Free","Pro","Enterprise"].index(user.get("plan","Pro")))
        if st.button("💾 Save Profile", type="primary"):
            st.session_state.user.update({"name":name,"email":email,"plan":plan})
            st.success("Profile updated!")
    with tab2:
        api_key = st.secrets.get("GROQ_API_KEY", os.getenv("GROQ_API_KEY",""))
        if api_key:
            st.success(f"✅ Groq API key active: ...{api_key[-4:]}")
        else:
            st.error("❌ API key not set.")
        st.markdown("Get free key: [console.groq.com](https://console.groq.com)")
    with tab3:
        st.markdown("""**DocFlow AI** · v1.0.0
| | |
|---|---|
| Student | Shuhaib Abdulla — 23BCAICD101 |
| University | Yenepoya Institute |
| Program | BCA (AI, Cloud & DevOps) with IBM & TCS |
| Stack | Python · Streamlit · Groq (LLaMA 3) |""")

if not st.session_state.logged_in:
    login_page()
else:
    sidebar()
    page = st.session_state.page
    if page == "🏠 Dashboard": page_dashboard()
    elif page == "📝 AI Document Generator": page_doc_generator()
    elif page == "📊 Resume Analyzer": page_resume_analyzer()
    elif page == "⚙️ Settings": page_settings()
