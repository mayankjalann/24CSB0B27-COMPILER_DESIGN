/* ===============================================
   AI CODE SUMMARIZER — app.js
   CodeT5 Transformer Model (Python-only)
   Compatible with your Colab backend pipeline
   =============================================== */

// ── State ──────────────────────────────────────
let apiUrl = localStorage.getItem('cs_api_url') || '';
let history = JSON.parse(localStorage.getItem('cs_history') || '[]');
let isLoading = false;

// ── On Load ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  updateLineNumbers();
  updateCharCount();
  renderHistory();
  updateModeLabel();
  setupKeyboardShortcut();

  // If URL is already saved, show connected state
  if (apiUrl) {
    setConnectedState(true);
    document.getElementById('apiUrlInput').value = apiUrl;
  }
});

// ── Keyboard Shortcut (Ctrl+Enter) ───────────────
function setupKeyboardShortcut() {
  document.getElementById('codeInput').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      summarize();
    }
    // Tab support in textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + '    ' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 4;
      updateLineNumbers();
    }
  });
}

// ── Settings Panel ───────────────────────────────
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    document.getElementById('apiUrlInput').focus();
  }
}

function dismissBanner() {
  document.getElementById('apiBanner').style.display = 'none';
}

function saveApiUrl() {
  const input = document.getElementById('apiUrlInput').value.trim();
  apiUrl = input;
  localStorage.setItem('cs_api_url', input);
  document.getElementById('settingsPanel').classList.remove('open');
  updateModeLabel();
  setConnectedState(!!input);
  if (input) {
    showToast('✅ Backend connected!');
    dismissBanner();
  } else {
    showToast('ℹ️ Switched to Demo Mode');
  }
}

function setConnectedState(connected) {
  const badge = document.querySelector('.header-badge');
  const dot = badge.querySelector('.dot');
  if (connected) {
    dot.style.background = '#10b981';
    dot.style.boxShadow = '0 0 8px #10b981';
    badge.querySelector('span:last-child') || badge.appendChild(Object.assign(document.createElement('span'),{}));
  } else {
    dot.style.background = '#f59e0b';
    dot.style.boxShadow = '0 0 8px #f59e0b';
  }
}

function updateModeLabel() {
  const el = document.getElementById('modeLabel');
  if (el) el.textContent = apiUrl ? `Connected: ${apiUrl}` : 'Demo Mode';
}

// ── Line Numbers ────────────────────────────────
function updateLineNumbers() {
  const ta = document.getElementById('codeInput');
  const ln = document.getElementById('lineNumbers');
  const lines = ta.value.split('\n').length;
  ln.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}

function syncScroll() {
  const ta = document.getElementById('codeInput');
  const ln = document.getElementById('lineNumbers');
  ln.scrollTop = ta.scrollTop;
}

function updateCharCount() {
  const len = document.getElementById('codeInput').value.length;
  document.getElementById('charCount').textContent =
    len === 0 ? '0 chars' : `${len.toLocaleString()} chars`;
}

// ── Utility: sanitize for display ───────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Example Code ────────────────────────────────
function pasteExample() {
  const examples = [
`def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result`,

`def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,

`def calculate_fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq`,
  ];

  const ta = document.getElementById('codeInput');
  ta.value = examples[Math.floor(Math.random() * examples.length)];
  updateLineNumbers();
  updateCharCount();
  ta.focus();
}

function clearCode() {
  document.getElementById('codeInput').value = '';
  updateLineNumbers();
  updateCharCount();
  showEmptyState();
  document.getElementById('copyBtn').disabled = true;
}

// ── Output State Switchers ───────────────────────
function showEmptyState() {
  document.getElementById('emptyState').classList.remove('hidden');
  document.getElementById('skeleton').classList.add('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
}

function showSkeleton() {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('skeleton').classList.remove('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
}

function showResult(text, latencyMs, mode) {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('skeleton').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');

  const resultEl = document.getElementById('result');
  resultEl.classList.remove('hidden');

  // Force re-animation
  resultEl.style.animation = 'none';
  requestAnimationFrame(() => { resultEl.style.animation = ''; });

  document.getElementById('summaryText').textContent = text;
  document.getElementById('latencyBadge').textContent = `⏱ ${latencyMs}ms`;
  document.getElementById('modeBadge').textContent = mode === 'demo' ? '🎭 Demo Mode' : '🌐 Live API';

  document.getElementById('copyBtn').disabled = false;
}

function showError(msg) {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('skeleton').classList.add('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorText').textContent = msg;
}

// ── Set loading state ───────────────────────────
function setLoading(loading) {
  isLoading = loading;
  const btn = document.getElementById('summarizeBtn');
  const btnText = btn.querySelector('.btn-text');
  const btnLoad = btn.querySelector('.btn-loading');
  btn.disabled = loading;
  if (loading) {
    btnText.classList.add('hidden');
    btnLoad.classList.remove('hidden');
    showSkeleton();
  } else {
    btnText.classList.remove('hidden');
    btnLoad.classList.add('hidden');
  }
}

// ── MAIN: Summarize ──────────────────────────────
async function summarize() {
  if (isLoading) return;

  const code = document.getElementById('codeInput').value.trim();
  if (!code) {
    showError('Please paste some Python code first.');
    return;
  }

  setLoading(true);
  const start = Date.now();

  try {
    let summary, mode;

    if (apiUrl) {
      // ── LIVE API (your Colab backend) ──────────
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      summary = data.summary;
      mode = 'live';

    } else {
      // ── DEMO MODE ─────────────────────────────
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
      summary = generateDemoSummary(code);
      mode = 'demo';
    }

    const latency = Date.now() - start;
    showResult(summary, latency, mode);
    addToHistory(code.substring(0, 60) + '...', summary);

  } catch (err) {
    showError(err.message || 'Could not reach the backend. Check your Colab URL in ⚙ Settings.');
  } finally {
    setLoading(false);
  }
}

// ── Demo Mode: Realistic generated summary ───────
function generateDemoSummary(code) {
  const lines = code.split('\n');
  const defLine = lines.find(l => l.trim().startsWith('def '));

  // Try extracting function name
  let fnName = '';
  if (defLine) {
    const match = defLine.match(/def\s+(\w+)/);
    if (match) fnName = match[1];
  }

  // Keyword-based demo responses (mimics your model's docstring style)
  const lower = code.toLowerCase();

  if (lower.includes('sort') || lower.includes('merge') || lower.includes('bubble') || lower.includes('quick')) {
    return `Sorts the given sequence using a divide-and-conquer approach. Returns the sorted list in ascending order. Handles edge cases for empty or single-element arrays.`;
  }
  if (lower.includes('search') || lower.includes('binary') || lower.includes('find')) {
    return `Searches for a target element in the given sequence. Returns the index of the target element if found, otherwise returns -1.`;
  }
  if (lower.includes('fibonacci') || lower.includes('fib')) {
    return `Generates a Fibonacci sequence of n elements. Returns a list containing the Fibonacci numbers starting from 0.`;
  }
  if (lower.includes('factorial')) {
    return `Computes the factorial of a given non-negative integer n. Returns the product of all positive integers up to n.`;
  }
  if (lower.includes('prime') || lower.includes('sieve')) {
    return `Checks whether a given number is prime. Returns True if the number has no divisors other than 1 and itself.`;
  }
  if (lower.includes('read') || lower.includes('file') || lower.includes('open')) {
    return `Reads data from a file and returns the parsed content. Handles file not found and permission errors gracefully.`;
  }
  if (lower.includes('class') || lower.includes('init') || lower.includes('self')) {
    return `Initializes the class instance with the provided parameters. Sets up internal state variables for subsequent method calls.`;
  }
  if (lower.includes('api') || lower.includes('request') || lower.includes('http') || lower.includes('get') || lower.includes('post')) {
    return `Sends an HTTP request to the specified endpoint and returns the parsed JSON response. Raises an exception on network or HTTP errors.`;
  }
  if (lower.includes('hash') || lower.includes('dict') || lower.includes('map')) {
    return `Builds and returns a dictionary mapping keys to their corresponding values. Handles duplicate keys by overwriting with the latest value.`;
  }
  if (lower.includes('train') || lower.includes('model') || lower.includes('loss')) {
    return `Trains the model on the given dataset for a specified number of epochs. Computes and logs training loss at each step.`;
  }
  if (fnName) {
    const readable = fnName.replace(/_/g, ' ');
    return `Performs the ${readable} operation on the provided input. Processes the arguments and returns the computed result. Includes validation for edge cases.`;
  }
  return `Processes the input data and returns the computed result. Handles edge cases and invalid inputs gracefully.`;
}

// ── History ──────────────────────────────────────
function addToHistory(codeSnippet, summary) {
  history.unshift({ code: codeSnippet, summary, time: new Date().toLocaleTimeString() });
  if (history.length > 5) history = history.slice(0, 5);
  localStorage.setItem('cs_history', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  const section = document.getElementById('historySection');
  if (!history.length) {
    section.classList.remove('visible');
    return;
  }
  section.classList.add('visible');
  list.innerHTML = history.map((h, i) => `
    <div class="history-item" onclick="loadHistory(${i})" title="${escapeHtml(h.summary)}">
      <span style="color:var(--purple-lt);font-size:0.72rem;">${h.time}</span>
      &nbsp;·&nbsp; ${escapeHtml(h.code)}
    </div>
  `).join('');
}

function loadHistory(i) {
  const h = history[i];
  if (h) showResult(h.summary, '—', 'cached');
}

function clearHistory() {
  history = [];
  localStorage.removeItem('cs_history');
  renderHistory();
}

// ── Copy Summary ─────────────────────────────────
function copySummary() {
  const text = document.getElementById('summaryText').textContent;
  navigator.clipboard.writeText(text).then(() => showToast('📋 Summary copied!'));
}

// ── Toast ─────────────────────────────────────────
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2100);
}
