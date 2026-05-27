const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

const APPS_DIR = path.join(__dirname, 'apps');
const CATALOG_PATH = path.join(__dirname, 'catalog.json');

// Ensure apps directory exists
if (!fs.existsSync(APPS_DIR)) {
  fs.mkdirSync(APPS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

function readCatalog() {
  try {
    const data = fs.readFileSync(CATALOG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeCatalog(catalog) {
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
}

// GET /api/catalog - returns the app catalog
app.get('/api/catalog', (req, res) => {
  try {
    const catalog = readCatalog();
    res.json({ apps: catalog });
  } catch (err) {
    console.error('Error reading catalog:', err);
    res.status(500).json({ error: 'Failed to read catalog' });
  }
});

// GET /api/apps/:id - returns app.json for a specific app
app.get('/api/apps/:id', (req, res) => {
  try {
    const { id } = req.params;
    const appJsonPath = path.join(APPS_DIR, id, 'app.json');
    if (!fs.existsSync(appJsonPath)) {
      return res.status(404).json({ error: 'App not found' });
    }
    const appData = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    res.json({ app: appData });
  } catch (err) {
    console.error('Error reading app:', err);
    res.status(500).json({ error: 'Failed to read app data' });
  }
});

// Serve static files from ./apps/ at route /apps/:appId/*
app.use('/apps', express.static(APPS_DIR, {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.html')) {
      res.set('Content-Type', 'text/html');
    }
  }
}));

// POST /api/upload - accepts multipart upload of a zip/tar and extracts to ./apps/
const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.post('/api/upload', upload.single('app'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const appId = req.body.id || uuidv4();
    const appDir = path.join(APPS_DIR, appId);

    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const uploadedPath = req.file.path;

    try {
      if (ext === '.zip') {
        execSync('unzip -o "' + uploadedPath + '" -d "' + appDir + '"', { stdio: 'pipe' });
      } else if (ext === '.tar' || ext === '.tgz' || ext === '.tar.gz') {
        execSync('tar -xzf "' + uploadedPath + '" -C "' + appDir + '"', { stdio: 'pipe' });
      } else if (ext === '.tar.bz2') {
        execSync('tar -xjf "' + uploadedPath + '" -C "' + appDir + '"', { stdio: 'pipe' });
      } else {
        // Treat as a single file, copy it to the app directory
        const destPath = path.join(appDir, req.file.originalname);
        const resolvedDest = path.resolve(destPath);
        if (!resolvedDest.startsWith(path.resolve(APPS_DIR))) {
          throw new Error('Invalid destination path');
        }
        fs.copyFileSync(uploadedPath, resolvedDest);
      }
    } finally {
      // Clean up uploaded temp file
      try { fs.unlinkSync(uploadedPath); } catch { /* ignore */ }
    }

    // If the extracted folder has an app.json, add it to catalog
    const appJsonPath = path.join(appDir, 'app.json');
    if (fs.existsSync(appJsonPath)) {
      const appData = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      const catalog = readCatalog();
      const existingIndex = catalog.findIndex(a => a.id === appId);
      const entry = {
        id: appData.id || appId,
        name: appData.name || 'Unnamed App',
        description: appData.description || '',
        icon: appData.icon || null,
        version: appData.version || '1.0.0',
        addedAt: new Date().toISOString()
      };
      if (existingIndex >= 0) {
        catalog[existingIndex] = { ...catalog[existingIndex], ...entry };
      } else {
        catalog.push(entry);
      }
      writeCatalog(catalog);
      return res.json({ success: true, app: entry });
    }

    res.json({ success: true, appId });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// POST /api/apps - creates a new app entry in catalog.json
app.post('/api/apps', (req, res) => {
  try {
    const { id, name, description, icon, version } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }

    const catalog = readCatalog();
    const existingIndex = catalog.findIndex(a => a.id === id);

    const appEntry = {
      id,
      name,
      description: description || '',
      icon: icon || null,
      version: version || '1.0.0',
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      catalog[existingIndex] = { ...catalog[existingIndex], ...appEntry, updatedAt: new Date().toISOString() };
    } else {
      appEntry.addedAt = new Date().toISOString();
      catalog.push(appEntry);
    }

    writeCatalog(catalog);
    res.json({ success: true, app: appEntry });
  } catch (err) {
    console.error('Create app error:', err);
    res.status(500).json({ error: 'Failed to create app' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`App Store Server running on http://0.0.0.0:${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
});
