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
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

app.use(express.json())

const start = async () => {
    await db.authenticate()
        .then(() => console.log('Database connected...'))
        .catch(err => console.log('Error: ' + err))

    await app.listen(PORT, () => console.log(process.env.SERVER_URL))
}

app.use('/api', userRoutes)
app.use('/api', isAuth, chatRoutes)

start().then()
