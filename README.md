<div align="center">

# 🧠 FineWeb-Edu LLM Training

**Fine-tuning Llama-2-13B on educational web content — with a RAG-powered chatbot built in.**

[![Model](https://img.shields.io/badge/Model-Llama--2--13B-blueviolet)](https://huggingface.co/meta-llama/Llama-2-13b-hf)
[![Dataset](https://img.shields.io/badge/Dataset-FineWeb--Edu-blue)](https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu)
[![GPU](https://img.shields.io/badge/GPU-H100%2080GB-green)](https://www.nvidia.com/en-us/data-center/h100/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

</div>

---

## 👋 What is this?

This project takes **Meta's Llama-2 13B** model and fine-tunes it on **1 million high-quality educational passages** from the FineWeb-Edu dataset. The result is a language model that's better at explaining concepts, answering questions, and holding educational conversations.

On top of that, there's a **RAG chatbot** (`chat_llm.py`) that doesn't just rely on what the model "remembers" — it actively searches a local knowledge base (and optionally the cloud) to back up its answers with real passages.

Think of it as a smarter tutor that can both reason *and* look things up.

---

## ✨ Key Features

| Feature | Details |
| :--- | :--- |
| 🦙 **Llama-2-13B** | 13 billion parameter base model from Meta |
| ⚡ **QLoRA Training** | 4-bit quantization — trains a 13B model using only ~8GB of VRAM |
| 🚀 **H100 Optimized** | Flash Attention 2, BFloat16, batch size 32 |
| 📚 **1M Samples** | Streamed from FineWeb-Edu (never loads full dataset into RAM) |
| 🔍 **RAG Chat** | FAISS vector search + live HuggingFace fallback |
| 💾 **Auto-Resume** | Checkpoints save to Google Drive; training resumes if Colab disconnects |

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
                          RAG Chatbot
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
  <tr><td><b>Base Model</b></td><td><code>meta-llama/Llama-2-13b-hf</code></td></tr>
  <tr><td><b>Quantization</b></td><td>4-bit NF4 + Double Quantization</td></tr>
  <tr><td><b>LoRA Rank</b></td><td>r=32, alpha=64</td></tr>
  <tr><td><b>LoRA Targets</b></td><td><code>q_proj</code>, <code>k_proj</code>, <code>v_proj</code>, <code>o_proj</code></td></tr>
  <tr><td><b>Sequence Length</b></td><td>2,048 tokens</td></tr>
  <tr><td><b>Batch Size</b></td><td>32</td></tr>
  <tr><td><b>Optimizer</b></td><td>Paged AdamW 32-bit</td></tr>
  <tr><td><b>LR Schedule</b></td><td>Cosine (8e-5, 3% warmup)</td></tr>
  <tr><td><b>Precision</b></td><td>BFloat16</td></tr>
  <tr><td><b>Attention</b></td><td>Flash Attention 2</td></tr>
  <tr><td><b>Max Steps</b></td><td>5,000</td></tr>
  <tr><td><b>Hardware</b></td><td>NVIDIA H100 (80GB)</td></tr>
</table>

---

## 🔐 Authentication (Important!)

Llama-2 is a **gated model** — Meta requires you to accept their license before you can download it. This takes about 2 minutes:

### Step 1: Accept the license
1. Go to the [Llama-2-13B model page](https://huggingface.co/meta-llama/Llama-2-13b-hf)
2. Log in to your HuggingFace account
3. Click **"Agree and access repository"**
4. Approval is usually instant

### Step 2: Create an access token
1. Go to your [HuggingFace token settings](https://huggingface.co/settings/tokens)
2. Click **"New token"** → give it a name → set access to **Read**
3. Copy the token

### Step 3: Add the token to Colab
1. Open your notebook in Google Colab
2. Click the **🔑 key icon** in the left sidebar (Secrets panel)
3. Add a new secret:
   - **Name**: `HF_TOKEN`
   - **Value**: *paste your token here*
   - **Notebook access**: toggle **ON** ✅
4. Restart the runtime (`Ctrl+M .`)

That's it. The notebook will automatically pick up the token and authenticate with HuggingFace.

> 💡 **Tip**: If you'd rather skip this, you can swap the model to `NousResearch/Llama-2-13b-hf` — it's an ungated community mirror of the same weights.

---

## 📂 Project Structure

```
fineweb-edu-llm-training/
├── train.ipynb          # Fine-tuning notebook (Colab-ready)
├── chat_llm.py          # RAG chatbot with layered retrieval
├── build_rag_index.py   # Standalone FAISS index builder
├── README.md            # You are here
└── out/                 # Model checkpoints & RAG index (git-ignored)
```

---

## 🚀 Getting Started

### Cloud Training (Recommended)

1. Upload `train.ipynb` to [Google Colab](https://colab.research.google.com)
2. Set the runtime to **H100 GPU** (or A100 if H100 isn't available)
3. Follow the [authentication steps](#-authentication-important) above
4. Run all cells — the model and RAG index will be saved to your Google Drive

### Local Chat

Once you've trained the model:

```bash
# 1. Download the model folder from Google Drive
#    → fineweb_edu_llama2_13b/final_model/
#    → fineweb_edu_llama2_13b/rag_index/

# 2. Install dependencies
pip install torch transformers datasets faiss-cpu sentence-transformers peft bitsandbytes accelerate

# 3. Start chatting
python chat_llm.py
```

---

## 🤝 Contributing

Found a bug? Have an idea? Feel free to open an issue or submit a PR. All contributions are welcome.

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ using HuggingFace Transformers, PEFT, and a lot of GPU hours.</sub>
</div>
