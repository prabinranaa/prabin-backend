const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const app = express()
const db = new Database('gamedata.db')

app.use(cors())
app.use(express.json())

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS player (
    id INTEGER PRIMARY KEY,
    name TEXT,
    class TEXT,
    title TEXT,
    level INTEGER,
    exp INTEGER,
    requiredExp INTEGER,
    points INTEGER
  );

  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY,
    physique_level INTEGER, physique_exp INTEGER, physique_requiredExp INTEGER,
    mind_level INTEGER, mind_exp INTEGER, mind_requiredExp INTEGER,
    wealth_level INTEGER, wealth_exp INTEGER, wealth_requiredExp INTEGER,
    skill_level INTEGER, skill_exp INTEGER, skill_requiredExp INTEGER,
    discipline_level INTEGER, discipline_exp INTEGER, discipline_requiredExp INTEGER
  );

  CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY,
    stat TEXT,
    title TEXT,
    exp INTEGER,
    points INTEGER,
    difficulty TEXT,
    completed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY,
    tier TEXT,
    title TEXT,
    description TEXT,
    cost INTEGER,
    requirement_stat TEXT,
    requirement_level INTEGER
  );

  CREATE TABLE IF NOT EXISTS streak (
    id INTEGER PRIMARY KEY,
    value INTEGER,
    lastActiveDate TEXT
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY,
    value TEXT
  );
`)

// Seed default data if empty
const playerCount = db.prepare('SELECT COUNT(*) as count FROM player').get()
if (playerCount.count === 0) {
  db.prepare(`INSERT INTO player VALUES (1, 'PRAVEEN RANA', 'ARCHITECH', 'MONARCH', 1, 0, 450, 0)`).run()
  db.prepare(`INSERT INTO stats VALUES (1, 1,0,150, 1,0,150, 1,0,150, 1,0,150, 1,0,150)`).run()
  db.prepare(`INSERT INTO streak VALUES (1, 0, '')`).run()
  db.prepare(`INSERT INTO goals VALUES (1, '')`).run()

  const defaultQuests = [
    { stat: 'mind', title: 'Read for 20 minutes', exp: 15, points: 10, difficulty: 'Easy' },
    { stat: 'wealth', title: 'Learn one business concept today', exp: 15, points: 10, difficulty: 'Easy' },
    { stat: 'physique', title: 'Complete 20 push-ups and a 15 minute walk', exp: 15, points: 10, difficulty: 'Easy' },
    { stat: 'skill', title: 'Practice a new skill for 30 minutes', exp: 15, points: 10, difficulty: 'Easy' },
    { stat: 'discipline', title: 'Wake up on time and follow morning routine', exp: 15, points: 10, difficulty: 'Easy' },
  ]
  const insertQuest = db.prepare('INSERT INTO quests (stat, title, exp, points, difficulty, completed) VALUES (?, ?, ?, ?, ?, 0)')
  defaultQuests.forEach(q => insertQuest.run(q.stat, q.title, q.exp, q.points, q.difficulty))

  const defaultRewards = [
    { tier: 'bronze', title: 'Break Day', description: 'A full guilt-free entertainment day.', cost: 100, req_stat: null, req_level: null },
    { tier: 'bronze', title: 'Chill Session', description: 'Watch your favourite show for 3 hours guilt-free.', cost: 80, req_stat: null, req_level: null },
    { tier: 'bronze', title: 'Game Night', description: 'Play any game you want for the entire evening.', cost: 60, req_stat: null, req_level: null },
    { tier: 'silver', title: 'Treat Yourself', description: 'A full day out on yourself.', cost: 500, req_stat: 'wealth', req_level: 3 },
    { tier: 'silver', title: 'Big Purchase', description: 'Buy something you have been holding back on.', cost: 400, req_stat: 'wealth', req_level: 3 },
    { tier: 'silver', title: 'Rest Day', description: 'A complete day off. No quests, no pressure.', cost: 300, req_stat: null, req_level: null },
    { tier: 'legendary', title: "The Monarch's Reward", description: 'A weekend trip or big purchase you have been dreaming about.', cost: 1500, req_stat: 'wealth', req_level: 10 },
    { tier: 'legendary', title: 'Level Up IRL', description: 'Invest in a serious course or mentorship.', cost: 1200, req_stat: 'skill', req_level: 8 },
    { tier: 'legendary', title: 'Full Experience Day', description: 'Cinema, restaurant, shopping – everything in one day.', cost: 1000, req_stat: 'wealth', req_level: 8 },
  ]
  const insertReward = db.prepare('INSERT INTO rewards (tier, title, description, cost, requirement_stat, requirement_level) VALUES (?, ?, ?, ?, ?, ?)')
  defaultRewards.forEach(r => insertReward.run(r.tier, r.title, r.description, r.cost, r.req_stat, r.req_level))
}

// ── ROUTES ──

// GET all data
app.get('/api/data', (req, res) => {
  const player = db.prepare('SELECT * FROM player WHERE id = 1').get()
  const stats = db.prepare('SELECT * FROM stats WHERE id = 1').get()
  const quests = db.prepare('SELECT * FROM quests').all()
  const rewards = db.prepare('SELECT * FROM rewards').all()
  const streak = db.prepare('SELECT * FROM streak WHERE id = 1').get()
  const goals = db.prepare('SELECT * FROM goals WHERE id = 1').get()
  res.json({ player, stats, quests, rewards, streak, goals })
})

// UPDATE player
app.put('/api/player', (req, res) => {
  const { name, class: cls, title, level, exp, requiredExp, points } = req.body
  db.prepare('UPDATE player SET name=?, class=?, title=?, level=?, exp=?, requiredExp=?, points=? WHERE id=1')
    .run(name, cls, title, level, exp, requiredExp, points)
  res.json({ success: true })
})

// UPDATE stats
app.put('/api/stats', (req, res) => {
  const s = req.body
  db.prepare(`UPDATE stats SET 
    physique_level=?, physique_exp=?, physique_requiredExp=?,
    mind_level=?, mind_exp=?, mind_requiredExp=?,
    wealth_level=?, wealth_exp=?, wealth_requiredExp=?,
    skill_level=?, skill_exp=?, skill_requiredExp=?,
    discipline_level=?, discipline_exp=?, discipline_requiredExp=?
    WHERE id=1`).run(
    s.physique.level, s.physique.exp, s.physique.requiredExp,
    s.mind.level, s.mind.exp, s.mind.requiredExp,
    s.wealth.level, s.wealth.exp, s.wealth.requiredExp,
    s.skill.level, s.skill.exp, s.skill.requiredExp,
    s.discipline.level, s.discipline.exp, s.discipline.requiredExp
  )
  res.json({ success: true })
})

// GET quests
app.get('/api/quests', (req, res) => {
  const quests = db.prepare('SELECT * FROM quests').all()
  res.json(quests)
})

// ADD quest
app.post('/api/quests', (req, res) => {
  const { stat, title, exp, points, difficulty } = req.body
  const result = db.prepare('INSERT INTO quests (stat, title, exp, points, difficulty, completed) VALUES (?, ?, ?, ?, ?, 0)')
    .run(stat, title, exp, points, difficulty)
  res.json({ id: result.lastInsertRowid })
})

// UPDATE quest
app.put('/api/quests/:id', (req, res) => {
  const { stat, title, exp, points, difficulty, completed } = req.body
  db.prepare('UPDATE quests SET stat=?, title=?, exp=?, points=?, difficulty=?, completed=? WHERE id=?')
    .run(stat, title, exp, points, difficulty, completed ? 1 : 0, req.params.id)
  res.json({ success: true })
})

// DELETE quest
app.delete('/api/quests/:id', (req, res) => {
  db.prepare('DELETE FROM quests WHERE id=?').run(req.params.id)
  res.json({ success: true })
})

// GET rewards
app.get('/api/rewards', (req, res) => {
  const rewards = db.prepare('SELECT * FROM rewards').all()
  res.json(rewards)
})

// ADD reward
app.post('/api/rewards', (req, res) => {
  const { tier, title, description, cost, requirement } = req.body
  const result = db.prepare('INSERT INTO rewards (tier, title, description, cost, requirement_stat, requirement_level) VALUES (?, ?, ?, ?, ?, ?)')
    .run(tier, title, description, cost, requirement?.stat || null, requirement?.level || null)
  res.json({ id: result.lastInsertRowid })
})

// DELETE reward
app.delete('/api/rewards/:id', (req, res) => {
  db.prepare('DELETE FROM rewards WHERE id=?').run(req.params.id)
  res.json({ success: true })
})

// UPDATE streak
app.put('/api/streak', (req, res) => {
  const { value, lastActiveDate } = req.body
  db.prepare('UPDATE streak SET value=?, lastActiveDate=? WHERE id=1').run(value, lastActiveDate)
  res.json({ success: true })
})

// UPDATE goals
app.put('/api/goals', (req, res) => {
  const { value } = req.body
  db.prepare('UPDATE goals SET value=? WHERE id=1').run(value)
  res.json({ success: true })
})

// Serve frontend
if (fs.existsSync(path.join(__dirname, 'public'))) {
  app.use(express.static(path.join(__dirname, 'public')))
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })
}

const PORT = 3001
app.listen(PORT, () => {
  console.log(`✅ Praveen System backend running on http://localhost:${PORT}`)
})