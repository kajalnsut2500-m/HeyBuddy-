const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const RedisStore = require('connect-redis')(session);
const {isAuth} = require('./middlewares/auth-middleware')
const userRoutes = require('./routes/user-routes')
const chatRoutes = require('./routes/chat-routes')
const db = require('./config/database');
const app = express()

require('dotenv').config()

const PORT = process.env.PORT || 5000

app.set('trust proxy', 1)

const redisOptions = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL, logErrors: true }
    : { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PASSWORD, logErrors: true }

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}))

app.use(cookieParser())
app.use(session({
    secret: process.env.SESSION_SECRET,
    store: new RedisStore(redisOptions),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.COOKIE_SECURE === 'true',
        httpOnly: true,
        sameSite: process.env.COOKIE_SECURE === 'true' ? 'none' : 'lax'
    }
}));

app.use(express.json())

const start = async () => {
    try {
        await db.authenticate()
        console.log('Database connected...')

        // Create database tables if they don't exist
        await db.sync()
        console.log('Database tables synced...')

        // Add presence columns if they don't exist
        await db.query(`
            ALTER TABLE people
            ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN DEFAULT false
        `)

        await db.query(`
            ALTER TABLE people
            ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP WITH TIME ZONE
        `)

        console.log('Presence columns ready...')

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })

    } catch (err) {
        console.error('Server startup error:', err)
        process.exit(1)
    }
}

app.use('/api', userRoutes)
app.use('/api', isAuth, chatRoutes)

start().then()
