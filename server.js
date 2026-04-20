const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { MongoClient } = require('mongodb')

const app = express()
app.use(cors())
app.use(express.json())

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = 'praveensystem'

let db

const defaultData = {
  player: {
    name: 'PRAVEEN RANA',
    class: 'ARCHITECH',
    title: 'MONARCH',
    level: 1,
    exp: 0,
    requiredExp: 120,
    points: 0
  },
  stats: {
    physique: { level: 1, exp: 0, requiredExp: 120 },
    mind: { level: 1, exp: 0, requiredExp: 120 },
    wealth: { level: 1, exp: 0, requiredExp: 120 },
    build: { level: 1, exp: 0, requiredExp: 120 },
    discipline: { level: 1, exp: 0, requiredExp: 120 }
  },
  quests: [
    { id: 1, stat: 'mind', title: 'Read for 20 minutes', exp: 15, points: 10, difficulty: 'Easy', completed: false },
    { id: 2, stat: 'wealth', title: 'Learn one business concept today', exp: 15, points: 10, difficulty: 'Easy', completed: false },
    { id: 3, stat: 'physique', title: 'Complete 20 push-ups and a 15 minute walk', exp: 15, points: 10, difficulty: 'Easy', completed: false },
    { id: 4, stat: 'build', title: 'Work on a project or learn something technical for 30 minutes', exp: 15, points: 10, difficulty: 'Easy', completed: false },
    { id: 5, stat: 'discipline', title: 'Wake up on time and follow morning routine', exp: 15, points: 10, difficulty: 'Easy', completed: false }
  ],
  rewards: [
    { id: 1, tier: 'bronze', title: 'Break Day', description: 'A full guilt-free entertainment day.', cost: 100, requirement: null },
    { id: 2, tier: 'bronze', title: 'Chill Session', description: 'Watch your favourite show for 3 hours.', cost: 80, requirement: null },
    { id: 3, tier: 'bronze', title: 'Game Night', description: 'Play any game you want for the evening.', cost: 60, requirement: null },
    { id: 4, tier: 'silver', title: 'Treat Yourself', description: 'A full day out on yourself.', cost: 500, requirement: { stat: 'wealth', level: 3 } },
    { id: 5, tier: 'silver', title: 'Big Purchase', description: 'Buy something you have been holding back on.', cost: 400, requirement: { stat: 'wealth', level: 3 } },
    { id: 6, tier: 'silver', title: 'Rest Day', description: 'A complete day off. No quests, no pressure.', cost: 300, requirement: null },
    { id: 7, tier: 'legendary', title: "The Monarch's Reward", description: 'A weekend trip or big purchase.', cost: 1500, requirement: { stat: 'wealth', level: 10 } },
    { id: 8, tier: 'legendary', title: 'Level Up IRL', description: 'Invest in a serious course or mentorship.', cost: 1200, requirement: { stat: 'build', level: 8 } },
    { id: 9, tier: 'legendary', title: 'Full Experience Day', description: 'Cinema, restaurant, shopping – everything.', cost: 1000, requirement: { stat: 'wealth', level: 8 } }
  ],
  streak: { value: 0, lastActiveDate: '' },
  goals: { value: '' }
}

async function connectDB() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  db = client.db(DB_NAME)
  console.log('✅ Connected to MongoDB Atlas')

  const initialized = await db.collection('config').findOne({ key: 'initialized' })

  if (!initialized) {
    console.log('First time setup - seeding defaults...')
    await db.collection('player').insertOne({ id: 1, ...defaultData.player })
    await db.collection('stats').insertOne({ id: 1, ...defaultData.stats })
    await db.collection('streak').insertOne({ id: 1, ...defaultData.streak })
    await db.collection('goals').insertOne({ id: 1, ...defaultData.goals })
    await db.collection('quests').insertMany(defaultData.quests)
    await db.collection('rewards').insertMany(defaultData.rewards)
    await db.collection('config').insertOne({ key: 'initialized', value: true })
    console.log('✅ Default data seeded and marked as initialized')
  } else {
    console.log('✅ App already initialized - skipping seed')
  }
}

// ── ROUTES ──

app.get('/api/data', async (req, res) => {
  const player = await db.collection('player').findOne({ id: 1 })
  const stats = await db.collection('stats').findOne({ id: 1 })
  const quests = await db.collection('quests').find().toArray()
  const rewards = await db.collection('rewards').find().toArray()
  const streak = await db.collection('streak').findOne({ id: 1 })
  const goals = await db.collection('goals').findOne({ id: 1 })
  res.json({ player, stats, quests, rewards, streak, goals })
})

app.put('/api/player', async (req, res) => {
  const { _id, ...data } = req.body
  await db.collection('player').updateOne({ id: 1 }, { $set: data })
  res.json({ success: true })
})

app.put('/api/stats', async (req, res) => {
  const { _id, id, ...data } = req.body
  await db.collection('stats').updateOne({ id: 1 }, { $set: data })
  res.json({ success: true })
})

app.get('/api/quests', async (req, res) => {
  const quests = await db.collection('quests').find().toArray()
  res.json(quests)
})

app.post('/api/quests', async (req, res) => {
  const newQuest = { id: Date.now(), ...req.body, completed: false }
  await db.collection('quests').insertOne(newQuest)
  res.json({ id: newQuest.id })
})

app.put('/api/quests/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  const { _id, ...data } = req.body
  await db.collection('quests').updateOne({ id }, { $set: data })
  res.json({ success: true })
})

app.delete('/api/quests/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  await db.collection('quests').deleteOne({ id })
  res.json({ success: true })
})

app.get('/api/rewards', async (req, res) => {
  const rewards = await db.collection('rewards').find().toArray()
  res.json(rewards)
})

app.post('/api/rewards', async (req, res) => {
  const newReward = { id: Date.now(), ...req.body }
  await db.collection('rewards').insertOne(newReward)
  res.json({ id: newReward.id })
})

app.delete('/api/rewards/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  await db.collection('rewards').deleteOne({ id })
  res.json({ success: true })
})

app.put('/api/streak', async (req, res) => {
  const { _id, ...data } = req.body
  await db.collection('streak').updateOne({ id: 1 }, { $set: data })
  res.json({ success: true })
})

app.put('/api/goals', async (req, res) => {
  await db.collection('goals').updateOne({ id: 1 }, { $set: { value: req.body.value } })
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

app.listen(PORT, async () => {
  await connectDB()
  console.log(`✅ Praveen System v2 backend running on port ${PORT}`)
})