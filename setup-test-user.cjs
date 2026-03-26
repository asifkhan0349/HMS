const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = './hms.db';

const db = new sqlite3.Database(DB_PATH);

const username = 'admin';
const password = 'password123';
const hashedPassword = bcrypt.hashSync(password, 10);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        if (!row) {
            db.run("INSERT INTO users (full_name, username, email, role, password_hash) VALUES (?, ?, ?, ?, ?)",
                ['Administrator', username, 'admin@hms.com', 'admin', hashedPassword],
                (err) => {
                    if (err) console.error('Error creating user:', err);
                    else console.log('Test user created: admin / password123');
                    db.close();
                }
            );
        } else {
            console.log('Test user already exists: admin / password123');
            db.close();
        }
    });
});
