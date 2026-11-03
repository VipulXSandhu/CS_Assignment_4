from flask import Flask, render_template, request
from pathlib import Path
import sqlite3
import sys

BASE = Path(__file__).resolve().parent
DB_PATH = BASE / "store.db"
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 4096
DEFAULT_SECURE = "--secure" in sys.argv

PAYLOADS = [
    "' UNION ALL SELECT id, username, password, role FROM users--",
    "' UNION ALL SELECT id, key_name, key_value, 'leaked' FROM secret_keys--",
]


def db_connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db


@app.get("/")
def home():
    return render_template("index.html")


@app.route("/search", methods=["GET", "POST"])
def search():
    query = request.values.get("q", "")[:300]
    secure = request.values.get("secure", "1" if DEFAULT_SECURE else "0") == "1"
    results, extracted_rows, extracted_headers = [], [], []
    error, executed_sql = None, None
    if query:
        db = db_connect()
        try:
            if secure:
                executed_sql = "SELECT id, name, price, description FROM products WHERE name LIKE ?"
                rows = db.execute(executed_sql, (f"%{query}%",)).fetchall()
                results = [dict(row) for row in rows]
            else:
                normal = all(token not in query.lower() for token in ["'", "--", "union", "select", ";"])
                if not normal and query not in PAYLOADS:
                    raise ValueError("Use a normal product name or one of the two UNION demo queries.")
                executed_sql = f"SELECT id, name, price, description FROM products WHERE name LIKE '%{query}%'"
                rows = [dict(row) for row in db.execute(executed_sql).fetchall()]
                if query in PAYLOADS:
                    # UNION ALL preserves source order: catalog rows first, extraction rows second.
                    product_count = db.execute("SELECT COUNT(*) FROM products").fetchone()[0]
                    results = rows[:product_count]
                    extracted_rows = [list(row.values()) for row in rows[product_count:]]
                    extracted_headers = (["ID", "USERNAME", "PASSWORD", "ROLE"] if query == PAYLOADS[0]
                                         else ["ID", "KEY NAME", "KEY VALUE", "SOURCE"])
                else:
                    results = rows
        except (sqlite3.Error, ValueError):
            error = "The search could not be completed. Check the input and try again."
        finally:
            db.close()
    return render_template("search.html", query=query, secure=secure, results=results,
                           extracted_rows=extracted_rows, extracted_headers=extracted_headers,
                           error=error, executed_sql=executed_sql, payloads=PAYLOADS)


@app.get("/about")
def about():
    vulnerable_code = """sql = (
    "SELECT id, name, price, description FROM products "
    f"WHERE name LIKE '%{query}%'"
)
rows = db.execute(sql).fetchall()"""
    safe_code = """sql = (
    "SELECT id, name, price, description FROM products "
    "WHERE name LIKE ?"
)
rows = db.execute(sql, (f"%{query}%",)).fetchall()"""
    return render_template("about.html", payloads=PAYLOADS,
                           vulnerable_code=vulnerable_code, safe_code=safe_code)


if __name__ == "__main__":
    if not DB_PATH.exists():
        from init_db import init_db
        init_db()
    app.run(host="127.0.0.1", port=5050, debug=False, use_reloader=False)




