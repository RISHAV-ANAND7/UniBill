import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, auth } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const hashed = bcrypt.hashSync(password, 10);
  const assignedRole = userCount === 0 ? 'admin' : (role || 'cashier');
  const info = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run(name, email.toLowerCase(), hashed, assignedRole);
  const user = { id: info.lastInsertRowid, name, email: email.toLowerCase(), role: assignedRole };
  const token = signToken(user);
  res.json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ token: signToken(safe), user: safe });
});

router.get('/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

router.get('/users', auth, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY id').all();
  res.json(users);
});

export default router;
