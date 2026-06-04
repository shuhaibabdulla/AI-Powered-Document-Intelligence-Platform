import streamlit as st
import os

def show():
    st.title("⚙️ Settings")
    user = st.session_state.get("user", {})

    tab1, tab2, tab3 = st.tabs(["👤 Profile", "🔑 API Key", "ℹ️ About"])

    with tab1:
        st.subheader("Profile Information")
        name = st.text_input("Full Name", value=user.get("name", ""))
        email = st.text_input("Email", value=user.get("email", ""))
        plan = st.selectbox("Plan", ["Free", "Pro", "Enterprise"],
                            index=["Free", "Pro", "Enterprise"].index(user.get("plan", "Pro")))
        if st.button("💾 Save Profile", type="primary"):
            st.session_state.user["name"] = name
            st.session_state.user["email"] = email
            st.session_state.user["plan"] = plan
            st.success("Profile updated!")

    with tab2:
        st.subheader("Anthropic API Key")
        st.info("Your API key is used for AI document generation and resume analysis.")

        current_key = os.getenv("ANTHROPIC_API_KEY", "")
        masked = ("*" * (len(current_key) - 4) + current_key[-4:]) if len(current_key) > 4 else "Not set"

        st.markdown(f"**Current key:** `{masked}`")

        new_key = st.text_input("Enter new API key", type="password",
                                placeholder="sk-ant-...")
        if st.button("💾 Save API Key"):
            if new_key.strip():
                os.environ["ANTHROPIC_API_KEY"] = new_key.strip()
                st.success("API key updated for this session!")
                st.info("For permanent storage, add it to Streamlit secrets: ANTHROPIC_API_KEY = 'your-key'")
            else:
                st.error("Please enter a valid API key.")

        st.markdown("---")
        st.markdown("**Get your API key:** [console.anthropic.com](https://console.anthropic.com)")

    with tab3:
        st.subheader("About DocFlow AI")
        st.markdown("""
        **DocFlow AI** is an AI-powered document intelligence platform built with:

        - 🐍 **Python** + **Streamlit** — Web dashboard
        - 🤖 **Claude (Anthropic)** — AI document generation & resume analysis
        - ☁️ **Streamlit Community Cloud** — Deployment

        ---
        **Academic Context**

        | Detail | Info |
        |--------|------|
        | University | Yenepoya Deemed To Be University |
        | Program | BCA (AI, Cloud Computing & DevOps) with IBM & TCS |
        | Student | Shuhaib Abdulla — 23BCAICD101 |

        ---
        **Version:** 1.0.0
        """)
