const payload = '1 UNION SELECT id, username, password FROM users-- ';
let mode = 'vulnerable';
const $ = id => document.getElementById(id);
function queryText() { return mode === 'safe' ? 'SELECT id, username, password FROM users WHERE id = ?' : `SELECT id, username, password FROM users WHERE id = ${$('payload').value || '…'}`; }
function refresh() {
  const safe = mode === 'safe';
  $('modeLabel').textContent = safe ? 'PARAMETERIZED ENDPOINT' : 'VULNERABLE ENDPOINT';
  $('formTitle').textContent = safe ? 'Same input. Safer query.' : 'Account lookup';
  $('formDesc').textContent = safe ? 'The prepared statement binds the submitted text as one value. Run the identical payload again.' : 'The input is joined directly into the SQL statement. Run the preset UNION payload to see additional records.';
  $('queryType').textContent = safe ? 'SAFE · BOUND PARAMETER' : 'UNSAFE · CONCATENATED INPUT';
  $('queryType').style.color = safe ? '#7be0bd' : '#ff9f9b';
  $('modeIndicator').className = `mode-indicator ${safe ? 'safe-mode' : ''}`;
  $('modeIndicator').innerHTML = `<i></i> ${safe ? 'MITIGATION MODE' : 'VULNERABLE MODE'}`;
  $('stepOne').classList.toggle('active', !safe); $('stepTwo').classList.toggle('active', safe);
  $('query').textContent = queryText();
  $('explainTitle').textContent = safe ? 'Why it is blocked' : 'What to observe';
  $('explain').textContent = safe ? 'The full payload is bound as a single account-ID value. It cannot append a SELECT, so there are no matching rows.' : 'The UNION combines the original lookup result with rows selected from the fictional users table.';
  $('resultTitle').textContent = safe ? 'Ready to verify the fix' : 'Ready to run';
  $('results').className = 'results empty'; $('results').innerHTML = '<div class="empty-graphic">⌁</div><b>Waiting for your query</b><span>Use the preset payload, then press Run query.</span>'; $('count').textContent = '—';
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
async function run() {
  $('query').textContent = queryText(); $('results').className = 'results loading'; $('results').innerHTML = '<span class="loader"></span><b>Executing query…</b>';
  try {
    const response = await fetch(`/api/${mode}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:$('payload').value})});
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    $('count').textContent = `${data.count} ROW${data.count === 1 ? '' : 'S'}`;
    $('resultTitle').textContent = data.count ? (mode === 'safe' ? 'Account result' : 'Unexpected rows returned') : 'No matching account';
    if (!data.count) { $('results').className='results empty success'; $('results').innerHTML='<div class="success-mark">✓</div><b>Payload treated as data</b><span>No injected rows were returned.</span>'; return; }
    $('results').className='results has-rows';
    $('results').innerHTML='<div class="row result-head"><span>ID</span><span>USERNAME</span><span>DEMO PASSWORD</span><span>ROW SOURCE</span></div>'+data.rows.map((r,i)=>`<div class="row"><span class="id-cell">${r.id}</span><span>${escapeHtml(r.username)}</span><span class="secret">${escapeHtml(r.password)}</span><span class="source ${i ? 'injected' : ''}">${i ? 'UNION result' : 'lookup'}</span></div>`).join('');
  } catch(error) { $('count').textContent='ERROR'; $('results').className='results empty'; $('results').innerHTML=`<div class="empty-graphic">!</div><b>Request could not complete</b><span>${escapeHtml(error.message)}</span>`; }
}
document.querySelectorAll('.tab').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;document.querySelectorAll('.tab').forEach(tab=>tab.classList.toggle('active',tab===button));refresh()}));
$('run').addEventListener('click',run); $('payload').addEventListener('input',()=>{$('query').textContent=queryText()}); $('payload').addEventListener('keydown',event=>{if(event.key==='Enter')run()}); $('preset').addEventListener('click',()=>{$('payload').value=payload;$('query').textContent=queryText()}); refresh();
