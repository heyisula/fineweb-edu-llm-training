<div align="center">

# 🧠 FineWeb-Edu LLM Training

**Production-grade QLoRA fine-tuning of Llama-2-13B on educational web content — with a RAG-powered chatbot built in.**

[![Model](https://img.shields.io/badge/Model-Llama--2--13B-blueviolet)](https://huggingface.co/NousResearch/Llama-2-13b-hf)
[![Dataset](https://img.shields.io/badge/Dataset-FineWeb--Edu-blue)](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu)
[![GPU](https://img.shields.io/badge/GPU-H100%2080GB-green)](https://www.nvidia.com/en-us/data-center/h100/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

</div>

---

## 👋 What is this?

This project takes **Meta's Llama-2 13B** model and fine-tunes it on **1 million high-quality educational passages** from the FineWeb-Edu dataset. The result is a language model that's better at explaining concepts, answering questions, and holding educational conversations.

On top of that, there's a **RAG chatbot** (`chat_llm.py`) that doesn't just rely on what the model "remembers" — it actively searches a local knowledge base to back up its answers with real passages.

Think of it as a smarter tutor that can both reason *and* look things up.

---

## ✨ Key Features

| Feature | Details |
| :--- | :--- |
| 🦙 **Llama-2-13B** | 13 billion parameter base model from Meta |
| ⚡ **QLoRA** | 4-bit NF4 quantization — trains a 13B model on a single GPU |
| 🚀 **H100 Optimized** | Flash Attention 2, BF16, TF32, Batch 2 / Accum 4 |
| 🛡️ **Grad Checkpointing** | CRITICAL: Reduces activation VRAM from 40GB to ~4GB |
| 📊 **Live Diagnostics** | Real-time it/s, tok/s, and ETA monitoring during training |
| 📚 **1M Samples** | Streamed from FineWeb-Edu (never loads full dataset into RAM) |
| 🔍 **RAG Chat** | FAISS vector search + live HuggingFace fallback |
| 💾 **Auto-Resume** | Checkpoints save to Google Drive; training resumes if Colab disconnects |
| 🧹 **Memory Cleanup** | Throttled MemoryCallback (every 50 steps) for max throughput |

---

## 🏗️ How It Works

```
FineWeb-Edu (1M samples)
        │
        ▼
   Streaming Tokenizer ──► QLoRA Trainer (H100)
                                  │
                                  ▼
                          LoRA Adapters (saved to Drive)
                                  │
                                  ▼
                          RAG Chatbot (Llama-2-13B)
                         ┌─────────────┐
                         │ FAISS Index  │ ◄── 100K passages
                         │ (local)      │
                         ├─────────────┤
                         │ HuggingFace │ ◄── live cloud search
                         │ (fallback)   │
                         └─────────────┘
```

---

## 📊 Training Configuration

<table>
  <tr><td><b>Base Model</b></td><td><code>NousResearch/Llama-2-13b-hf</code></td></tr>
  <tr><td><b>Quantization</b></td><td>4-bit NF4 + Double Quantization</td></tr>
  <tr><td><b>LoRA Rank</b></td><td>r=32, alpha=64, bias=none</td></tr>
  <tr><td><b>LoRA Targets</b></td><td><code>q_proj</code>, <code>k_proj</code>, <code>v_proj</code>, <code>o_proj</code></td></tr>
  <tr><td><b>Sequence Length</b></td><td>1,024 tokens (Optimized for VRAM)</td></tr>
  <tr><td><b>Batch Size</b></td><td>2 per device (Gradient Accumulation 4)</td></tr>
  <tr><td><b>Optimizer</b></td><td>AdamW 8-bit (bitsandbytes)</td></tr>
  <tr><td><b>LR Schedule</b></td><td>Cosine (1e-4, 150 warmup steps)</td></tr>
  <tr><td><b>Precision</b></td><td>BFloat16 + TF32</td></tr>
  <tr><td><b>Attention</b></td><td>Flash Attention 2</td></tr>
  <tr><td><b>Grad Checkpointing</b></td><td>Enabled (Required for 13B on 80GB)</td></tr>
  <tr><td><b>Dataloader</b></td><td>4 workers, persistent, pinned, drop_last</td></tr>
  <tr><td><b>Max Steps</b></td><td>5,000</td></tr>
  <tr><td><b>Hardware</b></td><td>NVIDIA H100 80GB HBM3</td></tr>
</table>

**Expected throughput**: ~1.1–1.3 it/s on H100 with checkpointing enabled.

---

## 🔐 Authentication

This project uses the **NousResearch/Llama-2-13b-hf** community mirror, which is **fully open and ungated** — no HuggingFace token or license acceptance is required. Just run the notebook and it downloads automatically.

---

## 📂 Project Structure

```
fineweb-edu-llm-training/
├── train.ipynb          # Fine-tuning notebook (H100-optimized)
├── chat_llm.py          # Llama-2-13B RAG chatbot
├── build_rag_index.py   # FAISS index builder
├── README.md            # Documentation
└── out/
    ├── final_model/     # LoRA adapters (adapter_config.json, etc.)
    └── rag_index/       # FAISS index (faiss_index.bin, passages.npy)
```

---

## 🚀 Getting Started

### Cloud Training (Recommended)

1. Upload `train.ipynb` to [Google Colab](https://colab.research.google.com)
2. Set the runtime to **H100 GPU**
3. Run all cells — hardware diagnostics will confirm your setup
4. Model and RAG index are saved to your Google Drive automatically

### Local Chat

Once you've trained the model and downloaded the files into the `out/` folder:

```bash
# 1. Install dependencies
pip install torch transformers datasets faiss-cpu sentence-transformers peft bitsandbytes accelerate

# 2. Start chatting
python chat_llm.py
```

---

## 🤝 Contributing

Found a bug? Have an idea? Feel free to open an issue or submit a PR. All contributions are welcome.

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ using HuggingFace Transformers, PEFT, and local H100 compute.</sub>
</div>
