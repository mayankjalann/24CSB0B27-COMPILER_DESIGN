# 🚀 Smart Compiler: Value-Aware AST Transformer for Code Summarization

**Author:** Mayank | **Institution:** NIT Warangal
**Domain:** Compiler Design, NLP & Agentic AI
**Status:** Mid-Evaluation (Model Training in Progress)

---

## 📌 Project Overview
This project aims to build a "Smart Compiler" engine capable of deeply understanding Python code logic and generating accurate English docstrings. Instead of relying on pre-trained black-box models, this project involves building a custom **Transformer architecture from scratch**, focusing on how compilers parse code (Abstract Syntax Trees) to feed structural intelligence into neural networks.

---

## 🔬 The Evolution & Research Journey (Iterative Development)

Building this engine was a multi-phase research process to overcome the limitations of standard NLP approaches when applied to programming languages.

### Phase 1: Vanilla Seq2Seq (Trained for 9 Epochs)
* **Approach:** Treated raw Python code purely as text (strings) and fed it into a standard Sequence-to-Sequence model.
* **Observation:** The model learned English grammar but completely failed to understand code structure. It couldn't differentiate between a `for` loop and a `variable` declaration.
* **Conclusion:** Code is a tree, not a flat string.

### Phase 2: Standard AST Integration (Trained for 15 Epochs)
* **Approach:** Transitioned to parsing Python code into an Abstract Syntax Tree (AST) using the `ast` module to provide structural context (`FunctionDef`, `For`, `BinOp`).
* **Observation:** The model finally understood control flow. However, standard ASTs drop identifier names. The model knew a return statement existed, but didn't know *what* variable was being returned.

### Phase 3: Value-Aware AST V1 (Trained for 15 Epochs)
* **Approach:** Developed a custom traversal script to inject variable names and values back into the AST nodes (e.g., tracking that `n` is the argument). 
* **The Bottleneck:** The expanded tree size blew up the sequence length. The small Transformer architecture (low `d_model`, 300 token limit) was completely overwhelmed. The model suffered from extreme truncation and catastrophic looping (repetitive outputs like `. c . c . c`).
* **Conclusion:** The data complexity outgrew the model's physical capacity.

### Phase 4: Scaled Value-Aware Transformer V2 (Current SOTA)
* **Approach:** Re-engineered the Transformer architecture to handle heavy structural data.
    * **Architecture Scaling:** Upgraded to **6 Encoder/Decoder Layers**, `d_model = 512`.
    * **Vision Expansion:** Increased Context Window to **1024 Tokens** to prevent AST truncation.
    * **Optimization:** Integrated Mixed Precision (AMP), Label Smoothing (0.1 to penalize looping), and the `OneCycleLR` scheduler.
* **Current Status:** Currently training (Epoch 6/20). The model has successfully broken out of hallucination loops and is accurately mapping complex graph traversal variables (e.g., identifying 'Nodes' and 'Paths' in Depth First Search algorithms).

---

## 🛠️ Tech Stack
* **Deep Learning:** PyTorch (Custom Multi-Head Attention, Positional Encoding)
* **NLP & Parsing:** Python `ast`, NLTK (Tokenization)
* **Hardware:** Google Colab (T4 GPU)

---
*Note: Due to large file sizes, the `.pt` model checkpoint weights are stored externally via Google Drive and are dynamically loaded for inference.*
