import streamlit as st

def show():
    user = st.session_state.get("user", {})

    st.markdown(f"""
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                padding: 32px; border-radius: 16px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 2em;">⬡ DocFlow AI</h1>
        <p style="color: #a0aec0; margin: 8px 0 0 0;">Welcome back, {user.get('name', 'User')} · {user.get('plan', 'Pro')} Plan</p>
    </div>
    """, unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("📄 Documents Generated", "128", "+12 this week")
    with col2:
        st.metric("📋 Resumes Analyzed", "47", "+5 this week")
    with col3:
        st.metric("⚡ Avg Generation Time", "3.2s", "-0.4s")
    with col4:
        st.metric("✅ ATS Score Avg", "82%", "+4%")

    st.markdown("---")
    st.subheader("🚀 Quick Actions")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown("""
        <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.5em;">📝</div>
            <h3 style="color:white; margin:8px 0;">AI Document Generator</h3>
            <p style="color:#94a3b8; font-size:0.9em;">Generate professional documents — reports, proposals, letters — in seconds using AI.</p>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Open Generator →", key="gen", use_container_width=True):
            st.session_state.page = "📝 AI Document Generator"
            st.rerun()

    with col2:
        st.markdown("""
        <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.5em;">📊</div>
            <h3 style="color:white; margin:8px 0;">Resume Analyzer</h3>
            <p style="color:#94a3b8; font-size:0.9em;">Upload your resume and get ATS score, keyword analysis, and improvement tips.</p>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Analyze Resume →", key="res", use_container_width=True):
            st.session_state.page = "📊 Resume Analyzer"
            st.rerun()

    with col3:
        st.markdown("""
        <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.5em;">⚙️</div>
            <h3 style="color:white; margin:8px 0;">Settings</h3>
            <p style="color:#94a3b8; font-size:0.9em;">Manage your account, API key, preferences and profile information.</p>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Open Settings →", key="sett", use_container_width=True):
            st.session_state.page = "⚙️ Settings"
            st.rerun()
