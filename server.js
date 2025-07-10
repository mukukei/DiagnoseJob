const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 3000;

// .env 読み込み
require('dotenv').config();

// =======================
// 📌 ここで .env の内容を確認
// =======================
console.log('=== ENV CHECK ===');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('==================');

app.use(express.json());

// =======================
// DB接続設定
// =======================
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // ここ追加！
  options: '-c search_path=public'
});


// =======================
// 質問一覧 GET
// =======================
app.get('/questions', async (req, res) => {
  try {
    console.log('==== /questions にアクセス ====');
    console.log('接続先:', process.env.DB_NAME, process.env.DB_USER);

    const result = await pool.query('SELECT * FROM "public"."questions" ORDER BY id');

    console.log('クエリ結果:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('==== ERROR in /questions ====');
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});


// =======================
// 回答保存 POST
// =======================
app.post('/answer', async (req, res) => {
  const { user_id, question_id, answer } = req.body;

  try {
    await pool.query(
      'INSERT INTO answers (user_id, question_id, answer) VALUES ($1, $2, $3)',
      [user_id, question_id, answer]
    );
    res.json({ message: 'Answer saved!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

// =======================
// 診断結果生成 POST
// =======================
app.post('/diagnose', async (req, res) => {
  const { user_id } = req.body;

  try {
    const result = await pool.query(
      'SELECT answer FROM answers WHERE user_id = $1',
      [user_id]
    );

    const answers = result.rows;
    const aCount = answers.filter(row => row.answer === 'A').length;

    let type = '';
    let comment = '';
    let job_suggestion = '';

    if (aCount <= 3) {
      type = '安定志向型';
      comment = '堅実に進める安定志向！';
      job_suggestion = '公務員 / 総務 / 経理';
    } else if (aCount <= 7) {
      type = 'ハイブリッド型';
      comment = '柔軟性が高いバランサー！';
      job_suggestion = '営業 / 人事 / 企画';
    } else {
      type = 'クリエイター型';
      comment = '自由と表現を求める創造型！';
      job_suggestion = 'デザイナー / ライター / エンジニア';
    }

    await pool.query(
      'INSERT INTO results (user_id, type, comment, job_suggestion) VALUES ($1, $2, $3, $4)',
      [user_id, type, comment, job_suggestion]
    );

    res.json({ type, comment, job_suggestion });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to diagnose' });
  }
});

// =======================
// 結果履歴 GET
// =======================
app.get('/results', async (req, res) => {
  const { user_id } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM results WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// =======================
// サーバー起動
// =======================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// 確認用
app.get('/debug-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database(), current_user, current_schema()');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to debug' });
  }
});

// フロント表示用
app.use(express.static(__dirname));

const bcrypt = require('bcrypt');

// =======================
// ユーザー登録 POST
// =======================
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    res.json({ message: 'User registered!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

const bcrypt = require('bcrypt');

// =======================
// ログイン POST
// =======================
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // ユーザーをDBから探す
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // パスワード照合
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // ここでセッション or JWTを発行するのが本来
    // 今はシンプルにメッセージだけ返す
    res.json({ message: 'Login successful', user_id: user.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

