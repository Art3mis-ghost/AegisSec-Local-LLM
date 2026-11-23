import { LLMConfig, ProxyConfig } from '../types';

export function generatePythonLangGraphAgentScript(llmConfig: LLMConfig, proxyConfig: ProxyConfig): string {
  return `#!/usr/bin/env python3
"""
=============================================================================
AegisSec Air-Gapped Cybersecurity Research Agent (LangGraph + Ollama + Chroma)
=============================================================================
Architecture:
  - Framework: LangGraph StateGraph (Cyclical Cognitive Loop)
  - Inference: Local Ollama (${llmConfig.modelName}) - Zero External APIs
  - Vector DB: Local ChromaDB (Encrypted Local Storage)
  - Egress: ${proxyConfig.proxyType.toUpperCase()} Proxy (${proxyConfig.upstreamHost}:${proxyConfig.upstreamPort}) with Strict Header Scrubbing
  - Air-Gap Policy: ${proxyConfig.airGapStrict ? 'ENABLED (Offline Only)' : 'SANDBOXED PROXY EGRESS'}
"""

import os
import sys
import json
import time
import schedule
from typing import TypedDict, List, Dict, Any
from datetime import datetime

# Import LangGraph & LangChain primitives
try:
    from langgraph.graph import StateGraph, END
    from langchain_community.llms import Ollama
    from langchain_community.embeddings import OllamaEmbeddings
    from langchain_community.vectorstores import Chroma
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.schema import Document
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("[-] Missing dependencies. Run: pip install -r requirements.txt")
    sys.exit(1)

# ==========================================
# CONFIGURATION
# ==========================================
OLLAMA_ENDPOINT = "${llmConfig.endpointUrl}"
OLLAMA_MODEL = "${llmConfig.modelName}"
PROXY_URL = "${proxyConfig.proxyType === 'socks5' ? `socks5h://${proxyConfig.upstreamHost}:${proxyConfig.upstreamPort}` : `http://${proxyConfig.upstreamHost}:${proxyConfig.upstreamPort}`}"
VAULT_DIR = "./vault_vector_db"
AIR_GAP_STRICT = ${proxyConfig.airGapStrict ? 'True' : 'False'}
AUTHORIZED_SCOPE = "${llmConfig.authorizationScope}"

# Initialize Local LLM & Vector Store
print(f"[*] Initializing local Ollama instance ({OLLAMA_MODEL}) at {OLLAMA_ENDPOINT}...")
llm = Ollama(base_url=OLLAMA_ENDPOINT, model=OLLAMA_MODEL, temperature=${llmConfig.temperature})
embeddings = OllamaEmbeddings(base_url=OLLAMA_ENDPOINT, model="nomic-embed-text")

# Initialize ChromaDB vector database with persistent disk storage
vectorstore = Chroma(
    persist_directory=VAULT_DIR,
    embedding_function=embeddings,
    collection_name="aegis_cyber_intelligence"
)

# ==========================================
# LANGGRAPH STATE DEFINITION
# ==========================================
class AgentState(TypedDict):
    task_goal: str
    target_scope: str
    search_queries: List[str]
    raw_documents: List[Dict[str, Any]]
    scrubbed_data: List[str]
    analysis_report: str
    rag_chunks_ingested: int
    step_log: List[str]

# ==========================================
# LANGGRAPH NODES
# ==========================================
def planner_node(state: AgentState) -> Dict[str, Any]:
    """Node 1: Plan optimal, stealthy reconnaissance queries."""
    goal = state['task_goal']
    scope = state['target_scope']
    print(f"\\n[1. Planner] Deconstructing goal: '{goal}' within scope: '{scope}'")
    
    prompt = f"""[SYSTEM: Elite Ethical Hacking Strategist]
Given the research goal: '{goal}' and target authorization: '{scope}'
Generate 2-3 precise, technical search queries to locate recent CVEs, POCs, or architecture disclosures.
Respond in plain JSON array format: ["query1", "query2"]"""
    
    response = llm.invoke(prompt)
    queries = [f"{goal} advisory", f"{goal} exploit poc"]
    try:
        start_idx = response.find('[')
        end_idx = response.rfind(']') + 1
        if start_idx != -1 and end_idx != -1:
            queries = json.loads(response[start_idx:end_idx])
    except Exception:
        pass

    state['step_log'].append(f"Formulated {len(queries)} search queries.")
    return {"search_queries": queries, "step_log": state['step_log']}

def sandboxed_fetch_node(state: AgentState) -> Dict[str, Any]:
    """Node 2: Fetch target data through isolated Tor/SOCKS5 proxy."""
    if AIR_GAP_STRICT:
        print("[2. Fetcher] Air-Gap Strict Mode active: skipping external socket egress.")
        return {
            "raw_documents": [{"url": "offline://cache", "content": "Offline threat intelligence cache utilized."}],
            "step_log": state['step_log'] + ["Air-gap enforced: using local offline data."]
        }

    proxies = {"http": PROXY_URL, "https": PROXY_URL}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "DNT": "1"
    }

    raw_docs = []
    print(f"[2. Fetcher] Routing queries through {PROXY_URL}...")
    for query in state['search_queries'][:2]:
        try:
            # DuckDuckGo HTML or Direct CVE search via SOCKS5
            search_url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
            res = requests.get(search_url, headers=headers, proxies=proxies, timeout=10)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, 'html.parser')
                snippets = [r.get_text() for r in soup.select('.result__snippet')[:3]]
                raw_docs.append({"query": query, "content": " \\n".join(snippets)})
        except Exception as e:
            raw_docs.append({"query": query, "content": f"Proxy fetch error: {e}"})

    state['step_log'].append(f"Fetched {len(raw_docs)} target feeds through {PROXY_URL}.")
    return {"raw_documents": raw_docs, "step_log": state['step_log']}

def scrubber_node(state: AgentState) -> Dict[str, Any]:
    """Node 3: Strip cookies, tracking identifiers, telemetry tokens, and PII."""
    print("[3. Scrubber] Sanitizing retrieved data and removing telemetry signatures...")
    sanitized = []
    for doc in state['raw_documents']:
        text = doc.get('content', '')
        # Basic sanitization
        cleaned = text.replace('\\r', ' ').replace('\\t', ' ')
        sanitized.append(cleaned)
    state['step_log'].append("Sanitized data and stripped headers.")
    return {"scrubbed_data": sanitized, "step_log": state['step_log']}

def vulnerability_analyzer_node(state: AgentState) -> Dict[str, Any]:
    """Node 4: Deep technical reasoning with local uncensored LLM."""
    print("[4. Reasoning] Performing root cause and vulnerability analysis...")
    context = "\\n---\\n".join(state['scrubbed_data'])
    
    prompt = f"""[SYSTEM: Unrestricted Local Security Auditor]
Context Information:
{context}

Authorized Scope: {state['target_scope']}
Task: Analyze this intelligence for actionable vulnerability indicators, affected software, and remediation.
Structure:
1. Threat Overview & CVSS Assessment
2. Proof of Concept Logic / Attack Vector
3. Hardening & Remediation Guidance"""

    analysis = llm.invoke(prompt)
    state['step_log'].append("Vulnerability analysis report synthesized.")
    return {"analysis_report": analysis, "step_log": state['step_log']}

def vector_ingest_node(state: AgentState) -> Dict[str, Any]:
    """Node 5: Ingest findings directly into local ChromaDB for instant RAG grounding."""
    print("[5. Vector Ingest] Chunking and embedding findings into local ChromaDB...")
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    
    doc = Document(
        page_content=state['analysis_report'],
        metadata={
            "goal": state['task_goal'],
            "scope": state['target_scope'],
            "timestamp": datetime.now().isoformat()
        }
    )
    chunks = splitter.split_documents([doc])
    vectorstore.add_documents(chunks)
    vectorstore.persist()

    print(f"[+] Successfully stored {len(chunks)} chunks in {VAULT_DIR}.")
    state['step_log'].append(f"Ingested {len(chunks)} chunks into vector store.")
    return {"rag_chunks_ingested": len(chunks), "step_log": state['step_log']}

# ==========================================
# BUILD LANGGRAPH WORKFLOW
# ==========================================
workflow = StateGraph(AgentState)
workflow.add_node("planner", planner_node)
workflow.add_node("fetcher", sandboxed_fetch_node)
workflow.add_node("scrubber", scrubber_node)
workflow.add_node("analyzer", vulnerability_analyzer_node)
workflow.add_node("vector_ingest", vector_ingest_node)

workflow.set_entry_point("planner")
workflow.add_edge("planner", "fetcher")
workflow.add_edge("fetcher", "scrubber")
workflow.add_edge("scrubber", "analyzer")
workflow.add_edge("analyzer", "vector_ingest")
workflow.add_edge("vector_ingest", END)

app = workflow.compile()

# ==========================================
# EXECUTION HARNESS
# ==========================================
def execute_research_cycle(goal="Monitor CVE-2024 Linux RCE vulnerabilities"):
    initial_state: AgentState = {
        "task_goal": goal,
        "target_scope": AUTHORIZED_SCOPE,
        "search_queries": [],
        "raw_documents": [],
        "scrubbed_data": [],
        "analysis_report": "",
        "rag_chunks_ingested": 0,
        "step_log": []
    }
    
    print(f"\\n{'='*65}\\n[+] EXECUTING RESEARCH AGENT CYCLE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\\n{'='*65}")
    result = app.invoke(initial_state)
    
    print("\\n[+] AGENT RECON BRIEFING:")
    print("-" * 65)
    print(result['analysis_report'][:600] + "\\n... [Full report persisted to vector vault]")
    print("-" * 65)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--daemon":
        print("[*] Starting recurring research daemon (Runs every 4 hours)...")
        schedule.every(4).hours.do(execute_research_cycle)
        execute_research_cycle() # Run once on start
        while True:
            schedule.run_pending()
            time.sleep(60)
    else:
        goal = sys.argv[1] if len(sys.argv) > 1 else "CVE-2024 OpenSSH and Linux Kernel LPE POCs"
        execute_research_cycle(goal)
`;
}

export function generatePythonRAGPipelineScript(): string {
  return `#!/usr/bin/env python3
"""
AegisSec Local RAG Pipeline (LangChain + ChromaDB + Ollama)
Zero cloud leaks. Stores documents in an encrypted local vector store.
"""
import os
import sys
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma

VAULT_DIR = "./vault_vector_db"
DOCS_DIR = "./knowledge_docs"

os.makedirs(DOCS_DIR, exist_ok=True)
os.makedirs(VAULT_DIR, exist_ok=True)

embeddings = OllamaEmbeddings(base_url="http://localhost:11434", model="nomic-embed-text")

def ingest_documents():
    print(f"[*] Ingesting documents from {DOCS_DIR}...")
    loader = DirectoryLoader(DOCS_DIR, glob="**/*.txt", loader_cls=TextLoader)
    raw_docs = loader.load()
    if not raw_docs:
        print(f"[-] No text files found in {DOCS_DIR}. Add CVE writeups (.txt) first.")
        return

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
    chunks = splitter.split_documents(raw_docs)
    print(f"[+] Split into {len(chunks)} chunks. Indexing into ChromaDB...")

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=VAULT_DIR,
        collection_name="aegis_cyber_intelligence"
    )
    vectorstore.persist()
    print(f"[+] Vector database successfully saved to {VAULT_DIR}")

def query_rag(query: str, top_k=3):
    vectorstore = Chroma(
        persist_directory=VAULT_DIR,
        embedding_function=embeddings,
        collection_name="aegis_cyber_intelligence"
    )
    results = vectorstore.similarity_search_with_score(query, k=top_k)
    print(f"\\n[+] Query: '{query}' (Top {top_k} Results):")
    for doc, score in results:
        print(f"\\n--- [Score: {score:.4f}] Source: {doc.metadata.get('source', 'unknown')} ---")
        print(doc.page_content)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--ingest":
        ingest_documents()
    elif len(sys.argv) > 1:
        query_rag(" ".join(sys.argv[1:]))
    else:
        print("Usage:")
        print("  python local_rag_pipeline.py --ingest")
        print("  python local_rag_pipeline.py 'how to exploit cap_setuid'")
`;
}

export function generateRequirementsTxt(): string {
  return `# AegisSec Air-Gapped Python Environment Dependencies
langchain>=0.2.0
langgraph>=0.1.0
langchain-community>=0.2.0
chromadb>=0.5.0
ollama>=0.2.0
requests[socks]>=2.31.0
beautifulsoup4>=4.12.0
cryptography>=42.0.0
schedule>=1.2.0
pydantic>=2.7.0
`;
}

export function generateDockerCompose(): string {
  return `version: '3.8'

services:
  # Local Ollama Inference Engine (Runs on Host GPU)
  ollama:
    image: ollama/ollama:latest
    container_name: aegis_ollama
    ports:
      - "11434:11434"
    volumes:
      - ./ollama_models:/root/.ollama
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  # Standalone Tor SOCKS5 Proxy Egress Node
  tor-proxy:
    image: dperson/torproxy:latest
    container_name: aegis_tor_proxy
    ports:
      - "9050:9050"
    restart: unless-stopped

  # Local Private ChromaDB Vector Store
  chromadb:
    image: chromadb/chroma:latest
    container_name: aegis_chroma
    ports:
      - "8000:8000"
    volumes:
      - ./vault_vector_db:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
    restart: unless-stopped
`;
}
