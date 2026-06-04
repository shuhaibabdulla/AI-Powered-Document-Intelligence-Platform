import streamlit as st
from ai import call_ai
import io

def show():
    st.title("📊 Resume Analyzer")
    st.markdown("Upload your resume and get an ATS score, keyword analysis, and improvement tips.")

    job_description = st.text_area(
        "Job Description (optional — paste for better ATS matching)",
        placeholder="Paste the job description here to get a targeted ATS score...",
        height=120
    )

    uploaded_file = st.file_uploader("Upload Resume", type=["txt", "pdf"])

    resume_text = ""

    if uploaded_file:
        if uploaded_file.type == "text/plain":
            resume_text = uploaded_file.read().decode("utf-8")
        elif uploaded_file.type == "application/pdf":
            try:
                import pdfplumber
                with pdfplumber.open(uploaded_file) as pdf:
                    resume_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            except ImportError:
                st.warning("PDF support requires pdfplumber. Showing raw text extraction.")
                resume_text = uploaded_file.read().decode("utf-8", errors="ignore")

        if resume_text.strip():
            st.success("Resume loaded successfully!")
            with st.expander("Preview Resume Text"):
                st.text(resume_text[:2000] + ("..." if len(resume_text) > 2000 else ""))

    if st.button("🔍 Analyze Resume", type="primary", use_container_width=True):
        if not resume_text.strip():
            st.error("Please upload a resume first.")
            return

        with st.spinner("Analyzing your resume..."):
            jd_section = f"\n\nJob Description to match against:\n{job_description}" if job_description.strip() else ""

            prompt = f"""Analyze this resume and provide:

1. **ATS Score** (0-100) with explanation
2. **Key Strengths** (bullet points)
3. **Missing Keywords** (if job description provided)
4. **Improvement Suggestions** (specific, actionable)
5. **Formatting Assessment**
6. **Overall Recommendation**

Resume:
{resume_text[:4000]}
{jd_section}

Be specific, practical and constructive."""

            system = "You are an expert ATS resume analyst and career coach. Provide detailed, actionable resume feedback."

            try:
                result = call_ai(prompt, system)
                st.markdown("---")
                st.markdown("### 📋 Analysis Results")
                st.markdown(result)
                st.download_button(
                    "⬇️ Download Analysis",
                    data=result,
                    file_name="resume_analysis.txt",
                    mime="text/plain",
                    use_container_width=True
                )
            except Exception as e:
                st.error(f"Analysis failed: {str(e)}")
                st.info("Make sure your ANTHROPIC_API_KEY is set in Settings or Streamlit secrets.")
