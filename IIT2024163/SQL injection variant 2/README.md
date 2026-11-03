# ByteStore SQL Injection Lab — Variant 2

A local Flask application for demonstrating UNION-based SQL injection in an electronics product search. The vulnerable mode accepts only two UNION-based data-extraction payloads targeting fictional users and secret_keys tables; the mitigated mode uses a bound parameter. SQLite errors are not shown to the browser.

## Run on Windows

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python init_db.py
python app.py
```

Open http://127.0.0.1:5050. The database contains only fictional classroom records and the server binds to localhost. Do not publish this intentionally vulnerable demo to a public server.

## Demonstration sequence

1. Search `Mouse` to show an ordinary product result in both modes.
2. In Vulnerable mode, type `' UNION ALL SELECT id, username, password, role FROM users--` and run search to show fictional user records returned through UNION.
3. Type `' UNION ALL SELECT id, key_name, key_value, 'leaked' FROM secret_keys--` to show placeholder values from the fictional secret_keys table.
4. Switch to Mitigated mode and run either same payload. The parameterized query treats it as a literal search term and returns no products.
5. Visit About to review the vulnerable query, root cause, parameterized fix and other defense-in-depth options.

The two demo buttons can load these payloads into the search field, or type them manually. Click **Run search** to execute the query. No other SQL injection payload families are included in the demo.

## Files

- `app.py` — routes and vulnerable/parameterized query paths
- `init_db.py` — creates and seeds the local SQLite database
- `store.db` — generated fictional classroom database
- `templates/` — server-rendered home, search and about pages
- `static/style.css` — dark responsive styling
- `static/search.js` — tiny helper to place a selected demonstration payload into the search field
- `requirements.txt` — Flask dependency

This project does not publish a repository or create the required group video. Complete your group ownership information and submit those items through the course instructions.


