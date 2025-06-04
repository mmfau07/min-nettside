const express = require('express');
const app = express();
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs');
const sqlite3 = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new sqlite3('database.db', { verbose: console.log });

db.exec(fs.readFileSync('structure.sql').toString());

// Middleware
app.use(express.json());
app.use(cors());

const port = 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
    
    connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
    }
})

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Get user from database
        const stmt = db.prepare('SELECT * FROM Users WHERE username = ?');
        const user = stmt.get(username);
    
        if (!user) {
            return res.status(401).json({ ok: false, message: 'Invalid username or password' });
        }

        // Compare the provided password with the hashed password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ ok: false, message: 'Invalid username or password' });
        }

        // Generate a random token
        const token = Math.floor(Math.random() * 36940850).toString(16) + Math.floor(Math.random() * 7263784627).toString(16)+ Math.floor(Math.random() * 13943940).toString(16);

        // Set token expiry to 24 hour from now
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // Update user's token and token expiry in the database
        const stmtToken = db.prepare('UPDATE Users SET token = ?, token_expiry = ? WHERE username = ?');
        const result = stmtToken.run(token, tokenExpiry, username);

        if (result.changes === 0) {
            return res.status(500).json({ ok: false, message: 'Failed to update token' });
        }

        const saltRounds = 12;
        const hashedToken = await bcrypt.hash(token, saltRounds);
    
        return res.json({ ok: true, message: 'Login successful', username: username, token: hashedToken });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ ok: false, message: 'Internal server error' });
    }

})

app.post('/api/createUser', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = db.prepare('SELECT username FROM Users WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(409).json({ ok: false, message: 'User already exists' });
        }

        // Hash the password before storing it
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate a random token
        const token = Math.floor(Math.random() * 36940850).toString(16) + Math.floor(Math.random() * 7263784627).toString(16)+ Math.floor(Math.random() * 13943940).toString(16);

        // Set token expiry to 24 hour from now
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        
        // Insert user with hashed password
        const stmt = db.prepare('INSERT INTO Users (username, password, token, token_expiry) VALUES (?, ?, ?, ?)');
        const result = stmt.run(username, hashedPassword, token, tokenExpiry);
        
        // Check if insertion was successful using the result
        if (result.changes === 1) {
            const saltRounds = 12;
            const hashedToken = await bcrypt.hash(token, saltRounds);

            return res.status(201).json({ ok: true, message: 'User created successfully', username: username, token: hashedToken });
        } else {
            return res.status(500).json({ ok: false, message: 'Failed to create user' });
        }

    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ ok: false, message: 'Internal server error' });
    }
})

app.post('/api/checkCookie', async (req, res) => {
    const { username, token } = req.body;
    
    try {
        // Get user from database
        const stmt = db.prepare('SELECT token, token_expiry FROM Users WHERE username = ?');
        const user = stmt.get(username);
    
        if (!user) {
            return res.status(401).json({ ok: false, message: 'Invalid username or token' });
        }

        // Compare the hashed provided token with the token in the database
        bcrypt.compare(user.token, token, (err, isValid) => {
            if (err || !isValid) {
                return res.status(401).json({ ok: true, message: 'Invalid username or token', validToken: false });
            }

            // Check if the token has expired
            const now = new Date();
            const tokenExpiry = new Date(user.token_expiry);
            if (now > tokenExpiry) {
                return res.status(401).json({ ok: true, message: 'Token has expired', validToken: false });
            }

            return res.json({ ok: true, message: 'Token is valid', validToken: true });
        });

    } catch (error) {
        console.error('Error checking cookie:', error);
        return res.status(500).json({ ok: false, message: 'Internal server error' });
    }
})

server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})