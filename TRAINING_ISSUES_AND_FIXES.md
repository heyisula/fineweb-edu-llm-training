# Training Notebook - Critical Issues & Fixes

## 🔴 CRITICAL ISSUES FOUND IN YOUR ORIGINAL CODE

### **Issue #1: Tokenizer Configuration (MOST SEVERE)**
**Location:** Cell `load_model` (line 128)

**Your Code:**
```python
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
```

**Problem:**
- Missing `clean_up_tokenization_spaces=False` parameter
- This causes the tokenizer to strip SentencePiece word boundary markers (`▁`)
- Result: Model outputs text without spaces like "themodeloutputs"

**Fix Applied:**
```python
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    clean_up_tokenization_spaces=False,  # ← CRITICAL FIX
    use_fast=True
)
```

---

### **Issue #2: No Data Preprocessing**
**Location:** Cell `load_data` (line 228)

**Your Code:**
```python
def tokenize_function(examples):
    return tokenizer(
        examples['text'],  # ← Raw text, not cleaned
        truncation=True,
        max_length=MAX_LENGTH,
        padding=False
    )
```

**Problems:**
- Raw FineWeb-Edu text contains metadata artifacts:
  - `|answered by|John Doe|`
  - `date created|01/01/2020|`
  - `[Reference:[1]]`
  - Author names, timestamps, comments
- No proper prompt formatting
- No uncertainty examples

**Fix Applied:**
```python
def clean_text(text: str) -> str:
    """Remove web scraping artifacts."""
    patterns = [
        r'\[Reference:.*?\]',
        r'\|answered by\|.*?\|',
        r'\|date created\|.*?\|',
        r'\|last updated\|.*?\|',
        r'\|[Cc]omments\|.*',
        # ... 10+ patterns
    ]
    for pattern in patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def format_training_example(text: str) -> str:
    """Format with proper spacing."""
    text = clean_text(text)
    
    formatted = (
        f"Context: {text}\n\n"
        f"Question: Explain the main topic discussed.\n"
        f"Answer: "  # ← CRITICAL: Space after colon
    )
    return formatted

def tokenize_with_preprocessing(examples):
    processed_texts = []
    for text in examples['text']:
        # 15% uncertainty examples
        if random.random() < 0.15:
            processed_texts.append(create_uncertainty_example())
        else:
            processed_texts.append(format_training_example(text))
    
    return tokenizer(processed_texts, truncation=True, max_length=MAX_LENGTH, padding=False)
```

---

### **Issue #3: No Uncertainty Training**
**Location:** Missing entirely

**Problem:**
- Model never learns to say "I don't know"
- Always generates confident answers, even for irrelevant questions
- Result: Hallucinations like the Grammy 2026 example

**Fix Applied:**
```python
def create_uncertainty_example() -> str:
    """Generate examples teaching uncertainty."""
    uncertainty_templates = [
        (
            "Context: Information about photosynthesis in plants.\n\n"
            "Question: How does quantum computing work?\n"
            "Answer: The provided context discusses photosynthesis, not quantum computing. "
            "I don't have enough information to answer this question based on the given context."
        ),
        # ... more templates
    ]
    return random.choice(uncertainty_templates)

# Inject 15% uncertainty examples during tokenization
if random.random() < 0.15:
    processed_texts.append(create_uncertainty_example())
```

---

### **Issue #4: Missing Data Analysis**
**Location:** Missing entirely

**Problem:**
- No visibility into data quality
- Can't detect issues before training
- No correlation analysis between features

**Fix Applied:**
Added complete data analysis section with:

1. **Statistical Summary:**
```python
df = pd.DataFrame({
    'original_length': [...],
    'cleaned_length': [...],
    'chars_removed': [...],
    'has_metadata': [...],
    'word_count': [...],
    'avg_word_length': [...]
})
print(df.describe())
```

2. **Visualizations (6 plots):**
- Text length distribution
- Metadata impact histogram
- Word count distribution
- **Correlation matrix** (heatmap)
- Metadata presence bar chart
- Average word length distribution

3. **Quality Metrics:**
```python
print(f'Metadata removal rate: {100 * df["has_metadata"].mean():.1f}%')
print(f'Avg chars cleaned: {df["chars_removed"].mean():.0f}')
```

---

### **Issue #5: Unstable Dependencies**
**Location:** Cell `install_deps` (line 39)

**Your Code:**
```python
!pip install -q -U bitsandbytes accelerate peft transformers datasets ...
```

**Problem:**
- `-U` flag installs latest versions (unstable)
- No version pinning
- Can't reproduce training results
- May install incompatible versions

**Fix Applied:**
```python
!pip install -q \
    transformers==4.36.0 \
    peft==0.7.1 \
    bitsandbytes==0.41.3 \
    accelerate==0.25.0 \
    datasets==2.16.0 \
    # ... exact versions
```

---

### **Issue #6: RAG Index Not Cleaned**
**Location:** Cell `rag_build` (line 468)

**Your Code:**
```python
for row in tqdm(rag_stream, total=RAG_SAMPLES):
    text = row['text'].strip()  # ← Not cleaned
    for i in range(0, len(text), 500):
        chunk = text[i:i + 500].strip()
        passages.append(chunk)
```

**Problem:**
- Metadata leaks into RAG passages
- User sees artifacts in chatbot responses
- Example: `|answered by||jeff woodward||date created|`

**Fix Applied:**
```python
for row in tqdm(rag_stream, total=RAG_SAMPLES):
    text = row['text'].strip()
    text = clean_text(text)  # ← CRITICAL FIX
    
    for i in range(0, len(text), 500):
        chunk = text[i:i + 500].strip()
        if len(chunk) > 50:
            passages.append(chunk)
```

---

## 📊 DATA ANALYSIS FEATURES ADDED

### 1. **Correlation Matrix**
Shows relationships between:
- Original text length
- Cleaned text length
- Characters removed
- Word count

**Code:**
```python
corr = df[['original_length', 'cleaned_length', 'chars_removed', 'word_count']].corr()
sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', square=True)
```

### 2. **Distribution Plots**
- **Length Distribution:** Shows text size variation
- **Metadata Impact:** Histogram of characters removed
- **Word Count:** Distribution of words per sample
- **Avg Word Length:** Character distribution per word

### 3. **Quality Metrics**
Automatically calculates:
- Median text length
- Metadata presence rate
- Average cleaning impact
- Word statistics

### 4. **Visualization Export**
```python
plt.savefig('/content/drive/MyDrive/.../data_analysis.png', dpi=300)
```

---

## 🎯 SUMMARY OF FIXES

| Issue | Severity | Impact | Fixed? |
|-------|----------|--------|--------|
| Tokenizer spacing | 🔴 CRITICAL | Word boundary loss | ✅ Yes |
| No data cleaning | 🔴 CRITICAL | Metadata leakage | ✅ Yes |
| No uncertainty training | 🟠 HIGH | Hallucinations | ✅ Yes |
| Unstable dependencies | 🟡 MEDIUM | Non-reproducible | ✅ Yes |
| No data analysis | 🟡 MEDIUM | No quality visibility | ✅ Yes |
| Prompt formatting | 🟡 MEDIUM | Spacing issues | ✅ Yes |
| Unclean RAG index | 🟢 LOW | Artifacts in output | ✅ Yes |

---

## 📝 HOW TO USE THE FIXED NOTEBOOK

1. **Upload `train_fixed.ipynb` to Colab**
2. **Mount Google Drive**
3. **Run all cells sequentially**
4. **Review data analysis plots** (saved automatically)
5. **Wait for training to complete** (~3-4 hours on H100)
6. **Test with your inference script**

---

## 🔬 VALIDATION CHECKLIST

After retraining, verify these fixes worked:

### ✅ Spacing Fix
```python
# Test tokenization
tokens = tokenizer.tokenize("The model outputs text")
print(tokens)
# Should show: ['▁The', '▁model', '▁outputs', '▁text']
```

### ✅ Uncertainty Training
```python
# Ask off-topic question
prompt = "Context: Photosynthesis info\nQuestion: What is quantum computing?\nAnswer:"
# Should say: "I don't have enough information..."
```

### ✅ Clean Outputs
```python
# Generate response
# Should NOT contain: |answered by| or [Reference:[1]]
```

### ✅ Data Quality
```python
# Check saved plot
# Should show correlation matrix, distributions, metadata stats
```

---

## 📈 EXPECTED IMPROVEMENTS

| Metric | Before | After Fix |
|--------|--------|-----------|
| Word spacing quality | ❌ Poor | ✅ Good |
| Hallucination rate | 🔴 High | 🟢 Low |
| Metadata in outputs | 🔴 Present | ✅ Clean |
| Training reproducibility | ❌ No | ✅ Yes |
| Data quality visibility | ❌ None | ✅ Full |

---

## 🚀 ADDITIONAL RECOMMENDATIONS

### For Even Better Results:

1. **Increase Training Steps:**
```python
max_steps=10000  # instead of 5000
```

2. **Add Validation Set:**
```python
eval_dataset = ...
eval_steps=100
evaluation_strategy="steps"
```

3. **Learning Rate Finder:**
```python
# Add before training
from transformers.trainer_utils import find_lr
optimal_lr = find_lr(trainer)
```

4. **Add More Uncertainty Templates:**
Currently 3 templates, recommend 10+ for better diversity

5. **Track Metrics:**
```python
report_to="wandb"  # or tensorboard
```

---

## 📚 FILES PROVIDED

1. **`train_fixed.ipynb`** - Complete fixed training notebook
2. **`TRAINING_ISSUES_AND_FIXES.md`** - This document
3. **Original `train.ipynb`** - Your original (for comparison)

---

## ⚠️ IMPORTANT NOTES

1. **Retraining Required:** These fixes only work if you retrain from scratch
2. **Inference Workarounds:** Your current `chat_llm.py` has workarounds, but proper fix is retraining
3. **Model Compatibility:** Fixed model will be compatible with your current inference script
4. **Training Time:** Expect 3-4 hours on H100 for 5000 steps

---

## 🎓 WHAT YOU LEARNED

1. **Tokenizer settings matter:** `clean_up_tokenization_spaces` affects output quality
2. **Data preprocessing is critical:** Raw web data needs cleaning
3. **Uncertainty must be taught:** Models don't naturally say "I don't know"
4. **Version pinning prevents issues:** Exact versions ensure reproducibility
5. **Data analysis catches problems early:** Visualizations reveal issues before training

---

## 💡 NEXT STEPS

1. ✅ Review this document thoroughly
2. ✅ Upload `train_fixed.ipynb` to Colab
3. ✅ Run data analysis section first (verify quality)
4. ✅ Start training (monitor for 30 mins to ensure stability)
5. ✅ After training completes, test with `chat_llm.py`
6. ✅ Compare old vs new model outputs
7. ✅ Document improvements

Good luck with your retraining! 🚀
