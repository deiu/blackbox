import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Serve static files from the public directory (built client)
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage: Map<id, { data, iv, createdAt, expiresAt, maxViews, currentViews, type, fileName, mimeType }>
const secrets = new Map();

// Garbage Collection: Remove expired secrets every minute
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [id, secret] of secrets.entries()) {
    if (secret.expiresAt && now > secret.expiresAt) {
      secrets.delete(id);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[GARBAGE COLLECTION] Removed ${cleanedCount} expired secrets.`);
  }
}, 60 * 1000);

// Helper to generate random ID
const generateId = () => crypto.randomBytes(8).toString('hex');

// POST /api/secrets - Store a new secret
app.post('/api/secrets', async (req, res) => {
  const { data, iv, timeLimit, viewLimit, type, fileName, mimeType } = req.body;

  if (!data || !iv) {
    return res.status(400).json({ error: 'Missing data or IV' });
  }

  const id = generateId();
  const now = Date.now();

  // Calculate expiration time (timeLimit is in minutes)
  const expiresAt = timeLimit ? now + (timeLimit * 60 * 1000) : null;

  const secret = {
    data,
    iv,
    createdAt: now,
    expiresAt,
    maxViews: viewLimit === -1 ? null : viewLimit, // -1 means unlimited
    currentViews: 0,
    type: type || 'text',
    fileName,
    mimeType
  };

  secrets.set(id, secret);

  console.log(`[SECRET CREATED] ID: ${id}, Type: ${secret.type}, Expires: ${expiresAt ? new Date(expiresAt).toISOString() : 'Never'}, Views: ${secret.maxViews}`);

  res.json({ id });
});

// GET /api/secrets/:id - Retrieve a secret
app.get('/api/secrets/:id', (req, res) => {
  const { id } = req.params;

  if (!secrets.has(id)) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  const secret = secrets.get(id);
  const now = Date.now();

  // Check Expiration
  if (secret.expiresAt && now > secret.expiresAt) {
    secrets.delete(id); // Cleanup
    return res.status(410).json({ error: 'EXPIRED' });
  }

  // Check View Limit
  if (secret.maxViews !== null && secret.currentViews >= secret.maxViews) {
    secrets.delete(id); // Cleanup 
    return res.status(410).json({ error: 'BURNED' });
  }

  // Increment View Count
  secret.currentViews++;

  if (secret.maxViews !== null && secret.currentViews >= secret.maxViews) {
    secrets.delete(id); // This is the last allowed view, so burn it.
    console.log(`[SECRET BURNED] ID: ${id} reached view limit.`);
  } else {
    secrets.set(id, secret);
  }

  res.json({
    data: secret.data,
    iv: secret.iv,
    createdAt: secret.createdAt,
    expiresAt: secret.expiresAt,
    maxViews: secret.maxViews,
    currentViews: secret.currentViews,
    type: secret.type,
    fileName: secret.fileName,
    mimeType: secret.mimeType
  });
});

// Serve index.html for all other routes (SPA fallback)
// Serve index.html for all other routes (SPA fallback)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Secure Backend running on port: ${port}`);
});
