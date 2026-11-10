import { Request, Response } from 'express';
import { pool } from '../config/db';

// Get user profile and current wallet balance
export const getUserProfile = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const userResult = await pool.query(
      'SELECT id, username, email, phone_number, balance, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch user's transaction history
    const txResult = await pool.query(
      'SELECT amount, type, status, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      user: userResult.rows[0],
      transactions: txResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};