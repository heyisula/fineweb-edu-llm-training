<div align="center">

# 🧠 InfoSage AI
### Advanced Local Intelligence Engine for Educational Synthesis

**An enterprise-grade interface for Llama-2-13B, fine-tuned on the FineWeb-Edu corpus.**

[![Model](https://img.shields.io/badge/Model-Llama--2--13B-3b82f6)](https://huggingface.co/NousResearch/Llama-2-13b-hf)
[![Dataset](https://img.shields.io/badge/Dataset-FineWeb--Edu-06b6d4)](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu)
[![Interface](https://img.shields.io/badge/UI-Electric--Azure-blue)](https://github.com/heyisula/fineweb-edu-llm-training)
[![License](https://img.shields.io/badge/License-MIT-gray)](LICENSE)

---

**InfoSage** is a high-performance, local-first AI ecosystem designed for synthesis and retrieval of educational content. By combining Meta's **Llama-2-13B** architecture with a massive scale **1M sample fine-tune** from the FineWeb-Edu dataset, InfoSage provides superior answering capabilities while maintaining 100% data privacy.

</div>

---

## 🚀 Key Capabilities

### 🔹 Advanced Architecture
*   **Hybrid RAG Pipeline**: Seamlessly integrates local FAISS vector search with a live HuggingFace fallback mechanism for real-time knowledge synthesis.
*   **Quantized Optimization**: Utilizes 4-bit NormalFloat (NF4) quantization to deploy a 13-billion parameter model on standard consumer hardware (8GB VRAM).
*   **Precision Text Synthesis**: Integrated word segmentation post-processing to eliminate spacing artifacts and ensure human-grade readability.

### 🔹 Premium Interface (Design System: Electric Azure)
*   **Liquid Glass Aesthetics**: High-fidelity glassmorphism with `backdrop-filter` depth and animated ambient lighting.
*   **Dynamic Diagnostics**: Real-time hardware telemetry including dedicated GPU identification and precise VRAM utilization monitoring.
*   **Responsive Control**: One-click "Engine Ignition" for asynchronous model loading/unloading with persistent state management.

---

## 🏗️ Technical Workflow

```mermaid
graph TD
    A[FineWeb-Edu 1M] --> B[Streaming Tokenizer]
    B --> C[QLoRA H100 Training]
    C --> D[LoRA Adapters]
    D --> E[InfoSage Runtime]
    E <--> F[(Local FAISS Index)]
    E <--> G[Live Cloud Search]
    E --> H[Electric Azure UI]
```

---

## 📊 System Configuration

| Parameter | Specification |
| :--- | :--- |
| **Compute Architecture** | NVIDIA H100 80GB HBM3 |
| **Quantization** | 4-Bit NF4 + Double Quantization |
| **LoRA Parameters** | Rank: 32 / Alpha: 64 / Targets: All Linear Layers |
| **Attention Mechanism** | Flash Attention 2 (Training) / SDPA (Inference) |
| **Optimization** | 8-bit AdamW / BFloat16 Training Precision |
| **Dataset Scale** | 1,000,000 Educational Samples (Streaming) |

---

## 🛠️ Installation & Deployment

### Hardware Requirements
*   **GPU**: NVIDIA RTX Series (Minimum 8GB Dedicated VRAM)
*   **RAM**: 16GB System Memory (Minimum)
*   **Storage**: 15GB SSD Space

### Local Deployment
```bash
# 1. Environment Setup
pip install torch transformers datasets faiss-cpu sentence-transformers peft bitsandbytes accelerate wordsegment

# 2. Launch Interface
python gui/app.py

# 3. Access
# Open http://localhost:5000 in any modern browser
```

---

## 📂 Project Governance
*   **`gui/`**: Full-stack web application implementing the Electric Azure design system.
*   **`chat_llm.py`**: Core inference engine and RAG orchestration logic.
*   **`build_rag_index.py`**: High-performance vector index constructor for local knowledge bases.
*   **`train.ipynb`**: Cloud-scale training pipeline optimized for H100 acceleration.

---

<div align="center">
  <sub>Developed for privacy-conscious intelligence. InfoSage is license-free for personal use under the MIT framework.</sub>
</div>
