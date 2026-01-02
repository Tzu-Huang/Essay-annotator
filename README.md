# EssayLens (Working Title)

EssayLens is a data-driven platform designed to help students learn how to write effective U.S. college application essays by analyzing real examples and providing structural, non-ghostwriting feedback.

This project focuses on **learning and analysis**, not essay generation.

---

## 🎯 Project Goal

Many students struggle with college essays because they:
- Cannot see real, authentic examples
- Do not understand why certain essays work
- Receive vague or unhelpful feedback

EssayLens aims to solve this by:
- Collecting real college essays (with consent)
- Structuring them into a searchable dataset
- Providing AI-assisted structural analysis and feedback (not full rewriting)

---

## 🧠 High-Level Architecture

Google Drive (raw essays, mostly Google Docs)
↓
Data Ingestion Pipeline
↓
Export Google Docs → .txt
↓
Structured JSON Dataset
↓
Search / Analysis / AI Feedback


---

## ✅ Current Progress (Completed)

### 1. Repository & Data Pipeline Setup
- `.gitignore` configured to prevent raw data from being committed
- Defined `data/raw` as the canonical data source
- Implemented a fault-tolerant Google Drive ingestion pipeline using `gdown`
  - Skips inaccessible or incompatible files without crashing

### 2. Data Issues Identified & Documented
- Confirmed that the majority of essays are **Google Docs**, not physical files
- Verified that Google Docs cannot be read directly by Python
- Folder structures can be synced, but document content requires export
- All known constraints and decisions are documented in `DATA_NOTES.md`

---

## ⚠️ Current Limitation (Important)

At this stage:
- Essay content **cannot yet be processed**
- No `.txt`, `.json`, or `.html` essay files exist locally
- JSON conversion, NLP, and AI analysis are intentionally paused

**This is not a bug.**  
It is a known limitation caused by Google Docs being cloud-native objects rather than files.

---

## 🔴 Current Focus

> Export Google Docs essays from Google Drive into readable `.txt` files using the Google Drive API.

This step is required before any downstream processing can occur.

---

## 🛠 Planned Next Steps

1. Create a Google Cloud project and enable Google Drive API
2. Set up a Service Account with access to the `raw_data` folder
3. Export Google Docs as `.txt`
4. Store exported files locally under `data/raw_text/`
5. Convert essays into a structured JSON dataset
6. Implement semantic search and rubric-based analysis

---

## 👥 Team Structure (Tentative)

- **Project Lead**: System design, data pipeline, AI analysis
- **Data Engineer**: Google Drive API integration and export logic
- **NLP Engineer**: Essay tagging, structure analysis, embeddings
- **Frontend / UX**: Search interface and visualization

---

## 🔐 Ethics & Privacy

- All essays are collected with explicit consent
- Raw data is never committed to GitHub
- The platform does **not** generate essays
- Focus is on learning, comparison, and improvement

---

## 📌 Status Summary (TL;DR)

> The project is correctly paused at the data export stage after identifying and documenting a critical data-type constraint. The foundation is stable and ready for the next phase.
