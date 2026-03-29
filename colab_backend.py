"""
╔══════════════════════════════════════════════════════════════╗
║        AI CODE SUMMARIZER — COLAB BACKEND SERVER            ║
║        CodeT5 Transformer | Python Code → Summary           ║
╚══════════════════════════════════════════════════════════════╝

Paste each CELL section into a separate Colab code cell.
"""

# ─────────────────────────────────────────────────────────────
# CELL 1 — Install Flask + localtunnel (run once, no signup)
# ─────────────────────────────────────────────────────────────
"""
!pip install flask flask-cors -q
!npm install -g localtunnel -q
"""


# ─────────────────────────────────────────────────────────────
# CELL 2 — Your EXACT inference logic (unchanged)
# ─────────────────────────────────────────────────────────────
import ast
import re
import torch
import os
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from google.colab import drive

if not os.path.exists('/content/drive'):
    drive.mount('/content/drive')
    print("✅ Drive Mounted.")

# ==========================================
# 1. THE AST CONVERTER
# ==========================================
def python_to_ast_string(code_str):
    try:
        tree = ast.parse(code_str)
        tokens = []

        def traverse(node):
            if isinstance(node, ast.AST):
                tokens.append(node.__class__.__name__)
                if hasattr(node, 'name') and isinstance(node.name, str):
                    tokens.append(node.name)
                elif hasattr(node, 'id') and isinstance(node.id, str):
                    tokens.append(node.id)
                elif hasattr(node, 'arg') and isinstance(node.arg, str):
                    tokens.append(node.arg)
                for child in ast.iter_child_nodes(node):
                    traverse(child)

        traverse(tree)
        return " ".join(tokens)
    except Exception as e:
        return f"Error parsing code: {e}"

# ==========================================
# 2. LOAD THE MODEL (your exact paths)
# ==========================================
print("🔄 Booting up the Smart Compiler AI (Strict Recursion Blindfold)...")

# Tokenizer from checkpoint-5625 (has your custom AST tokens)
tokenizer_path = "/content/drive/MyDrive/ai_summarization_project/codet5_final_blindfold/checkpoint-5625"
tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)

# Model from checkpoint-11250 (4 Epochs of training)
model_path = "/content/drive/MyDrive/ai_summarization_project/codet5_final_blindfold/checkpoint-11250"
model = AutoModelForSeq2SeqLM.from_pretrained(model_path).to("cuda" if torch.cuda.is_available() else "cpu")

model.eval()
print("✅ Brain Loaded & Ready!\n")

# ==========================================
# 3. THE MAGIC PREDICTION FUNCTION (your exact logic)
# ==========================================
def generate_smart_summary(raw_code):
    print("-" * 50)
    print("💻 RAW CODE INPUT:")
    print(raw_code.strip())
    print("-" * 50)

    raw_ast = python_to_ast_string(raw_code)

    match = re.search(r'FunctionDef\s+(\w+)', raw_ast)
    if match:
        func_name = match.group(1)
        masked_ast = re.sub(rf'\b{func_name}\b', 'MASK_FUNC', raw_ast)
    else:
        masked_ast = raw_ast

    print(f"🛡️ CLEANED AST (Fed to Model): {masked_ast[:100]}...")

    input_text = "summarize: " + masked_ast
    inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True).to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            input_ids=inputs.input_ids,
            attention_mask=inputs.attention_mask,
            max_length=64,
            min_length=5,
            num_beams=5,
            repetition_penalty=2.0,
            early_stopping=True
        )

    summary = tokenizer.decode(outputs[0], skip_special_tokens=True)

    if summary:
        summary = summary[0].upper() + summary[1:]
        if not summary.endswith('.'):
            summary += '.'

    print(f"\n✨ AI SUMMARY OUTPUT: \n👉 {summary}\n")
    return summary


# ─────────────────────────────────────────────────────────────
# CELL 3 — Flask API Server + localtunnel (NO signup needed!)
# ─────────────────────────────────────────────────────────────
import threading
import subprocess
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/summarize", methods=["POST"])
def summarize_endpoint():
    try:
        data = request.get_json(force=True)
        source_code = data.get("code", "").strip()

        if not source_code:
            return jsonify({"error": "No code provided."}), 400

        # Uses your EXACT generate_smart_summary function
        summary = generate_smart_summary(source_code)
        return jsonify({
            "summary": summary,
            "model": "CodeT5-checkpoint-11250",
            "status": "ok"
        })

    except Exception as e:
        return jsonify({"error": f"Internal error: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "device": str(model.device)})


# Start Flask in background thread
def run_flask():
    app.run(port=5000, use_reloader=False, debug=False)

flask_thread = threading.Thread(target=run_flask, daemon=True)
flask_thread.start()
time.sleep(2)

# Start localtunnel — FREE, no account needed
tunnel = subprocess.Popen(
    ["lt", "--port", "5000"],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE
)
raw_output = tunnel.stdout.readline().decode("utf-8").strip()

if "your url is:" in raw_output:
    public_url = raw_output.split("your url is: ")[-1].strip()
else:
    public_url = raw_output

print("=" * 60)
print(f"🚀 API is LIVE at: {public_url}/summarize")
print("=" * 60)
print("📋 Copy the URL above → Web UI → ⚙ Settings → Save")
print("=" * 60)
