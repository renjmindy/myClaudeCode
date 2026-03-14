const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const JWT_SECRET = 'treasure-secret-key';
const PORT = 5001;

const db = new Database(path.join(__dirname, 'db.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL,
    result TEXT NOT NULL,
    played_at TEXT DEFAULT (datetime('now'))
  );
`);

app.use(cors());
app.use(express.json());

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const { lastInsertRowid } = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  const token = jwt.sign({ userId: lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.post('/api/auth/signin', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT id, password_hash FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.post('/api/scores', verifyToken, (req, res) => {
  const { score, result } = req.body;
  db.prepare('INSERT INTO scores (user_id, score, result) VALUES (?, ?, ?)').run(req.user.userId, score, result);
  res.json({ ok: true });
});

app.get('/api/scores', verifyToken, (req, res) => {
  const rows = db.prepare(
    'SELECT score, result, played_at FROM scores WHERE user_id = ? ORDER BY id DESC LIMIT 10'
  ).all(req.user.userId);
  res.json(rows);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
