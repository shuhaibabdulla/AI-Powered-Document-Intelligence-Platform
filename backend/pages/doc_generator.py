import streamlit as st
from ai import call_ai

def show():
    st.title("📝 AI Document Generator")
    st.markdown("Generate professional documents instantly using AI.")

    doc_type = st.selectbox("Document Type", [
        "Business Report",
        "Project Proposal",
        "Cover Letter",
        "Executive Summary",
        "Meeting Minutes",
        "Technical Documentation",
        "Research Summary",
        "Business Email",
    ])

    col1, col2 = st.columns(2)
    with col1:
        tone = st.selectbox("Tone", ["Professional", "Formal", "Friendly", "Persuasive", "Concise"])
    with col2:
        length = st.selectbox("Length", ["Short (1 page)", "Medium (2-3 pages)", "Long (4+ pages)"])

    topic = st.text_area("Topic / Brief Description", placeholder="E.g. Q3 sales performance review for the smart city infrastructure project...", height=120)

    extra = st.text_area("Additional Instructions (optional)", placeholder="E.g. Include executive summary, use bullet points, mention IBM partnership...", height=80)

    if st.button("⚡ Generate Document", type="primary", use_container_width=True):
        if not topic.strip():
            st.error("Please enter a topic or description.")
            return

        with st.spinner("Generating your document..."):
            prompt = f"""Generate a {doc_type} about the following topic:

Topic: {topic}

Additional instructions: {extra if extra else 'None'}

Length: {length}
Tone: {tone}

Write the complete document with proper structure, headings, and formatting."""

            system = f"You are an expert professional document writer. Generate high-quality, well-structured {doc_type.lower()}s. Use proper formatting with clear headings and sections."

            try:
                result = call_ai(prompt, system)
                st.success("Document generated!")
                st.markdown("---")
                st.markdown("### 📄 Generated Document")
                st.markdown(result)
                st.download_button(
                    "⬇️ Download as .txt",
                    data=result,
                    file_name=f"{doc_type.lower().replace(' ', '_')}.txt",
                    mime="text/plain",
                    use_container_width=True
                )
            except Exception as e:
                st.error(f"AI generation failed: {str(e)}")
                st.info("Make sure your ANTHROPIC_API_KEY is set correctly in Settings or Streamlit secrets.")
