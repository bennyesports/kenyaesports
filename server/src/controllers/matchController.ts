import { Request, Response } from 'express';
import { pool } from '../config/db';

// Create a new match challenge
export const createMatch = async (req: Request, res: Response) => {
  const { creator_id, stake_amount } = req.body;

  try {
    // 1. Verify creator exists and check their balance
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [creator_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userBalance = parseFloat(userResult.rows[0].balance);
    if (userBalance < parseFloat(stake_amount)) {
      return res.status(400).json({ message: 'Insufficient balance to create match' });
    }

    // 2. Insert match into DB
    const newMatch = await pool.query(
      'INSERT INTO matches (creator_id, stake_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [creator_id, stake_amount, 'pending']
    );

    res.status(201).json({
      message: 'Match created successfully',
      match: newMatch.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating match' });
  }
};

// Get all open (pending) matches available for joining
export const getPendingMatches = async (req: Request, res: Response) => {
  try {
    const matches = await pool.query(
      `SELECT m.id, m.stake_amount, m.created_at, u.username AS creator_username 
       FROM matches m 
       JOIN users u ON m.creator_id = u.id 
       WHERE m.status = 'pending' 
       ORDER BY m.created_at DESC`
    );

    res.json({ matches: matches.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching matches' });
  }
};

// Opponent joins an existing pending match
export const joinMatch = async (req: Request, res: Response) => {
  const { match_id, opponent_id } = req.body;

  try {
    // 1. Check if match exists and is pending
    const matchResult = await pool.query('SELECT * FROM matches WHERE id = $1', [match_id]);
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const match = matchResult.rows[0];

    if (match.status !== 'pending') {
      return res.status(400).json({ message: 'Match is no longer open' });
    }

    if (match.creator_id === parseInt(opponent_id)) {
      return res.status(400).json({ message: 'Cannot join your own match' });
    }

    // 2. Verify opponent balance
    const opponentResult = await pool.query('SELECT balance FROM users WHERE id = $1', [opponent_id]);
    if (opponentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Opponent user not found' });
    }

    const opponentBalance = parseFloat(opponentResult.rows[0].balance);
    if (opponentBalance < parseFloat(match.stake_amount)) {
      return res.status(400).json({ message: 'Insufficient balance to join match' });
    }

    // 3. Update match status to active and assign opponent
    const updatedMatch = await pool.query(
      'UPDATE matches SET opponent_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [opponent_id, 'active', match_id]
    );

    res.json({
      message: 'Joined match successfully',
      match: updatedMatch.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while joining match' });
  }
};

// Complete a match and set winner
export const completeMatch = async (req: Request, res: Response) => {
  const { match_id, winner_id } = req.body;

  try {
    const matchResult = await pool.query('SELECT * FROM matches WHERE id = $1', [match_id]);
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const match = matchResult.rows[0];

    if (match.status !== 'active') {
      return res.status(400).json({ message: 'Only active matches can be completed' });
    }

    if (winner_id !== match.creator_id && winner_id !== match.opponent_id) {
      return res.status(400).json({ message: 'Winner must be one of the match participants' });
    }

    const updatedMatch = await pool.query(
      'UPDATE matches SET winner_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [winner_id, 'completed', match_id]
    );

    res.json({
      message: 'Match completed',
      match: updatedMatch.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while completing match' });
  }
};