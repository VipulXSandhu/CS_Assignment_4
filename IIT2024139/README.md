# SQL Injection Demo – Authentication Bypass Lab

⚠️ **Educational use only.** This application is intentionally vulnerable and must never be deployed on a public network. It is designed for a university Cyber Security assignment to demonstrate and then fix an **SQL Injection Authentication Bypass** vulnerability.

---

## 📁 Project Structure

```
IIT2024139/
├── package.json
├── server.js                  ← Express entry point (port 3000)
├── database/
│   └── setup.js               ← SQLite schema + seed data
├── routes/
│   ├── login.js               ← Mode-based router (frontend uses /api/login)
│   ├── vulnerable.js          ← ⚠️  Intentionally flawed login (string concatenation)
│   └── secure.js              ← ✅  Parameterized-query login (the fix)
├── public/
│   ├── index.html             ← Login portal UI
│   ├── dashboard.html         ← Post-login dashboard
│   ├── style.css              ← Dark-theme styling
│   └── script.js              ← Front-end logic
└── README.md
```

---

## 🚀 Installation & Running

### 1. Install dependencies

```bash
cd IIT2024139
npm install
```

### Repository Setup

The repository includes a `.gitignore` file to exclude generated files and dependencies from version control, such as:

- `node_modules/`
- `data/*.db` (SQLite database files)
- IDE folders (`.idea/`, `.vscode/`)
- Log files (`npm-debug.log`, `yarn-debug.log`, `yarn-error.log`)

This helps keep the repository clean and avoids committing large, unnecessary files.

### 2. Run in Secure mode (default)

```bash
npm start
# → http://localhost:3000 (SECURE mode)
```

### 3. Run in Vulnerable mode

```bash
npm run start:vulnerable
# → http://localhost:3000 (VULNERABLE mode)
```

The SQLite database is created automatically in `data/users.db` on first startup — no manual setup is needed.

---

## 🧪 Step-by-Step Demo

### A. Vulnerable Mode

1. Start the server in vulnerable mode:
   ```bash
   npm run start:vulnerable
   ```
2. Open [http://localhost:3000](http://localhost:3000/) in your browser.
3. Try logging in with valid credentials — e.g. `alice` / `password456` — to confirm normal login works.
4. Now log out and enter the following **SQL injection payload** as the username:
   ```
   ' OR '1'='1' --
   ```
   Enter anything (or nothing) as the password.
5. You are logged in as **admin** — without knowing the password! The injected SQL makes the `WHERE` clause always true and comments out the password check.
6. Check the server terminal — you'll see the raw query that was executed, confirming the injection.

### B. Secure Mode

1. Stop the server. Restart it in secure mode:
   ```bash
   npm start
   ```
2. Open [http://localhost:3000](http://localhost:3000/) in your browser. Note the **🔒 MODE: SECURE** banner.
3. Try the same injection payload (`' OR '1'='1' --`) as the username.
4. Login is **rejected** — the payload is treated as a literal string, not SQL syntax. No matching user is found.
5. Log in with valid credentials (`alice` / `password456`) — it works as expected.

---

## 👤 Demo Users (seeded automatically)

| Username | Password      | Role  |
|----------|---------------|-------|
| admin    | admin123      | admin |
| alice    | password456   | user  |
| bob      | secret789     | user  |
| krish    | krish@008     | user  |

---

## 🔍 Root Cause

The vulnerable route **concatenates raw user input directly into the SQL query string**:

```js
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
```

An attacker enters `' OR '1'='1' --` as the username, which transforms the query into:

```sql
SELECT * FROM users WHERE username = '' OR '1'='1' --' AND password = '...'
```

The `OR '1'='1'` makes the `WHERE` clause always true, and `--` comments out the password check — granting access as the first user (admin) without knowing the password.

---

## 🛡️ Mitigations Implemented

| Defence | How it works in this demo |
|---------|--------------------------|
| **Parameterized Queries** | The secure route uses `db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)`. The `?` placeholders ensure user input is always treated as *data*, never as SQL syntax. |
| **Input Validation** | Username length is capped at 64 characters and password at 128 characters, rejecting excessively long inputs before they reach the database. |
| **Error Handling** | Internal database errors are caught and logged server-side; only a generic error message is returned to the client, preventing information leakage. |

### Other Mitigations (Theory)

- **Stored Procedures:** Moving SQL logic into stored procedures on the database server limits what an application can execute, reducing the attack surface for injection.
- **Least Privilege:** The database user account used by the application should have only the minimum permissions required (e.g., `SELECT` on the users table), so even a successful injection cannot `DROP TABLE` or access other data.
- **Hashed Passwords:** In a production system, passwords should be stored as salted hashes (e.g., bcrypt). Even if an attacker extracts data via injection, they cannot recover plaintext passwords.

---


## 📋 Ownership Declaration

| Member Name | Roll Number | Category | Variant Implemented |
|-------------|-------------|----------|---------------------|
| Vipul       | IIT2024139  | Individual | SQL Injection – Authentication Bypass (Parameterized Queries) |
