
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files

const usersFile = path.join(__dirname, 'users.json');

function loadUsers() {
    if (!fs.existsSync(usersFile)) return [];
    const data = fs.readFileSync(usersFile);
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Register
app.post('/register', (req, res) => {
    const { username, password, phone } = req.body;
    if (!username || !password || !phone) return res.status(400).send('Missing fields');

    let users = loadUsers();
    if (users.find(u => u.username === username)) {
        return res.status(400).send('User already exists');
    }
    users.push({ username, password, phone, stamps: 0, role: 'customer' });
    saveUsers(users);
    res.redirect('/login.html');
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).send('Invalid credentials');

    if (user.role === 'admin') {
        res.redirect('/admin.html?user=' + user.username);
    } else {
        res.redirect('/dashboard.html?user=' + user.username);
    }
});

// Admin Login
app.post('/adminLogin', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password && u.role === 'admin');
    if (!user) return res.status(401).send('Invalid admin credentials');
    res.redirect('/admin.html?user=' + user.username);
});

// API to get user info
app.get('/api/user/:username', (req, res) => {
    const users = loadUsers();
    const user = users.find(u => u.username === req.params.username);
    if (!user) return res.status(404).send('User not found');
    res.json(user);
});

// API to update stamp count
app.post('/api/updateStamps', (req, res) => {
    const { username, stamps } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).send('User not found');
    user.stamps = stamps;
    saveUsers(users);
    res.send('Stamps updated');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
