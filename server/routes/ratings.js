const express = require('express');
const router = express.Router();
const db = require('../db');

// ТАБЛИЦА ЛИДЕРОВ
router.get('/leaderboard', (req, res) => {
  db.query(
    `SELECT u.username, u.avatar_url,
            pr.mmr, pr.wins, pr.losses,
            r.name AS rank_name, r.tier
     FROM player_ratings pr
     JOIN users u ON pr.user_id = u.id
     JOIN ranks r ON pr.rank_id = r.id
     WHERE u.is_banned = 0
     ORDER BY pr.mmr DESC
     LIMIT 50`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Ошибка сервера' });
      res.json(results);
    }
  );
});

// ИСТОРИЯ MMR
router.get('/history', (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: 'Не авторизован' });

  db.query(
    `SELECT mmr_before, mmr_after, mmr_change, reason, created_at
     FROM mmr_history
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    [req.session.userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Ошибка сервера' });
      res.json(results);
    }
  );
});

module.exports = router;