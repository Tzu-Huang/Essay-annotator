# Graph Report - .  (2026-07-22)

## Corpus Check
- Large corpus: 106 files · ~565,878 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 602 nodes · 1341 edges · 56 communities (27 shown, 29 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 101 edges (avg confidence: 0.69)
- Token cost: 780,481 input · 0 output

## Community Hubs (Navigation)
- Admin Console Backend
- Admin Console Frontend
- Core API & Essay Retrieval
- Frontend App Shell & Landing
- Essay Ingestion Pipeline
- Embedding Generation
- Google Docs Export Pipeline
- Essay Comparison LLM
- Data Flow Diagram
- System Architecture Diagram
- In-Memory App State
- Embedding Store Persistence
- Architecture Summary Diagram
- Prompts & Project Docs
- Website Search UI Screenshot
- Essay Editor UI Screenshot
- JHU Essay Crawler
- Semantic Search Concept Diagram
- Drive-to-AWS Sync Script
- Shemmassian Essay Crawler
- CBR Ivy Essay Crawler
- Vine CommonApp Crawler
- Flow Diagram Sections
- Google Docs Listing Script
- TXT-to-JSONL Converter
- College Advisor Crawler
- DOCX-to-TXT Converter
- Format Template
- Pipeline Placeholder Diagram
- US Map Background Asset
- World Map Background Asset
- Favicon Asset
- Logo Asset (public 1)
- Logo Asset (public 2)
- Logo Asset (public 3)
- Columbia Logo Asset
- Harvard Logo Asset
- Ivy League Logo Asset
- JHU Logo Asset
- Stanford Logo Asset
- UPenn Logo Asset
- Vite Logo Asset
- Frontend README
- Dog Placeholder Image
- Personal Statement Icon
- Supplemental Essay Icon
- UC Essay Icon
- Google Sign-In Icon
- Current Brand Logo
- Legacy Brand Logo
- Dev Screenshot
- Footer Design Mockup
- Logo Asset (src)

## God Nodes (most connected - your core abstractions)
1. `AdminDataTests` - 47 edges
2. `AdminActor` - 45 edges
3. `Essay` - 44 edges
4. `import_new_essays()` - 22 edges
5. `EssayCreate` - 20 edges
6. `create_essay()` - 20 edges
7. `trigger_embedding_regeneration()` - 19 edges
8. `AdminAuditLog` - 19 edges
9. `AppData` - 18 edges
10. `EssayEmbedding` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Backend Python Dependencies` --shares_data_with--> `Embedding Generation Step`  [INFERRED]
  BackEnd/requirements.txt → README.md
- `Backend Python Dependencies` --shares_data_with--> `Vector Search via Cosine Similarity`  [INFERRED]
  BackEnd/requirements.txt → README.md
- `AdminActor` --uses--> `AppData`  [INFERRED]
  BackEnd/app/admin.py → BackEnd/app/state.py
- `AdminActor` --uses--> `OpenAIUsageEvent`  [INFERRED]
  BackEnd/app/admin.py → BackEnd/database/create.py
- `AdminActor` --uses--> `User`  [INFERRED]
  BackEnd/app/admin.py → BackEnd/database/create.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **OpenAI LLM Prompt Templates & Dependency** — backend_compare_results_compare_prompt, backend_service_gen_topic_prompt, backend_requirements [INFERRED 0.85]
- **README NLP Pipeline (Ingestion to Embedding to Search)** — readme_data_ingestion_pipeline, readme_embedding_generation, readme_vector_search_cosine_similarity [EXTRACTED 1.00]

## Communities (56 total, 29 thin omitted)

### Community 0 - "Admin Console Backend"
Cohesion: 0.08
Nodes (65): admin_emails(), admin_me(), admin_write_emails(), AdminActor, append_to_database_jsonl(), cloudwatch_logs(), create_essay(), _current_app_data() (+57 more)

### Community 1 - "Admin Console Frontend"
Cohesion: 0.07
Nodes (53): EmptyState(), MetaItem(), MetricCard(), PanelHeader(), StatusBadge(), AdminSidebar(), ACTION_TAG_CLASS, AuditLogList() (+45 more)

### Community 2 - "Core API & Essay Retrieval"
Cohesion: 0.06
Nodes (49): get_essay_info(), load_essays(), preview(), Generate a preview text, compare_api(), CompareRequest, health(), lifespan() (+41 more)

### Community 3 - "Frontend App Shell & Landing"
Cohesion: 0.07
Nodes (34): Frontend index.html Entry Point, App(), Footer(), HeroMockup, MATCHES, Navbar(), SignInModal(), AuthContext (+26 more)

### Community 4 - "Essay Ingestion Pipeline"
Cohesion: 0.09
Nodes (34): add_generated_titles(), get_client(), get_essay_type(), get_next_id(), load_collected_essays(), load_existing_signatures(), load_new_input_essays(), load_online_essays() (+26 more)

### Community 5 - "Embedding Generation"
Cohesion: 0.08
Nodes (34): build_output_record(), chunk_text(), determine_chunk_length(), embedding(), extract_text_fields(), get_query_embedding(), load_processed_ids(), normalize() (+26 more)

### Community 6 - "Google Docs Export Pipeline"
Cohesion: 0.15
Nodes (25): export_docx_to_text(), export_google_doc_to_text(), export_new_docs(), load_all_processed_ids(), next_batch_index(), Path, Keep only letters, numbers, spaces, '_' and '-',     and ensure the filename is, sanitize_filename() (+17 more)

### Community 7 - "Essay Comparison LLM"
Cohesion: 0.23
Nodes (16): build_prompt(), call_llm(), clean_comparison(), clean_suggestions(), compare(), count_words(), finalize_compare_result(), find_paragraph_index() (+8 more)

### Community 8 - "Data Flow Diagram"
Cohesion: 0.12
Nodes (17): Batch Embedding API, BeautifulSoup (HTML scraping), combine_all.py, Cosine Similarity, database.jsonl, embed.jsonl (已向量化後的 essay 資料庫), Embedding API (query embedding), Google Drive (data source) (+9 more)

### Community 9 - "System Architecture Diagram"
Cohesion: 0.21
Nodes (17): ANN / FAISS Approximate Nearest Neighbor Search, Backend API & Pipeline (/ingest /query /docs, JSON/JSONL), Cosine Similarity, Essay Annotator System Architecture Diagram, Document Ingestion (Google Drive / Upload API), Document Processing, Document Upload, Embedding Generation (+9 more)

### Community 11 - "Embedding Store Persistence"
Cohesion: 0.37
Nodes (7): append_records(), Path, _read_all(), remove_parent_ids(), replace_parent_id(), _write_all(), EmbedStoreTests

### Community 12 - "Architecture Summary Diagram"
Cohesion: 0.25
Nodes (11): Before: Basic Cosine Similarity (compute, sort & select top K, slow linear search), Essay Annotator System Architecture (diagram), Document Upload, Essay Database, After: FAISS Vector Search (FAISS index, efficient ANN search, fast approximate search), Google Drive (data source), Preprocessing & Embedding Generation (Text Cleaning, Embedding Creation, Metadata Extraction), Query Embedding (+3 more)

### Community 13 - "Prompts & Project Docs"
Cohesion: 0.36
Nodes (9): Essay Comparison LLM Prompt, Comparisons JSON Output Schema, Backend Python Dependencies, Topic Title Generation LLM Prompt, Essay-Annotator Project README, Data Ingestion Pipeline, Embedding Generation Step, JSONL Output Schema (+1 more)

### Community 14 - "Website Search UI Screenshot"
Cohesion: 0.31
Nodes (9): Essay Annotator Website Screenshot, Draft Workspace Panel (topic + essay text input), Essay Type Filter Chips (All / Personal Statement / UC / Supplemental), Generate Matches Button, Header Bar (EA logo, global search input, user profile), Essay Match Result Card (school/type tags, excerpt, Read more link), Similarity Percentage Badge (e.g. 59% similar), Top K Results Slider (1-5, set to 3) (+1 more)

### Community 15 - "Essay Editor UI Screenshot"
Cohesion: 0.42
Nodes (9): Draft Workspace Textarea, Essay Finder Screen ("Find essays that match your idea"), Essay Type Filter (ALL / Personal Statement / UC / Supplemental), Generate Matches / Clear Buttons, Semantic Essay Similarity Search Feature, Similar Essays Results Panel (Live Preview, Match 1-3 cards), "Similarity Search Not Ready" Status Badge, Top Results Slider (Show Matches 1-5) (+1 more)

### Community 16 - "JHU Essay Crawler"
Cohesion: 0.39
Nodes (7): crawl_jhu_essays(), fetch_html(), get_jhu_essay_links(), parse_jhu_essay(), Main crawler function.     Steps:       1. Iterate through multiple JHU index pa, Extract all essay URLs from a Johns Hopkins 'Essays That Worked' index page., Parse a single JHU essay page.     Extract:       - title       - author (if ava

### Community 17 - "Semantic Search Concept Diagram"
Cohesion: 0.38
Nodes (7): Collection of Documents, Language Model (embedding step), Relevant Results, Search Query, Semantic Search Diagram, Similarity Scores, Vector Representation

### Community 18 - "Drive-to-AWS Sync Script"
Cohesion: 0.57
Nodes (6): download_file(), get_creds(), list_children(), main(), Path, sync_folder()

### Community 19 - "Shemmassian Essay Crawler"
Cohesion: 0.40
Nodes (5): crawl_shemmassian(), parse_shemmassian_college_examples(), Path, Execute the crawler:       - Parse all essay examples from the article       - S, Parse the Shemmassian article that contains multiple essay examples.      Return

### Community 20 - "CBR Ivy Essay Crawler"
Cohesion: 0.60
Nodes (3): find_labels(), get_essay_content(), main()

### Community 21 - "Vine CommonApp Crawler"
Cohesion: 0.83
Nodes (3): get_content(), main(), search_prompt()

### Community 22 - "Flow Diagram Sections"
Cohesion: 0.50
Nodes (4): flow.png (Data/Embedding/Search Pipeline Diagram), Data Pipeline, Embedding Pipeline, Search Engine

### Community 23 - "Google Docs Listing Script"
Cohesion: 0.67
Nodes (3): list_google_docs(), main(), Input:     - folder_id: Google Drive folder ID      Output:     - Prints Google

### Community 24 - "TXT-to-JSONL Converter"
Cohesion: 0.67
Nodes (3): clean_text(), main(), Clean the raw essay text.      Currently, this function only removes leading and

## Ambiguous Edges - Review These
- `JSONL Data Storage (id, essay text, embeddings)` → `Top-K Results`  [AMBIGUOUS]
  BackEnd/picture/system.png · relation: shares_data_with
- `Google Drive` → `Document Upload`  [AMBIGUOUS]
  BackEnd/picture/system.png · relation: shares_data_with

## Knowledge Gaps
- **62 isolated node(s):** `MATCHES`, `FALLBACK_ADMIN_EMAILS`, `EDITOR_DIRTY_FIELDS`, `source`, `styles` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `JSONL Data Storage (id, essay text, embeddings)` and `Top-K Results`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `Google Drive` and `Document Upload`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **Why does `scan_and_title_new_essays()` connect `Essay Ingestion Pipeline` to `Admin Console Backend`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `AppData` connect `In-Memory App State` to `Admin Console Backend`, `Core API & Essay Retrieval`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Essay` connect `Admin Console Backend` to `Core API & Essay Retrieval`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `AdminDataTests` (e.g. with `AdminActor` and `EssayCreate`) actually correct?**
  _`AdminDataTests` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `AdminActor` (e.g. with `AppData` and `AdminAuditLog`) actually correct?**
  _`AdminActor` has 7 INFERRED edges - model-reasoned connections that need verification._