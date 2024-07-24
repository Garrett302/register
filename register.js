const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(bodyParser.json());
app.use(cookieParser());

const dbConfig = {
  host: '44.212.120.131',
  user: 'user',
  password: 'password',
  database: 'db',
  port: 3306,
};

let connection;

function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      setTimeout(handleDisconnect, 2000); // Retry connection after 2 seconds
    } else {
      console.log('MySQL Connected...');
    }
  });

  connection.on('error', (err) => {
    console.error('MySQL error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect(); // Reconnect if the connection is lost
    } else {
      throw err;
    }
  });
}

handleDisconnect();

// Secret key for JWT
const JWT_SECRET = 'imgay'; // Replace with your actual secret

// Register endpoint
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  connection.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ message: 'Error hashing password', error: err.message });
      }

      const newUser = { username, password: hashedPassword, email };
      connection.query('INSERT INTO users SET ?', newUser, (err, result) => {
        if (err) {
          console.error('Error inserting user into database:', err);
          return res.status(500).json({ message: 'Server error', error: err.message });
        }

        // Create a token
        const token = jwt.sign({ id: result.insertId, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });

        // Set the token as a cookie
        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'Lax', path:'/' });

        res.status(201).json({ message: 'User registered successfully', token });
      });
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
