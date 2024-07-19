const mysql = require('mysql2');

const dbConfig = {
  host: 'ec2-44-212-120-131.compute-1.amazonaws.com',   // e.g., 'localhost' or the IP address of your DB server
  user: 'user',   // e.g., 'root'
  password: 'password',  // your database password
  database: 'db',  // your database name
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




const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Check if the user already exists
  connection.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, results) => {
    if (err) {
      console.error('Error querying database:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ message: 'Error hashing password', error: err.message });
      }

      // Insert the new user into the database
      const newUser = { username, password: hashedPassword, email };
      connection.query('INSERT INTO users SET ?', newUser, (err, result) => {
        if (err) {
          console.error('Error inserting user into database:', err);
          return res.status(500).json({ message: 'Server error', error: err.message });
        }
        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
