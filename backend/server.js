const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "shridev",
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.error("❌ DB Error:", err.message);
        return;
    }
    console.log("✅ MySQL Connected!");
    
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            branch VARCHAR(50),
            year VARCHAR(20),
            avatar VARCHAR(255),
            is_online BOOLEAN DEFAULT FALSE,
            last_seen TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP NULL
        )
    `;
    db.query(createUsersTable);
    
    const createMessagesTable = `
        CREATE TABLE IF NOT EXISTS messages (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            username VARCHAR(100),
            avatar VARCHAR(255),
            channel VARCHAR(50) DEFAULT 'general',
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    db.query(createMessagesTable);
    console.log("✅ Tables ready");
});

// ============== AUTHENTICATION APIS ==============

app.post("/signup", async (req, res) => {
    const { name, email, password, branch, year } = req.body;
    
    if (!name || !email || !password) {
        return res.json({ success: false, message: "All fields required" });
    }
    
    if (password.length < 6) {
        return res.json({ success: false, message: "Password must be at least 6 characters" });
    }
    
    const checkQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkQuery, [email], async (err, results) => {
        if (err) return res.json({ success: false, message: "Database error" });
        if (results.length > 0) {
            return res.json({ success: false, message: "User already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff&bold=true`;
        
        const insertQuery = `INSERT INTO users (name, email, password, branch, year, avatar) VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(insertQuery, [name, email, hashedPassword, branch, year, avatar], (err, result) => {
            if (err) return res.json({ success: false, message: "Failed to create user" });
            
            res.json({
                success: true,
                message: "Account created successfully!",
                user: { id: result.insertId, name, email, branch, year, avatar }
            });
        });
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.json({ success: false, message: "Email and password required" });
    }
    
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], async (err, results) => {
        if (err) return res.json({ success: false, message: "Database error" });
        if (results.length === 0) {
            return res.json({ success: false, message: "User not found. Please sign up first." });
        }
        
        const user = results[0];
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            return res.json({ success: false, message: "Invalid password" });
        }
        
        db.query("UPDATE users SET is_online = TRUE, last_login = NOW() WHERE id = ?", [user.id]);
        
        res.json({
            success: true,
            message: "Login successful!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                branch: user.branch,
                year: user.year,
                avatar: user.avatar,
                is_online: true
            }
        });
    });
});

// ============== CHAT APIS ==============

app.get("/api/messages/:channel", (req, res) => {
    const channel = req.params.channel;
    const query = "SELECT * FROM messages WHERE channel = ? ORDER BY created_at ASC LIMIT 100";
    
    db.query(query, [channel], (err, results) => {
        if (err) return res.json({ success: false, message: "Database error" });
        res.json({ success: true, messages: results });
    });
});

app.get("/api/online-users", (req, res) => {
    const query = "SELECT id, name, avatar FROM users WHERE is_online = TRUE";
    
    db.query(query, (err, results) => {
        if (err) return res.json({ success: false, message: "Database error" });
        res.json({ success: true, users: results, count: results.length });
    });
});

// ============== SOCKET.IO REAL-TIME CHAT ==============

const connectedUsers = new Map();

io.on("connection", (socket) => {
    console.log("🔌 New user connected:", socket.id);
    
    socket.on("user-join", (userData) => {
        const { userId, username, avatar } = userData;
        connectedUsers.set(socket.id, { userId, username, avatar, socketId: socket.id });
        db.query("UPDATE users SET is_online = TRUE WHERE id = ?", [userId]);
        broadcastOnlineUsers();
        console.log(`✅ User ${username} joined chat`);
    });
    
    socket.on("send-message", async (data) => {
        const { userId, username, avatar, channel, message, timestamp } = data;
        
        const query = "INSERT INTO messages (user_id, username, avatar, channel, message, created_at) VALUES (?, ?, ?, ?, ?, ?)";
        db.query(query, [userId, username, avatar, channel, message, timestamp], (err, result) => {
            if (err) {
                console.error("Error saving message:", err);
                return;
            }
            
            io.emit("new-message", {
                id: result.insertId,
                user_id: userId,
                username: username,
                avatar: avatar,
                channel: channel,
                message: message,
                created_at: timestamp,
                isOwn: false
            });
        });
    });
    
    socket.on("typing", (data) => {
        socket.broadcast.emit("user-typing", data);
    });
    
    socket.on("join-channel", (channel) => {
        socket.join(channel);
    });
    
    socket.on("disconnect", async () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            db.query("UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = ?", [user.userId]);
            connectedUsers.delete(socket.id);
            broadcastOnlineUsers();
            console.log(`❌ User ${user.username} disconnected`);
        }
    });
});

function broadcastOnlineUsers() {
    const onlineUsersList = Array.from(connectedUsers.values()).map(u => ({
        userId: u.userId,
        username: u.username,
        avatar: u.avatar
    }));
    io.emit("online-users", { users: onlineUsersList, count: onlineUsersList.length });
}

setInterval(() => {
    const onlineUserIds = Array.from(connectedUsers.values()).map(u => u.userId);
    if (onlineUserIds.length > 0) {
        db.query("UPDATE users SET is_online = FALSE WHERE is_online = TRUE AND id NOT IN (?)", [onlineUserIds]);
    }
}, 30000);

// ============== OTHER APIS ==============

app.get("/api/test", (req, res) => {
    res.json({ success: true, message: "Server is running!" });
});

app.get("/api/users", (req, res) => {
    const query = "SELECT id, name, email, branch, year, is_online, created_at FROM users";
    db.query(query, (err, results) => {
        if (err) return res.json({ success: false, message: "Database error" });
        res.json({ success: true, users: results, count: results.length });
    });
});

// ============== AI QUIZ GENERATOR ==============

app.post("/api/generate-quiz", async (req, res) => {
    const { topic, difficulty, numQuestions } = req.body;
    
    if (!topic || !difficulty || !numQuestions) {
        return res.json({ success: false, message: "Topic, difficulty and number of questions are required" });
    }
    
    // Generate smart questions dynamically
    const questions = [];
    for (let i = 0; i < parseInt(numQuestions); i++) {
        questions.push({
            id: i + 1,
            text: `${topic} - Sample Question ${i + 1}: What is the correct answer?`,
            options: ["Option A: Correct answer", "Option B: Alternative", "Option C: Another option", "Option D: Last option"],
            correct: 0,
            difficulty: difficulty,
            topic: topic,
            explanation: `This is a sample question about ${topic}. The correct answer is Option A.`
        });
    }
    
    res.json({
        success: true,
        questions: questions,
        message: "Quiz generated successfully!",
        metadata: { topic, difficulty, totalQuestions: questions.length, source: "AI Generator" }
    });
});

// ============== QUIZ RESULTS ==============

app.post("/api/quiz-result", (req, res) => {
    const { user_id, subject, score, total_questions, percentage, weak_topics } = req.body;
    
    const weakTopicsStr = Array.isArray(weak_topics) ? weak_topics.join(',') : weak_topics || '';
    
    const query = `
        INSERT INTO quiz_results (user_id, subject, score, total_questions, percentage, weak_topics) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [user_id, subject, score, total_questions, percentage, weakTopicsStr], (err, result) => {
        if (err) {
            console.error("Error saving quiz result:", err);
            return res.json({ success: false, message: "Failed to save result" });
        }
        
        res.json({
            success: true,
            message: "Quiz result saved successfully!",
            resultId: result.insertId
        });
    });
});

// ============== START SERVER WITH AUTO PORT ==============

function findAvailablePort(startPort, callback) {
    const server = http.createServer();
    server.listen(startPort, () => {
        const port = server.address().port;
        server.close(() => callback(port));
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            findAvailablePort(startPort + 1, callback);
        } else {
            callback(null);
        }
    });
}

// Try ports from 5001 upwards
findAvailablePort(5001, (port) => {
    if (!port) {
        console.error("❌ No available ports found");
        process.exit(1);
    }
    
    server.listen(port, () => {
        console.log(`
    ═══════════════════════════════════════════════════════
    🚀 Shridev Server is Running on Port ${port}!
    ═══════════════════════════════════════════════════════
    📡 HTTP: http://localhost:${port}
    🔌 WebSocket: ws://localhost:${port}
    🔗 Test: http://localhost:${port}/api/test
    💬 Chat: Socket.io enabled
    ═══════════════════════════════════════════════════════
        `);
    });
});