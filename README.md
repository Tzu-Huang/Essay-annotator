# Essay-Annotator

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
→
Data Ingestion (Google Drive API)
→
Export Google Docs → .txt
→
Structured JSON Dataset
→
Search / Analysis / AI Feedback


---

## ✅ Current Progress (Completed)

### 1. Repository & Project Setup
- GitHub repository initialized with clear project structure
- `.gitignore` configured to prevent raw data, API keys, and derived datasets from being committed
- `DATA_NOTES.md` added to document data-related decisions and constraints

### 2. Google Drive API Integration
- Google Cloud project created
- Google Drive API enabled
- Service Account created and granted Viewer access to the `raw_data` folder
- API authentication verified via Python scripts
- Confirmed ability to:
  - List Google Docs files
  - Retrieve file metadata and file IDs

### 3. Data Ingestion Pipeline (Foundational)
- Implemented multiple ingestion-related scripts with clear roles:
  - **Connection testing** (Drive API authentication)
  - **File discovery** (listing Google Docs and file IDs)
  - **Export pipeline prototype** (Google Docs → `.txt`)
- Established file ID–based tracking to support incremental, non-duplicative exports
- Confirmed Google Drive as the canonical source of truth

### 4. File Type Handling
- Identified and handled multiple Drive file types
- Exported both **Google Docs** and **Word docx** to txt files

### 5. File Conversion
- Converted all the txt file to jsonl

---

## 🔴 Current Focus
> **Filter out unnecessary data from the `raw_data` folder and copy the essays accepted by universities to the `raw_curated` folder.**
>**Generalize all the .json to the same schema** (Zack)

Steps:
1. Complete the `raw_curated` folder by adding all accepted essays from the `raw_data` folder (Current)
2. Manually remove unnecessary content from each Google Doc, label each document with its corresponding university, and add a topic label if missing (Future)
3. Convert all the documents to `json` files (Future)

---

## 🛠 Planned Next Steps

1. Complete manual filtering and normalization of `raw_data`
2. Finalize a recursive Google Drive API export script
3. Export curated Google Docs essays into `.txt` files
4. Store exported text under `data/raw_text/`
5. Convert `.txt` files into a structured JSON dataset
6. Begin downstream tasks:
   - Essay metadata tagging
   - Semantic search
   - Rubric-based and AI-assisted analysis

---

## 📌 Status Summary (TL;DR)

> The project has successfully established a robust Google Drive API–based data ingestion foundation.  
> Current work intentionally prioritizes manual data curation to reduce noise and complexity before full automation.  
> The system is stable and well-positioned for scalable export, structuring, and analysis in the next phase.
