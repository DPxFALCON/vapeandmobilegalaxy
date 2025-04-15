const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Your JSONBin credentials
const BIN_ID = '67fe38158a456b796689c2d9';
const MASTER_KEY = '$2a$10$qG60Y84N25Q9XwglO2cNxO8pEG/GjvUfLWKXRqZMuwBuFUiVgaXy2';
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 🔄 Load users from JSONBin
async function loadUsers() {
  try {
    const res = await axios.get(BASE_URL, {
      headers: {
        'X-Master-Key': MASTER_KEY
      }
    });
    return res.data.record || [];
  } catch (err) {
    console.error('Error loading users:', err.message);
    return [];
  }
}

// 📂 Save users to JSONBin
async function saveUsers(users) {
  try {
    await axios.put(BASE_URL, users, {
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': MASTER_KEY,
        'X-Bin-Versioning': false
      }
    });
  } catch (err) {
    console.error('Error saving users:', err.message);
  }
}

// 🏠 Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 👤 Register
app.post('/register', async (req, res) => {
  const { username, password, phone } = req.body;
  if (!username || !password || !phone) return res.status(400).send('Missing fields');

  let users = await loadUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).send('User already exists');
  }

  users.push({ username, password, phone, stamps: 0, role: 'customer' });
  await saveUsers(users);
  res.redirect('/login.html');
});

// 🔐 Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = await loadUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) return res.status(401).send('Invalid credentials');

  const target = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
  res.redirect(`/${target}?user=${user.username}`);
});

// 👨‍💼 Admin Login
app.post('/adminLogin', async (req, res) => {
  const { username, password } = req.body;
  const users = await loadUsers();
  const user = users.find(u => u.username === username && u.password === password && u.role === 'admin');

  if (!user) return res.status(401).send('Invalid admin credentials');
  res.redirect(`/admin.html?user=${user.username}`);
});

// 📄 Get all customers
app.get('/api/users', async (req, res) => {
  const users = await loadUsers();
  res.json(users.filter(u => u.role === 'customer'));
});

// 👤 Get specific user
app.get('/api/user/:username', async (req, res) => {
  const users = await loadUsers();
  const user = users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).send('User not found');
  res.json(user);
});

// ✍️ Update stamps
app.post('/api/updateStamps', async (req, res) => {
  const { username, stamps } = req.body;
  const users = await loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).send('User not found');

  user.stamps = stamps;
  await saveUsers(users);
  res.send('Stamps updated');
});

// ▶️ Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
