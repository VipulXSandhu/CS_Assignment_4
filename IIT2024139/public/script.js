// script.js — Front-end logic

(function () {
  'use strict';

  const banner   = document.getElementById('mode-banner');
  const form     = document.getElementById('login-form');
  const msgBox   = document.getElementById('message');
  const userIn   = document.getElementById('username');
  const passIn   = document.getElementById('password');

  let currentMode = 'secure';   // will be overwritten by /api/mode

  // ── Fetch server mode on load ──────────────────────────
  fetch('/api/mode')
    .then(r => r.json())
    .then(data => {
      currentMode = data.mode;
      if (currentMode === 'vulnerable') {
        banner.textContent = '⚠️ VULNERABLE MODE — For local testing only';
        banner.className   = 'banner banner--vulnerable';
      } else {
        banner.textContent = '🔒 SECURE MODE — Parameterized queries are active';
        banner.className   = 'banner banner--secure';
      }
    })
    .catch(() => {
    });

  // Quick-fill buttons
  document.querySelectorAll('.btn-qf').forEach(btn => {
    btn.addEventListener('click', () => {
      userIn.value = btn.dataset.user;
      passIn.value = btn.dataset.pass;
      clearMessage();
      userIn.focus();
    });
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    const username = userIn.value.trim();
    const password = passIn.value;

    if (!username || !password) {
      showMessage('Please enter both username and password.', false);
      return;
    }

    const endpoint = '/api/login';

    try {
      const res  = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.user) {
        const params = new URLSearchParams({
          user: data.user.username,
          role: data.user.role
        });
        window.location.href = '/dashboard.html?' + params.toString();
        return;
      }

      showMessage(data.message, data.success);
    } catch {
      showMessage('Could not reach the server.', false);
    }
  });


  function showMessage(text, success) {
    msgBox.textContent = text;
    msgBox.className   = 'message ' + (success ? 'message--success' : 'message--error');
  }

  function clearMessage() {
    msgBox.textContent = '';
    msgBox.className   = 'message';
  }
})();
