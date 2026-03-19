import { Router } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_dev_jwt_key';

const users: any[] = [];

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const existingUser = users.find(u => u.username === username);
    if (existingUser) return res.status(400).json({ error: 'Username taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      password: hashedPassword
    };
    users.push(user);

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

export default router;
