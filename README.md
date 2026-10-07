# CaseDocker AI Contract Review Tool

A lightweight AI contract review app built with Next.js and Groq API to extract key fields and flag risky clauses from contract PDFs.



## 🚀 How to Run (3 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set API Key
Create a `.env` file in the root directory:

Groq Api Key https://groq.com/platform

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.



## 🏗️ Architecture & Data Flow

* **Stack:** Next.js (App Router, TypeScript) + Tailwind CSS + Groq API (`llama-3.3-70b-versatile`) + `pdf2json`.
* **Data Flow:**
  1. User uploads a PDF on the single-screen web UI.
  2. `/api/analyze` route receives the PDF and extracts raw text using `pdf2json`.
  3. Extracted text is sent to Groq API with structured JSON output rules matching `output_schema.json`.
  4. Extracted fields, confidence scores, verbatim quotes, and risk flags render on the review dashboard.



## 🎯 What Was Skipped & Why

1. **Native OCR for Scanned PDFs (`contract_03`):** Skipped to keep setup simple under the 2-hour constraint. Added a fallback warning when `pdf2json` finds no selectable text layer.
2. **Chunk-Based Targeted Extraction:** Instead of feeding a whole 5-page document into one prompt, break the document into individual sections or clauses using heading detection.
3. **Database / State Persistence:** Kept state in-memory on the client to avoid backend database overhead.



## 📈 Scaling to 10,000 Contracts/Day & Multi-Tenancy

1. **Async Queue:** Offload uploads to S3 and push jobs to a Redis/BullMQ worker queue to handle traffic spikes asynchronously.
2. **Tenant Isolation:** Enforce PostgreSQL Row-Level Security (RLS) using mandatory `tenant_id` columns, plus isolated S3 bucket prefix paths (`s3://bucket/{tenant_id}/...`).
3. **Cost & Speed:** Cache contract SHA-256 hashes in Redis to return instant $0 results for duplicate/boilerplate files.
                      Simple Field Extraction (Parties, Dates, Term): Fast, low-cost models (~90% cheaper).
                      Complex Risk Detection & Reasoning: Reserve top-tier models.

## 📝 AI Log & Prompt Engineering

### Main System Prompt Guidelines
The analysis prompt strictly enforces that the contract text remains the **single source of truth**:
* **Source-Bound Extraction:** Extract *only* information explicitly stated or deterministically derived from the provided document text.
* **Missing Data Strategy:** Missing or unstated fields must return as `null` with `found: false`.
* **Traceability:** Preserve exact, verbatim source text (`source_text`) for every extraction and flagged risk.
* **Calculated Fields:** Allow deterministic date calculations only when exact reference dates and durations are provided.
* **Strict JSON Response:** Return only clean JSON conforming to the schema without conversational markdown wrappers.

### Key Learnings & Iterations

| Area | Initial Problem | Root Cause | Solution & Prompt Adjustment |
| :--- | :--- | :--- | :--- |
| **Date Extraction** | Failed to compute end dates when written as relative duration (e.g., *"12 months from Effective Date"*). | Prompt strictly prohibited non-explicit dates. | Updated prompt to permit deterministic date calculations when explicit reference points exist. |
| **Risk Flags** | High false-positive rate flagging standard boilerplate clauses. | AI had too much discretion without requiring justification. | Tightened rules to require a specific, document-supported reason for every flagged risk. |

## 📝 VIDEO LINK

https://1drv.ms/v/c/592248b9bdea4184/IQBo5YKZ64FKS6fEkYOeeicFAXSsvbH4fN3FqvjM5_lCcIs?e=NrIIxp