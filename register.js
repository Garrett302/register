const express = require('express');

const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'ec2-3-88-248-131.compute-1.amazonaws.com',     
  user: 'user', // The user should be 'root' or the username without the IP
  password: 'password',  
  database: 'db',   
  port: 3306,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);  // Exit with a failure status code
  }
  console.log('MySQL Connected...');
});

// Registration endpoint
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Check if the user already exists
  db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, results) => {
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
      db.query('INSERT INTO users SET ?', newUser, (err, result) => {
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
