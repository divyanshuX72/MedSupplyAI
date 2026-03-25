const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createUser() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'medicinesupply_ai'
    });

    const password = 'User@123';
    const hash = await bcrypt.hash(password, 10);

    await connection.execute(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['User1', 'user@medsupply.com', hash, 'user']
    );

    const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', ['user@medsupply.com']);
    const userId = rows[0].id;

    await connection.execute(
        'INSERT INTO user_profiles (user_id, hospital_name) VALUES (?, ?)',
        [userId, 'General Hospital']
    );

    console.log('User created successfully!');
    console.log('Email: user@medsupply.com');
    console.log('Password: User@123');
    console.log('Role: user');

    await connection.end();
}

createUser().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
