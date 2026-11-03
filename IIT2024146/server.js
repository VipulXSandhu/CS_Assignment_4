/**
 * ============================================================================
 *  MOCK BANK SERVER  —  CSRF demonstration (IIIT Allahabad, IT-30001)
 * ============================================================================
 *
 *  This single file can run in TWO modes so that the difference between the
 *  insecure and the secure code is obvious during the viva:
 *
 *      MODE=vulnerable   ->  exposes a state-changing GET /transfer endpoint
 *                            with NO anti-CSRF protection (intentionally insecure)
 *
 *      MODE=secure       ->  removes the GET endpoint entirely, uses POST /transfer
 *                            and validates a per-session synchronizer CSRF token
 *
 *  Run:
 *      MODE=vulnerable node server.js      (or: npm run start:vulnerable)
 *      MODE=secure     node server.js      (or: npm run start:secure)
 *
 *  Default (no MODE set) = vulnerable, so the attack can be shown first.
 *
 *  NOTE: This is a LOCAL EDUCATIONAL SIMULATION. There is no real money,
 *  no real bank, and no external network calls. Do not deploy this.
 * ============================================================================
 */

const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ---- Configuration ---------------------------------------------------------

// MODE decides which transfer implementation is mounted.
const MODE = (process.env.MODE || 'vulnerable').toLowerCase();
const PORT = process.env.PORT || 3000;
const INITIAL_BALANCE = 5000; // starting balance in rupees (₹5000)

if (MODE !== 'vulnerable' && MODE !== 'secure') {
  console.error(`Invalid MODE "${MODE}". Use MODE=vulnerable or MODE=secure.`);
  process.exit(1);
}

// ---- Helper: load an HTML view and substitute {{placeholders}} --------------

const VIEWS_DIR = path.join(__dirname, 'views');

function renderView(viewName, replacements = {}) {
  let html = fs.readFileSync(path.join(VIEWS_DIR, viewName), 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(`{{${key}}}`, String(value));
  }
  return html;
}

// ---- Helper: validate a transfer amount (shared by both modes) --------------

// Returns { ok: true, amount } or { ok: false, error }.
// Server-side validation always runs, independent of any client-side checks.
function validateAmount(rawAmount, balance) {
  const amount = Number(rawAmount);
  if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
    return { ok: false, error: 'Amount is required.' };
  }
  if (!Number.isFinite(amount)) {
    return { ok: false, error: 'Amount must be a valid number.' };
  }
  if (!Number.isInteger(amount)) {
    return { ok: false, error: 'Amount must be a whole number of rupees.' };
  }
  if (amount <= 0) {
    return { ok: false, error: 'Amount must be greater than zero.' };
  }
  if (amount > balance) {
    return { ok: false, error: 'Amount exceeds the available balance.' };
  }
  return { ok: true, amount };
}

// ---- App + middleware -------------------------------------------------------

function createApp(mode = MODE) {
  // Shadow the module-level MODE with the per-app mode so the same process
  // (e.g. the test runner) can create both a vulnerable and a secure app.
  const MODE = mode;
  const app = express();

  // Parse HTML form bodies (application/x-www-form-urlencoded) for POST /transfer.
  app.use(express.urlencoded({ extended: false }));

  // Serve the stylesheet from /public.
  app.use('/public', express.static(path.join(__dirname, 'public')));

  // Session middleware. The session id is stored in a cookie.
  //
  // SECURITY NOTE:
  //  - In this LOCAL demo we run over plain HTTP, so `secure: false`.
  //  - `httpOnly: true` stops client-side JavaScript from reading the cookie
  //    (defence against stealing the cookie via XSS) but does NOT stop CSRF,
  //    because the browser still *sends* the cookie automatically.
  //  - `sameSite` is deliberately left at its default here so the GET-based
  //    CSRF attack can be demonstrated. The README explains how `SameSite`
  //    is itself a partial mitigation.
  app.use(
    session({
      secret: crypto.randomBytes(32).toString('hex'), // random per boot; never logged
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // must be true behind HTTPS in production
      },
    })
  );

  // Make the current mode available to every handler/response.
  app.use((req, res, next) => {
    res.locals.mode = MODE;
    next();
  });

  // ---- Auth helper ----------------------------------------------------------

  function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    // For API-style calls return JSON; for browser calls redirect to login.
    if (req.accepts('html')) return res.redirect('/login');
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }

  // ---- Routes: shared -------------------------------------------------------

  app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    return res.redirect('/login');
  });

  app.get('/login', (req, res) => {
    res.send(renderView('login.html', { MODE }));
  });

  // Simulated login. There is a single demo user; any password is accepted
  // because authentication strength is NOT what this assignment studies.
  app.post('/login', (req, res) => {
    const username = (req.body.username || 'demo').trim() || 'demo';
    req.session.user = username;
    req.session.balance = INITIAL_BALANCE;
    // Create a fresh CSRF token for this session (used only in secure mode).
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    res.redirect('/dashboard');
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
  });

  // Dashboard shows the balance and (in secure mode) a token-protected form.
  app.get('/dashboard', requireLogin, (req, res) => {
    const csrfToken = req.session.csrfToken || '';
    res.send(
      renderView('dashboard.html', {
        USER: req.session.user,
        BALANCE: req.session.balance,
        MODE,
        // In vulnerable mode the hidden token field is empty / unused.
        CSRF_TOKEN: MODE === 'secure' ? csrfToken : '',
      })
    );
  });

  // Convenience JSON endpoint used by the dashboard and the automated tests.
  app.get('/api/balance', requireLogin, (req, res) => {
    res.json({ user: req.session.user, balance: req.session.balance });
  });

  // =========================================================================
  //  TRANSFER ENDPOINT  —  mounted differently depending on MODE
  // =========================================================================

  if (MODE === 'vulnerable') {
    // -----------------------------------------------------------------------
    //  !!! INTENTIONALLY VULNERABLE CODE — DO NOT COPY INTO REAL SOFTWARE !!!
    // -----------------------------------------------------------------------
    //
    //  Vulnerability : Cross-Site Request Forgery (CSRF)
    //  Variant       : GET-based forged action
    //
    //  ROOT CAUSE
    //  ----------
    //  This endpoint changes server state (moves money) in response to a
    //  GET request and relies ONLY on the session cookie to decide the
    //  request is legitimate. The browser attaches that cookie automatically
    //  to EVERY request to this origin — including requests triggered by a
    //  completely different website (an <img>, <iframe>, or link on the
    //  attacker's page). The server has no way to tell that the request was
    //  not initiated by the user on our own site.
    //
    //  WRONG ASSUMPTION
    //  ----------------
    //  "If the session cookie is present, the logged-in user intended this
    //   action." That is false: cookie presence proves identity, not intent.
    //
    app.get('/transfer', requireLogin, (req, res) => {
      const check = validateAmount(req.query.amount, req.session.balance);
      if (!check.ok) {
        return respondTransfer(req, res, { success: false, message: check.error });
      }
      const to = (req.query.to || 'attacker-account').toString().slice(0, 40);

      // State change via GET + cookie only == exploitable by CSRF.
      req.session.balance -= check.amount;

      return respondTransfer(req, res, {
        success: true,
        message: `₹${check.amount} transferred to "${to}".`,
        amount: check.amount,
        to,
      });
    });
    // -----------------------------------------------------------------------
    //  !!! END INTENTIONALLY VULNERABLE CODE !!!
    // -----------------------------------------------------------------------
  } else {
    // -----------------------------------------------------------------------
    //  SECURE CODE  —  mitigation applied
    // -----------------------------------------------------------------------
    //
    //  Mitigation: Synchronizer CSRF Token Pattern + POST-only state change.
    //
    //  1. A cryptographically strong token is created at login and stored in
    //     the user's SERVER-SIDE session (req.session.csrfToken).
    //  2. The token is embedded in the legitimate transfer form as a hidden
    //     field. A cross-origin attacker CANNOT read it (Same-Origin Policy
    //     stops them reading our page / our session), so they cannot forge it.
    //  3. Every state-changing request must present a token that matches the
    //     session token. Missing or wrong token -> rejected (403).
    //  4. The state change only happens on POST, never GET.
    //  5. The token is rotated after a successful transfer.
    //
    //  The old GET /transfer endpoint does NOT exist in this mode, so the
    //  original attack hits a dead route and can change nothing.

    // Explicitly block the legacy GET endpoint so an attacker's old payload
    // gets a clear, safe rejection instead of silently doing nothing.
    app.get('/transfer', requireLogin, (req, res) => {
      return res
        .status(405)
        .send(
          renderView('result.html', {
            MODE,
            TITLE: 'Blocked',
            STATUS: 'blocked',
            MESSAGE:
              'GET is not allowed for transfers in secure mode. State-changing ' +
              'operations require a POST request with a valid CSRF token.',
            BALANCE: req.session.balance,
          })
        );
    });

    app.post('/transfer', requireLogin, (req, res) => {
      // ---- CSRF token check (constant-time comparison) --------------------
      const submitted = req.body._csrf || '';
      const expected = req.session.csrfToken || '';
      if (!expected || !csrfTokenMatches(submitted, expected)) {
        return respondTransfer(
          req,
          res,
          {
            success: false,
            message: 'Invalid or missing CSRF token. Request rejected.',
          },
          403
        );
      }

      // ---- Server-side amount validation ----------------------------------
      const check = validateAmount(req.body.amount, req.session.balance);
      if (!check.ok) {
        return respondTransfer(req, res, { success: false, message: check.error }, 400);
      }
      const to = (req.body.to || 'savings-account').toString().slice(0, 40);

      // ---- Perform the transfer -------------------------------------------
      req.session.balance -= check.amount;

      // ---- Rotate the token so it cannot be replayed ----------------------
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');

      return respondTransfer(req, res, {
        success: true,
        message: `₹${check.amount} transferred to "${to}".`,
        amount: check.amount,
        to,
        newToken: req.session.csrfToken,
      });
    });
  }

  // ---- Shared response helper ----------------------------------------------

  // Responds with JSON for API clients / tests, or an HTML result page for
  // browsers. Keeps the two transfer implementations tidy.
  function respondTransfer(req, res, result, statusOverride) {
    const status = statusOverride || (result.success ? 200 : 400);
    if (req.accepts(['html', 'json']) === 'json') {
      return res.status(status).json({ ...result, balance: req.session.balance });
    }
    return res.status(status).send(
      renderView('result.html', {
        MODE,
        TITLE: result.success ? 'Transfer complete' : 'Transfer failed',
        STATUS: result.success ? 'success' : 'failed',
        MESSAGE: result.message,
        BALANCE: req.session.balance,
        NEW_TOKEN: result.newToken || '',
      })
    );
  }

  return app;
}

// ---- Constant-time CSRF token comparison ------------------------------------

// Uses crypto.timingSafeEqual to avoid leaking information through timing.
function csrfTokenMatches(submitted, expected) {
  const a = Buffer.from(String(submitted));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ---- Boot -------------------------------------------------------------------

// Export the factory so the automated tests can start the app themselves.
module.exports = { createApp, validateAmount, csrfTokenMatches, INITIAL_BALANCE };

// Only listen when run directly (not when imported by the test runner).
if (require.main === module) {
  const app = createApp();
  app.listen(PORT, () => {
    const banner =
      MODE === 'vulnerable'
        ? '  !!! VULNERABLE MODE — GET /transfer is exploitable by CSRF !!!'
        : '  SECURE MODE — POST /transfer protected by synchronizer CSRF token';
    console.log('------------------------------------------------------------');
    console.log(`  Mock Bank running at http://localhost:${PORT}`);
    console.log(banner);
    console.log('------------------------------------------------------------');
  });
}
