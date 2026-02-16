# FineWeb-Edu LLM Training

A complete pipeline for fine-tuning **Llama-2-13B** on the FineWeb-Edu dataset using **QLoRA**, with a **RAG-enhanced chatbot** that retrieves relevant educational content in real-time.

## 🚀 Project Overview

This repository contains a Jupyter-based fine-tuning pipeline and a chatbot with Retrieval-Augmented Generation (RAG). The model is fine-tuned on high-quality educational web content and can search through its knowledge base to provide grounded answers.

### Key Features:
- **QLoRA Fine-Tuning**: 4-bit NF4 quantization + LoRA (r=32) on Llama-2-13B.
- **H100 Optimized**: Flash Attention 2, BFloat16, batch size 32, cosine LR scheduler.
- **Layered RAG Chat**: Combines local FAISS vector search with live HuggingFace streaming search.

## 🛠 Technical Specifications

### Model Architecture (Llama-2-13B)
- **Parameters**: ~13 Billion
- **Vocabulary Size**: 32,000
- **Layers**: 40
- **Attention Heads**: 40
- **Embedding Dimension**: 5,120
- **Context Length**: 2,048 tokens

### Dataset: FineWeb-Edu
The model is fine-tuned on **1,000,000 samples** from [HuggingFaceFW/fineweb-edu](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu).

### RAG Pipeline (Layered Retrieval)
- **Layer 1 — Local FAISS Index**: Pre-built vector store with ~100K passages (instant, offline).
- **Layer 2 — Live HuggingFace Search**: Streams FineWeb-Edu in real-time from the cloud if local results are weak.
- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Retrieval**: Top-3 most relevant passages per query.

## 📈 Training Configuration
- **Base Model**: `meta-llama/Llama-2-13b-hf`
- **Quantization**: 4-bit NF4 + Double Quantization
- **LoRA**: r=32, alpha=64, targets: `q_proj`, `k_proj`, `v_proj`, `o_proj`
- **Learning Rate**: 8e-5 (cosine schedule, 3% warmup)
- **Batch Size**: 32
- **Precision**: BFloat16
- **Optimizer**: Paged AdamW 32-bit
- **Attention**: Flash Attention 2
- **Max Steps**: 5,000
- **Hardware**: NVIDIA H100 (80GB)

## 📂 Project Structure

- `train.ipynb`: Fine-tuning pipeline with Colab setup and Google Drive persistence.
- `chat_llm.py`: RAG-enhanced chatbot with layered retrieval.
- `build_rag_index.py`: Standalone script to build/rebuild the FAISS knowledge base.
- `out/`: Directory containing model checkpoints and RAG index (git-ignored).

## ⚙️ Installation & Usage

### 1. Cloud Training (Recommended)
1. Upload `train.ipynb` to **Google Colab**.
2. Set Runtime to **H100 GPU**.
3. Run the setup cells to mount Google Drive and install dependencies.
4. Run all cells to fine-tune and build the RAG index. Artifacts are saved to your Drive.

### 2. Local Chat
Once trained:
1. Download the `fineweb_edu_llama2_13b` folder from Drive to your local `out/` directory.
2. Install local deps:
   ```bash
   pip install torch transformers datasets faiss-cpu sentence-transformers peft bitsandbytes accelerate
   ```
3. Run the chat:
   ```bash
   python chat_llm.py
   ```

## 📝 License
This project is licensed under the MIT License.
