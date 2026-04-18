const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json())

// Simple JSON database
const DB_PATH = path.join(__dirname, 'gamedata.json')

const defaultData = {
  player: {
    id: 1,
    name: 'PRAVEEN RANA',
    class: 'ARCHITECH',
    title: 'MONARCH',
    level: 1,
    exp: 0,
    requiredExp: 450,
    points: 0
  },
  stats: {
    physique: { level: 1, exp: 0, requiredExp: 150 },
    mind: { level: 1, exp: 0, requiredExp: 150 },
    wealth: { level: 1, exp: 0, requiredExp: 150 },
    skill: { level: 1, exp: 0, requiredExp: 150 },
    discipline: { level: 1, exp: 0, requiredExp: 150 }
  },
  quests: [
    { id: 1, stat: 'mind', title: 'Read for 20 minutes', exp: 15, points: 10, difficulty: 'Easy', completed: false },
    { id: 2, stat: 'wealth', title: 'Learn one business concept today', exp: 15, points: 10, difficulty: 'Easy', completed: false },
    { id: 3, stat: 'physique', title: 'Complete 20 push-ups and a 15 minute walk', exp: 15, points: 10, difficulty: 'Easy', completed: false },
    { id: 4, stat: 'skill', title: 'Practice a new skill for 30 minutes', exp: 15, points: 10, difficulty: 'Easy', completed: false },
    { id: 5, stat: 'discipline', title: 'Wake up on time and follow morning routine', exp: 15, points: 10, difficulty: 'Easy', completed: false }
  ],
  rewards: [
    { id: 1, tier: 'bronze', title: 'Break Day', description: 'A full guilt-free entertainment day.', cost: 100, requirement: null },
    { id: 2, tier: 'bronze', title: 'Chill Session', description: 'Watch your favourite show for 3 hours guilt-free.', cost: 80, requirement: null },
    { id: 3, tier: 'bronze', title: 'Game Night', description: 'Play any game you want for the entire evening.', cost: 60, requirement: null },
    { id: 4, tier: 'silver', title: 'Treat Yourself', description: 'A full day out on yourself.', cost: 500, requirement: { stat: 'wealth', level: 3 } },
    { id: 5, tier: 'silver', title: 'Big Purchase', description: 'Buy something you have been holding back on.', cost: 400, requirement: { stat: 'wealth', level: 3 } },
    { id: 6, tier: 'silver', title: 'Rest Day', description: 'A complete day off. No quests, no pressure.', cost: 300, requirement: null },
    { id: 7, tier: 'legendary', title: "The Monarch's Reward", description: 'A weekend trip or big purchase you have been dreaming about.', cost: 1500, requirement: { stat: 'wealth', level: 10 } },
    { id: 8, tier: 'legendary', title: 'Level Up IRL', description: 'Invest in a serious course or mentorship.', cost: 1200, requirement: { stat: 'skill', level: 8 } },
    { id: 9, tier: 'legendary', title: 'Full Experience Day', description: 'Cinema, restaurant, shopping – everything in one day.', cost: 1000, requirement: { stat: 'wealth', level: 8 } }
  ],
  streak: { value: 0, lastActiveDate: '' },
  goals: { value: '' }
}

// Read database
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2))
    return defaultData
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

// Write database
const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// ── ROUTES ──

// GET all data
app.get('/api/data', (req, res) => {
  const db = readDB()
  res.json(db)
})

// UPDATE player
app.put('/api/player', (req, res) => {
  const db = readDB()
  db.player = { ...db.player, ...req.body }
  writeDB(db)
  res.json({ success: true })
})

// UPDATE stats
app.put('/api/stats', (req, res) => {
  const db = readDB()
  db.stats = req.body
  writeDB(db)
  res.json({ success: true })
})

// GET quests
app.get('/api/quests', (req, res) => {
  const db = readDB()
  res.json(db.quests)
})

// ADD quest
app.post('/api/quests', (req, res) => {
  const db = readDB()
  const newQuest = {
    id: Date.now(),
    ...req.body,
    completed: false
  }
  db.quests.push(newQuest)
  writeDB(db)
  res.json({ id: newQuest.id })
})

// UPDATE quest
app.put('/api/quests/:id', (req, res) => {
  const db = readDB()
  const id = parseInt(req.params.id)
  db.quests = db.quests.map(q => q.id === id ? { ...q, ...req.body } : q)
  writeDB(db)
  res.json({ success: true })
})

// DELETE quest
app.delete('/api/quests/:id', (req, res) => {
  const db = readDB()
  const id = parseInt(req.params.id)
  db.quests = db.quests.filter(q => q.id !== id)
  writeDB(db)
  res.json({ success: true })
})

// GET rewards
app.get('/api/rewards', (req, res) => {
  const db = readDB()
  res.json(db.rewards)
})

// ADD reward
app.post('/api/rewards', (req, res) => {
  const db = readDB()
  const newReward = { id: Date.now(), ...req.body }
  db.rewards.push(newReward)
  writeDB(db)
  res.json({ id: newReward.id })
})

// DELETE reward
app.delete('/api/rewards/:id', (req, res) => {
  const db = readDB()
  const id = parseInt(req.params.id)
  db.rewards = db.rewards.filter(r => r.id !== id)
  writeDB(db)
  res.json({ success: true })
})

// UPDATE streak
app.put('/api/streak', (req, res) => {
  const db = readDB()
  db.streak = req.body
  writeDB(db)
  res.json({ success: true })
})

// UPDATE goals
app.put('/api/goals', (req, res) => {
  const db = readDB()
  db.goals = { value: req.body.value }
  writeDB(db)
  res.json({ success: true })
})

// Serve frontend
if (fs.existsSync(path.join(__dirname, 'public'))) {
  app.use(express.static(path.join(__dirname, 'public')))
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`✅ Praveen System backend running on port ${PORT}`)
})