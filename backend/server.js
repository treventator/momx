const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises; // Use promises version of fs
const path = require('path'); // To construct file paths
const crypto = require('crypto'); // For generating simple IDs

const app = express();
const port = 4455; // Port for the backend server

const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// --- Hardcoded Credentials (Replace with a secure method later) ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';

// --- Middleware ---
// Enable CORS for requests from the frontend (adjust origin in production)
app.use(cors());
// Parse JSON request bodies
app.use(bodyParser.json());
// Parse URL-encoded request bodies (for form submissions)
app.use(bodyParser.urlencoded({ extended: true }));

// --- Authentication Middleware (Placeholder) ---
// This should check for a valid session or token in a real app
const requireAuth = (req, res, next) => {
  // For now, let's just assume logged in if a specific header exists (VERY insecure, for demo only)
  // In a real app, verify a JWT token or session cookie
  console.log('Auth middleware check');
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth failed: Missing or invalid Authorization header');
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  // Basic token check (replace with real JWT verification)
  if (!token || !token.startsWith('admin-token-')) { 
    console.log('Auth failed: Invalid token format');
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }

  // In a real app, you would verify the token's signature and expiration
  console.log('Auth successful for token:', token);
  next(); // Allow request to proceed
};

// --- Helper Functions for JSON DB ---
const readProducts = async () => {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error("Error reading products file:", error);
    throw new Error('Could not read product data');
  }
};

const writeProducts = async (products) => {
  try {
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing products file:", error);
    throw new Error('Could not save product data');
  }
};

// --- API Endpoints ---

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt:', { username }); // Log attempts for debugging

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Authentication successful
    console.log('Login successful for:', username);
    // Generate a simple placeholder token (replace with JWT)
    const token = `admin-token-${Date.now()}`;
    res.status(200).json({ success: true, message: 'Login successful', token: token }); // Return token
  } else {
    // Authentication failed
    console.log('Login failed for:', username);
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// --- Product API Endpoints ---

// GET /api/products - Get all products
app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const products = await readProducts();
    res.status(200).json({ success: true, products });
  } catch (error) { 
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products - Add a new product
app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const products = await readProducts();
    const newProduct = {
      id: `prod_${crypto.randomBytes(4).toString('hex')}`, // Generate simple unique ID
      ...req.body, // Spread properties from request body
    };
    // Basic validation (improve as needed)
    if (!newProduct.name || !newProduct.price) {
        return res.status(400).json({ success: false, message: 'Product name and price are required.' });
    }
    products.push(newProduct);
    await writeProducts(products);
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id - Update a product
app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    const products = await readProducts();
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updatedProduct = {
      ...products[productIndex], // Keep existing properties
      ...req.body,             // Override with new properties
      id: productId,           // Ensure ID doesn't change
    };
    // Basic validation
    if (!updatedProduct.name || !updatedProduct.price) {
        return res.status(400).json({ success: false, message: 'Product name and price are required.' });
    }

    products[productIndex] = updatedProduct;
    await writeProducts(products);
    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    let products = await readProducts();
    const initialLength = products.length;
    products = products.filter(p => p.id !== productId);

    if (products.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await writeProducts(products);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add health check endpoint for monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
