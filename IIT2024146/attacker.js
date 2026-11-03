/**
 * ============================================================================
 *  ATTACKER SERVER  —  CSRF demonstration (educational only)
 * ============================================================================
 *
 *  This is a SEPARATE website, running on a DIFFERENT origin
 *  (http://localhost:4001) from the bank (http://localhost:3000).
 *
 *  Its only job is to serve attacker/attacker.html — a page that tricks a
 *  logged-in victim's browser into silently firing a GET request at the
 *  bank's vulnerable /transfer endpoint. Because the request goes to the
 *  bank's origin, the browser automatically attaches the bank's session
 *  cookie, and the vulnerable server treats the forged request as genuine.
 *
 *  The two servers are on different ports on purpose: a different port means
 *  a different ORIGIN, which is exactly the cross-site situation CSRF needs.
 *
 *  Nothing here is actually malicious — there is no data theft, no network
 *  call to the real world. It demonstrates the attack pattern locally so it
 *  can be understood and defended against.
 * ============================================================================
 */

const express = require('express');
const path = require('path');

const PORT = process.env.ATTACKER_PORT || 4001;

const app = express();

// Serve the static attacker page.
app.use(express.static(path.join(__dirname, 'attacker')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'attacker', 'attacker.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('------------------------------------------------------------');
    console.log(`  (Educational) Attacker site at http://localhost:${PORT}`);
    console.log('  Open it in the same browser where you are logged into the bank.');
    console.log('------------------------------------------------------------');
  });
}

module.exports = app;
