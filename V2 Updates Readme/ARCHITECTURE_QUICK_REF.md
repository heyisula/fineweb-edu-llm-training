# InfoSage v2.0 Architecture Quick Reference

## 🎯 Pipeline Overview

**6 Independent Stages** → Each with modular components → OOP design pattern

```
INGESTION → PREPROCESSING → ANALYSIS → TRAINING → EVALUATION → RAG
```

---

## 📋 Stage-by-Stage Breakdown

### **STAGE 1: DATA INGESTION** (Lines 100-150)

**Purpose:** Load and filter data from HuggingFace

**Components:**
```python
StreamingDataLoader     # Manages dataset streaming
  ├─ load()            # Initialize stream with shuffle
  └─ dataset           # Returns iterable dataset

QualityFilter          # Filters low-quality samples
  ├─ is_valid()       # Checks length, alpha ratio
  └─ get_stats()      # Returns pass rate metrics

SamplingStrategy       # Controls sample limits
  ├─ should_continue() # Check if more samples needed
  └─ progress()        # Returns completion %
```

**Input:** HuggingFace dataset name  
**Output:** Filtered, shuffled data stream  
**Time:** ~5 minutes

---

### **STAGE 2: PREPROCESSING** (Lines 150-200)

**Purpose:** Clean text and format for training

**Components:**
```python
MetadataCleaner              # Removes web artifacts
  ├─ PATTERNS: list[str]    # 10+ regex patterns
  ├─ clean(text)            # Apply all patterns
  └─ chars_removed_total    # Track cleaning impact

PromptFormatter              # Creates Q&A format
  ├─ format(text)           # Add Context/Question/Answer
  └─ max_context_len        # Truncation limit

UncertaintyInjector          # Adds "I don't know" examples
  ├─ TEMPLATES: list[str]  # 4 uncertainty templates
  ├─ should_inject()        # 15% probability
  └─ get_example()          # Return random template
```

**Input:** Raw text strings  
**Output:** Cleaned, formatted training examples  
**Metrics:** 35% contain metadata, ~12% chars removed  
**Time:** Inline with tokenization

---

### **STAGE 3: ANALYSIS** (Lines 200-300)

**Purpose:** Assess data quality before training

**Components:**
```python
Statistical Analysis
  ├─ pd.DataFrame(sample_data)
  ├─ df.describe()              # Mean, std, quartiles
  └─ Export: data_stats.json

Correlation Analysis
  ├─ corr_matrix = df.corr()
  ├─ Key insights:
  │   ├─ original ↔ cleaned: 0.987
  │   ├─ word_count ↔ length: 0.956
  │   └─ removed ↔ original: 0.423
  └─ Export: correlation coefficients

Visualization Generator
  ├─ 7-plot dashboard (3x3 grid):
  │   ├─ Length distribution
  │   ├─ Metadata impact
  │   ├─ Quality pass rate
  │   ├─ Correlation heatmap (full width)
  │   ├─ Word count distribution
  │   ├─ Alpha ratio histogram
  │   └─ Metadata presence pie
  └─ Export: data_analysis.png (300 DPI)
```

**Input:** 5,000 sampled texts  
**Output:** PNG visualization + JSON stats  
**Metrics Tracked:**
- Mean/median text length
- Metadata presence rate (35%)
- Quality filter pass rate (92%)
- Feature correlations

**Time:** ~10 minutes

---

### **STAGE 4: TRAINING** (Lines 300-400)

**Purpose:** Fine-tune model with QLoRA

**Components:**
```python
QLoRA Setup
  ├─ BitsAndBytesConfig
  │   ├─ 4-bit NF4 quantization
  │   └─ Double quantization
  ├─ LoraConfig
  │   ├─ rank: 32
  │   ├─ alpha: 64
  │   ├─ dropout: 0.05
  │   └─ targets: q_proj, k_proj, v_proj, o_proj
  └─ prepare_model_for_kbit_training()

Training Loop
  ├─ TrainingArguments
  │   ├─ batch_size: 2
  │   ├─ grad_accumulation: 4
  │   ├─ learning_rate: 1e-4
  │   ├─ max_steps: 5000
  │   ├─ optimizer: adamw_bnb_8bit
  │   └─ gradient_checkpointing: True
  └─ Trainer(callbacks=[MemoryCallback])

Checkpoint Manager
  ├─ Auto-save every 500 steps
  ├─ Keep last 3 checkpoints
  └─ Resume from last checkpoint
```

**Input:** Preprocessed tokenized dataset  
**Output:** LoRA adapter weights  
**VRAM:** ~25GB on H100  
**Time:** ~60 minutes (5K steps)

---

### **STAGE 5: EVALUATION** (Lines 400-450)

**Purpose:** Validate model quality

**Components:**
```python
Generation Quality Tests
  ├─ Test cases:
  │   ├─ Basic knowledge (photosynthesis)
  │   └─ Uncertainty (off-topic question)
  └─ Check response coherence

Spacing Verification
  ├─ Detect long concatenated words
  ├─ Pattern: r'[a-z]{15,}'
  └─ Report: "✓ Clean" or "❌ Issues"

Quality Report
  ├─ Test results per case
  ├─ Spacing status
  └─ Expected vs actual behavior
```

**Input:** Trained model  
**Output:** Test results report  
**Tests Run:** 2-3 diverse prompts  
**Time:** ~5 minutes

---

### **STAGE 6: RAG INDEX** (Lines 450-500)

**Purpose:** Build vector database for retrieval

**Components:**
```python
Embedding Generator
  ├─ Model: sentence-transformers/all-MiniLM-L6-v2
  ├─ Batch size: 256
  └─ Output: 384-dim vectors

FAISS Index
  ├─ Type: IndexFlatIP (cosine similarity)
  ├─ Normalization: L2
  └─ Size: 100K passages

Export Pipeline
  ├─ faiss_index.bin (binary index)
  └─ passages.npy (text array)
```

**Input:** 100K FineWeb-Edu passages  
**Output:** FAISS index + passage array  
**Storage:** ~500MB total  
**Time:** ~15 minutes

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────┐
│          HuggingFace Dataset                │
│      (HuggingFaceFW/fineweb-edu)           │
└─────────────────┬───────────────────────────┘
                  │ Streaming
                  ↓
┌─────────────────────────────────────────────┐
│         STAGE 1: Ingestion                  │
│  StreamingDataLoader → QualityFilter        │
│         ↓                                    │
│   5K samples for analysis                   │
│   1M samples for training                   │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ↓                       ↓
┌──────────────┐    ┌──────────────────────┐
│ STAGE 2:     │    │ STAGE 3:             │
│ Preprocess   │    │ Analysis             │
│              │    │                      │
│ Clean →      │    │ Statistics →         │
│ Format →     │    │ Correlation →        │
│ Inject       │    │ Visualization        │
└──────┬───────┘    └──────┬───────────────┘
       │                   │
       │              Export: PNG + JSON
       │
       ↓
┌─────────────────────────────────────────────┐
│         STAGE 4: Training                   │
│  QLoRA → Training Loop → Checkpointing      │
└─────────────────┬───────────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
       ↓                     ↓
┌──────────────┐    ┌──────────────────────┐
│ STAGE 5:     │    │ STAGE 6:             │
│ Evaluation   │    │ RAG Index            │
│              │    │                      │
│ Quality →    │    │ Embed →              │
│ Spacing →    │    │ Index →              │
│ Report       │    │ Export               │
└──────────────┘    └──────────────────────┘
       │                     │
       ↓                     ↓
  Test Results        Vector Database
```

---

## 🎨 Design Patterns Used

### **1. Strategy Pattern** (Stage 2)
```python
class TextProcessor(ABC):
    @abstractmethod
    def process(self, text: str) -> str:
        pass

class MetadataCleaner(TextProcessor):
    def process(self, text: str) -> str:
        return self.clean(text)

class PromptFormatter(TextProcessor):
    def process(self, text: str) -> str:
        return self.format(text)
```

### **2. Factory Pattern** (Stage 1)
```python
class DataLoaderFactory:
    @staticmethod
    def create(dataset_name: str):
        if "fineweb" in dataset_name:
            return StreamingDataLoader(dataset_name)
        else:
            return BatchDataLoader(dataset_name)
```

### **3. Observer Pattern** (Stage 4)
```python
class MemoryCallback(TrainerCallback):
    """Observes training and reacts to events"""
    def on_step_end(self, args, state, control, **kwargs):
        if state.global_step % 50 == 0:
            torch.cuda.empty_cache()
```

### **4. Builder Pattern** (Stage 6)
```python
class RAGIndexBuilder:
    def __init__(self):
        self.passages = []
        self.embeddings = None
        self.index = None
    
    def add_passages(self, texts):
        self.passages.extend(texts)
        return self
    
    def generate_embeddings(self):
        self.embeddings = embedder.encode(self.passages)
        return self
    
    def build_index(self):
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(self.embeddings)
        return self
    
    def export(self, path):
        faiss.write_index(self.index, path)
```

---

## 📦 Output Artifacts

### Training Metadata (`training_metadata.json`)
```json
{
  "architecture": "Modular ML Pipeline",
  "model": "NousResearch/Llama-2-13b-hf",
  "versions": {...},
  "pipeline_components": {
    "data_ingestion": ["StreamingDataLoader", "QualityFilter"],
    "preprocessing": ["MetadataCleaner", "PromptFormatter"],
    "analysis": ["Statistical", "Correlation"],
    "training": ["QLoRA", "Checkpointing"],
    "evaluation": ["GenerationQuality", "SpacingVerification"],
    "rag": ["EmbeddingGenerator", "FAISSIndex"]
  },
  "preprocessing_stats": {
    "samples_cleaned": 1000000,
    "chars_removed": 45000000,
    "uncertainty_injected": 150000
  }
}
```

### Data Statistics (`data_stats.json`)
```json
{
  "total_samples": 5000,
  "quality_pass_rate": 0.92,
  "metadata_rate": 0.35,
  "avg_length": 847.3,
  "correlation_matrix": {...}
}
```

---

## 🔧 Extension Points

Want to customize? Here's where to plug in:

### Add New Preprocessing Step
```python
# Location: Stage 2
class CustomPreprocessor:
    def process(self, text: str) -> str:
        # Your logic here
        return processed_text

# Add to pipeline
custom = CustomPreprocessor()
cleaned = cleaner.clean(text)
processed = custom.process(cleaned)  # ← Insert here
formatted = formatter.format(processed)
```

### Add New Analysis Metric
```python
# Location: Stage 3
df['custom_metric'] = df['text'].apply(lambda x: your_metric(x))

# Add to correlation
corr_matrix = df[features + ['custom_metric']].corr()

# Add to visualization
ax.plot(df['custom_metric'])
```

### Add New Evaluation Test
```python
# Location: Stage 5
test_cases.append({
    'name': 'Custom Test',
    'prompt': '...',
    'expected': '...'
})
```

---

## 🚀 Quick Start Checklist

- [ ] Upload `train_v2_architecture.ipynb` to Colab
- [ ] Select H100 GPU runtime
- [ ] Mount Google Drive
- [ ] Run Stage 1 (Ingestion) - Verify 5K samples loaded
- [ ] Run Stage 2 (Preprocessing) - Components initialized
- [ ] Run Stage 3 (Analysis) - Review `data_analysis.png`
- [ ] Run Stage 4 (Training) - Wait ~60 min
- [ ] Run Stage 5 (Evaluation) - Check test results
- [ ] Run Stage 6 (RAG) - Wait ~15 min
- [ ] Download all artifacts from Drive
- [ ] Test locally with `chat_llm.py`

---

## 📚 Further Reading

- **Full Architecture:** `README_v2.md`
- **Migration Guide:** `V1_TO_V2_MIGRATION.md`
- **Training Issues:** `TRAINING_ISSUES_AND_FIXES.md`
- **Original Docs:** `README.md` (v1.0)

---

<div align="center">

**InfoSage v2.0** - Clean architecture for clean outputs

</div>
