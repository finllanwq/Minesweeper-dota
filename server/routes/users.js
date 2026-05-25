const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'Заполни все поля' });

  try {
    const hash = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'Логин или email уже занят' });
          return res.status(500).json({ error: 'Ошибка сервера' });
        }

        const userId = result.insertId;
        db.query('INSERT INTO player_ratings (user_id, mmr, rank_id) VALUES (?, 0, 1)', [userId]);
        db.query('INSERT INTO player_progression (user_id) VALUES (?)', [userId]);

        res.json({ success: true, message: 'Аккаунт создан!' });
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ВХОД
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Введи логин и пароль' });

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
    if (results.length === 0)
      return res.status(401).json({ error: 'Неверный логин или пароль' });

    const user = results[0];

    if (user.is_banned)
      return res.status(403).json({ error: 'Аккаунт заблокирован' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Неверный логин или пароль' });

    db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ success: true, username: user.username });
  });
});

// ВЫХОД
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ПРОФИЛЬ
router.get('/me', (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: 'Не авторизован' });

  db.query(
    `SELECT u.id, u.username, u.email, u.avatar_url, u.created_at,
            pr.mmr, pr.wins, pr.losses, pr.win_streak,
            r.name AS rank_name, r.tier,
            pp.level, pp.total_xp, pp.skill_points
     FROM users u
     LEFT JOIN player_ratings pr ON u.id = pr.user_id
     LEFT JOIN ranks r ON pr.rank_id = r.id
     LEFT JOIN player_progression pp ON u.id = pp.user_id
     WHERE u.id = ?`,
    [req.session.userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Ошибка сервера' });
      res.json(results[0]);
    }
  );
});

module.exports = router;