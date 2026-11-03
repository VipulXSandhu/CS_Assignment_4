from pathlib import Path
import sqlite3

DB_PATH = Path(__file__).with_name("store.db")

def init_db():
    if DB_PATH.exists():
        DB_PATH.unlink()
    db = sqlite3.connect(DB_PATH)
    db.executescript("""
    CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL, description TEXT NOT NULL);
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL);
    CREATE TABLE secret_keys (id INTEGER PRIMARY KEY, key_name TEXT NOT NULL, key_value TEXT NOT NULL);
    """)
    db.executemany("INSERT INTO products VALUES (?, ?, ?, ?)", [
        (1,"Wireless Mouse",24.99,"Ergonomic wireless mouse with adjustable DPI."),
        (2,"Mechanical Keyboard",79.50,"Compact mechanical keyboard with tactile switches."),
        (3,"USB-C Hub",39.95,"Seven-port USB-C hub for everyday devices."),
        (4,"Webcam HD 1080p",54.00,"Full HD webcam with privacy cover."),
        (5,"Laptop Stand",32.75,"Adjustable aluminium laptop stand."),
    ])
    # All credentials below are fictional classroom strings, not usable secrets.
    db.executemany("INSERT INTO users VALUES (?, ?, ?, ?)", [
        (1,"admin","DEMO_ONLY_admin_not_a_real_password","admin"),
        (2,"alice","DEMO_ONLY_alice_not_a_real_password","customer"),
        (3,"bob","DEMO_ONLY_bob_not_a_real_password","customer"),
        (4,"charlie","DEMO_ONLY_charlie_not_a_real_password","manager"),
    ])
    db.executemany("INSERT INTO secret_keys VALUES (?, ?, ?)", [
        (1,"Cloud access key","DEMO_ONLY_NOT_A_REAL_CLOUD_KEY"),
        (2,"Cloud secret key","DEMO_ONLY_NOT_A_REAL_SECRET"),
        (3,"Payment API key","DEMO_ONLY_NOT_A_REAL_PAYMENT_KEY"),
        (4,"Database master password","DEMO_ONLY_NOT_A_REAL_DB_PASSWORD"),
    ])
    db.commit(); db.close()
    print(f"Initialized fictional classroom database: {DB_PATH}")

if __name__ == "__main__":
    init_db()
