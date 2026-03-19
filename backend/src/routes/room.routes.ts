import { Router, Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_dev_jwt_key';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const rooms: any[] = [];
const roomUsers: any[] = [];

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = (req as any).user.userId;

    const room = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || 'Untitled Room',
      ownerId: userId,
      createdAt: new Date().toISOString()
    };
    rooms.push(room);
    
    roomUsers.push({
      id: Math.random().toString(36).substr(2, 9),
      roomId: room.id,
      userId: userId,
      role: 'OWNER'
    });
    
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    const userId = (req as any).user.userId;

    let room = rooms.find(r => r.id === roomId);
    if (!room) {
      room = { id: roomId, name: 'Ad-hoc Room', ownerId: userId, createdAt: new Date().toISOString() };
      rooms.push(room);
    }

    const existing = roomUsers.find(ru => ru.userId === userId && ru.roomId === roomId);
    if (!existing) {
      roomUsers.push({
        id: Math.random().toString(36).substr(2, 9),
        roomId,
        userId,
        role: 'VIEWER'
      });
    }

    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join room' });
  }
});

router.put('/:roomId/role', authMiddleware, async (req, res) => {
  res.json({ success: true });
});

const snapshotStore: Record<string, any[]> = {};

router.get('/:id/snapshots', (req, res) => {
  const roomId = req.params.id;
  res.json(snapshotStore[roomId] || []);
});

router.post('/:id/snapshots', (req, res) => {
  const roomId = req.params.id;
  const { content } = req.body;
  if (!snapshotStore[roomId]) snapshotStore[roomId] = [];
  
  const snapshot = { 
    id: Math.random().toString(36).substr(2, 9), 
    content, 
    timestamp: new Date().toISOString() 
  };
  snapshotStore[roomId].push(snapshot);
  
  if (snapshotStore[roomId].length > 20) {
    snapshotStore[roomId].shift();
  }
  
  res.json(snapshot);
});

export default router;
