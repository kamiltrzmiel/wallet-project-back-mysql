import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorRequest } from '../assets/errorMessages.js';

dotenv.config();

const secKey = process.env.SECRET_KEY;

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const connection = await pool.getConnection();

    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      throw errorRequest(409, 'Email in use');
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashPassword]
    );

    res.status(201).json({
      name: result.name,
      email: result.email,
      subscription: result.subscription,
    });

    connection.release();
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    connection.release();

    if (rows.length === 0) {
      throw errorRequest(401, 'Email or password is wrong');
    }

    const user = rows[0];
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw errorRequest(401, 'Email or password is wrong');
    }

    const payload = {
      id: user.id,
    };

    const token = jwt.sign(payload, secKey, { expiresIn: '12h' });

    const updateQuery = `UPDATE users SET token = ? WHERE id = ?`;
    await pool.execute(updateQuery, [token, user.id]);

    res.status(200).json({
      message: 'Login success',
      token,
      name: user.name,
      email: user.email,
      id: user.id,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
};

export const getCurrent = async (req, res) => {
  try {
    const { user_id } = req.user;
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT name, email, subscription FROM users WHERE id = ?',
      [user_id]
    );
    connection.release();

    if (rows.length === 0) {
      throw new Error('User not found');
    }

    const { name, email, subscription } = rows[0];

    res.status(200).json({
      name,
      email,
      subscription,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
  }
};

export const profile = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT name, token FROM users WHERE id = ?', [
      req.user.id,
    ]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, token } = rows[0];

    res.status(200).json({ name, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Get user profile failed' });
  }
};

export const logout = async (req, res) => {
  try {
    const { _id } = req.user;
    const connection = await pool.getConnection();
    await connection.execute('UPDATE users SET token = "" WHERE id = ?', [_id]);
    connection.release();
    res.status(200).json({
      message: 'Logout success',
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message || 'Internal Server Error',
    });
  }
};
