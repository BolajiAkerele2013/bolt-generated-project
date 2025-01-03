import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();

// Delete existing database
const dbPath = join(__dirname, 'database.sqlite');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Existing database deleted');
}

// Enable CORS for all origins in development
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        skills TEXT DEFAULT '[]',
        interests TEXT DEFAULT '[]',
        portfolio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ideas table
    db.run(`
      CREATE TABLE IF NOT EXISTS ideas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        problem_category TEXT NOT NULL,
        solution TEXT NOT NULL,
        visibility TEXT DEFAULT 'private',
        owner_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users (id)
      )
    `);

    // User roles for ideas
    db.run(`
      CREATE TABLE IF NOT EXISTS idea_users (
        id TEXT PRIMARY KEY,
        idea_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        equity_percentage REAL,
        debt_amount REAL,
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (idea_id) REFERENCES ideas (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    console.log('Database tables initialized');
  });
}

// Auth routes
app.post('/api/auth/signup', (req, res) => {
  console.log('Signup request received:', req.body);
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const id = Math.random().toString(36).substr(2, 9);

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error during signup' });
    }

    if (row) {
      return res.status(400).json({ error: 'User already exists' });
    }

    db.run(
      'INSERT INTO users (id, email, password, name, skills, interests) VALUES (?, ?, ?, ?, ?, ?)',
      [id, email, password, name, '[]', '[]'],
      (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Server error during signup' });
        }

        const token = Buffer.from(id).toString('base64');
        res.status(201).json({
          user: {
            id,
            email,
            name,
            skills: '[]',
            interests: '[]'
          },
          token
        });
      }
    );
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error during login' });
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = Buffer.from(user.id).toString('base64');
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  });
});

// Ideas routes
app.get('/api/ideas', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const userId = Buffer.from(token, 'base64').toString();

  console.log('Fetching ideas for user:', userId);

  db.all(`
    SELECT 
      i.*,
      iu.role as userRole,
      iu.equity_percentage as equityPercentage,
      iu.debt_amount as debtAmount,
      (
        SELECT COUNT(*)
        FROM idea_users
        WHERE idea_id = i.id
      ) as teamSize
    FROM ideas i
    JOIN idea_users iu ON i.id = iu.idea_id
    WHERE iu.user_id = ?
    ORDER BY i.created_at DESC
  `, [userId], (err, ideas) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    console.log('Found ideas:', ideas);
    res.json(ideas || []);
  });
});

app.get('/api/ideas/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const userId = Buffer.from(token, 'base64').toString();
  const ideaId = req.params.id;

  db.get(`
    SELECT 
      i.*,
      iu.role as userRole,
      iu.equity_percentage as equityPercentage,
      iu.debt_amount as debtAmount,
      (
        SELECT COUNT(*)
        FROM idea_users
        WHERE idea_id = i.id
      ) as teamSize
    FROM ideas i
    JOIN idea_users iu ON i.id = iu.idea_id
    WHERE i.id = ? AND iu.user_id = ?
  `, [ideaId, userId], (err, idea) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    res.json(idea);
  });
});

app.post('/api/ideas', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const userId = Buffer.from(token, 'base64').toString();
  const { name, description, problemCategory, solution, visibility } = req.body;

  const ideaId = Math.random().toString(36).substr(2, 9);
  const roleId = Math.random().toString(36).substr(2, 9);

  db.serialize(() => {
    db.run(`
      INSERT INTO ideas (
        id, name, description, problem_category, solution,
        visibility, owner_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [ideaId, name, description, problemCategory, solution, visibility, userId], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to create idea' });
      }

      db.run(`
        INSERT INTO idea_users (
          id, idea_id, user_id, role, equity_percentage
        ) VALUES (?, ?, ?, ?, ?)
      `, [roleId, ideaId, userId, 'IDEA_OWNER', 100], (err) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to assign role' });
        }

        res.status(201).json({
          id: ideaId,
          name,
          description,
          problemCategory,
          solution,
          visibility,
          ownerId: userId,
          userRole: 'IDEA_OWNER',
          equityPercentage: 100,
          teamSize: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    });
  });
});

app.put('/api/ideas/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const userId = Buffer.from(token, 'base64').toString();
  const ideaId = req.params.id;
  const { name, description, problemCategory, solution, visibility } = req.body;

  // Check if user has permission to edit
  db.get(`
    SELECT role FROM idea_users
    WHERE idea_id = ? AND user_id = ? AND role IN ('IDEA_OWNER', 'EQUITY_OWNER')
  `, [ideaId, userId], (err, permission) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (!permission) {
      return res.status(403).json({ error: 'Not authorized to edit this idea' });
    }

    db.run(`
      UPDATE ideas
      SET name = ?, description = ?, problem_category = ?, 
          solution = ?, visibility = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, problemCategory, solution, visibility, ideaId], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update idea' });
      }

      // Return updated idea
      db.get(`
        SELECT 
          i.*,
          iu.role as userRole,
          iu.equity_percentage as equityPercentage,
          iu.debt_amount as debtAmount,
          (
            SELECT COUNT(*)
            FROM idea_users
            WHERE idea_id = i.id
          ) as teamSize
        FROM ideas i
        JOIN idea_users iu ON i.id = iu.idea_id
        WHERE i.id = ? AND iu.user_id = ?
      `, [ideaId, userId], (err, idea) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        res.json(idea);
      });
    });
  });
});

// Start server
const port = 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
