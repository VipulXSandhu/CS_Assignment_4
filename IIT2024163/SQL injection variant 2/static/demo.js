const form = document.getElementById('lookupForm');
const inputField = document.getElementById('account');
const demos = {
  all: '0 UNION SELECT id, username, password FROM users-- ',
  one: '0 UNION SELECT id, username, password FROM users WHERE id=2-- '
};
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
  // Replace the whole field so an earlier value such as "1" is never prepended.
  inputField.value = demos[button.dataset.query];
  inputField.focus();
  inputField.setSelectionRange(inputField.value.length, inputField.value.length);
  document.getElementById('resultCount').textContent = 'READY';
}));
if (form) form.addEventListener('submit', async event => {
  event.preventDefault();
  const input = inputField.value.trim();
  const result = document.getElementById('result');
  const count = document.getElementById('resultCount');
  if (!input) { count.textContent = 'READY'; result.innerHTML = '<div class="placeholder"><span>⌕</span><p>Enter an account ID or load a demo query.</p></div>'; return; }
  result.innerHTML = '<div class="placeholder"><span class="spinner"></span><p>Processing query…</p></div>';
  count.textContent = '…';
  try {
    const response = await fetch(`/api/${form.dataset.mode}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    count.textContent = `${data.count} ${data.count === 1 ? 'ROW' : 'ROWS'}`;
    if (!data.rows.length) { result.innerHTML = '<div class="placeholder"><span class="empty-check">—</span><p>No results found.</p></div>'; return; }
    result.innerHTML = '<div class="result-table"><div class="result-row result-th"><span>ID</span><span>USERNAME</span><span>STATUS / EXTRACTED VALUE</span></div>' + data.rows.map(row => `<div class="result-row"><span>${row.id}</span><span>${escapeHtml(row.username)}</span><span>${escapeHtml(row.password)}</span></div>`).join('') + '</div>';
  } catch (error) { count.textContent = 'ERROR'; result.innerHTML = `<div class="placeholder"><span>!</span><p>${escapeHtml(error.message)}</p></div>`; }
});
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }



