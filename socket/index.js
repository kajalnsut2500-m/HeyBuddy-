const {Server} = require('socket.io')
const {Pool} = require('pg')
require('dotenv').config()

const PORT = process.env.PORT || process.env.SOCKET_PORT || 8900

const io = new Server(PORT, {
    cors: {
        origin: process.env.CLIENT_URL
    }
})

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false
})

// userId (string) -> Set<socketId> — supports multiple tabs per user
const users = {}
// socketId -> userId — fast reverse lookup on disconnect
const socketToUser = {}

const addUser = (userId, socketId) => {
    const key = String(userId)
    if (!users[key]) users[key] = new Set()
    users[key].add(socketId)
    socketToUser[socketId] = key
    console.log(`user ${key} connected (socketId: ${socketId}, active sockets: ${users[key].size})`)
}

// Returns userId if this was the last socket (user went offline), otherwise null
const removeUser = (socketId) => {
    const userId = socketToUser[socketId]
    if (!userId) return null
    delete socketToUser[socketId]
    if (users[userId]) {
        users[userId].delete(socketId)
        if (users[userId].size === 0) {
            delete users[userId]
            console.log(`user ${userId} fully disconnected`)
            return userId
        }
        console.log(`user ${userId} still has ${users[userId].size} active socket(s)`)
    }
    return null
}

// Emit an event to all active sockets of a given user
const emitToUser = (userId, event, data) => {
    const sockets = users[String(userId)]
    if (sockets) {
        sockets.forEach(socketId => io.to(socketId).emit(event, data))
    }
}

io.on("connection", (socket => {
    console.log(`[WR] browser connected — socketId: ${socket.id}`)

    socket.on("addUser", async userId => {
        console.log(`[WR] addUser — userId: ${userId}, socketId: ${socket.id}`)
        try {
            addUser(userId, socket.id)
            console.log(`[WR] online users:`, Object.keys(users))

            // Mark online — use server timestamp, clear stale lastSeen
            await pool.query(
                'UPDATE people SET "isOnline" = $1 WHERE id = $2',
                [true, userId]
            )

            // Broadcast to all connected clients so they update their UI
            io.emit('presenceUpdate', {userId: String(userId), isOnline: true, lastSeen: null})
        } catch (e) {
            console.log('addUser error: ' + e)
        }
    })

    socket.on("sendMessage", ({senderId, receiverId, text}) => {
        try {
            emitToUser(receiverId, "getMessage", {senderId, text})
        } catch (e) {
            console.log('sendMessage: ' + e)
        }
    })

    socket.on("typing", ({senderId, receiverId}) => {
        emitToUser(String(receiverId), "userTyping", {senderId})
    })

    socket.on("stopTyping", ({senderId, receiverId}) => {
        emitToUser(String(receiverId), "userStopTyping", {senderId})
    })

    socket.on("markRead", ({senderId, receiverId, chatId}) => {
        emitToUser(String(receiverId), "messagesRead", {chatId})
    })

    // WebRTC signaling — deliver to all tabs of the target user
    socket.on("webrtc-offer", ({to, from, offer}) => {
        console.log(`[WR] webrtc-offer — from: ${from}, to: ${to}, type: ${offer?.type}`)
        const sockets = users[String(to)]
        if (sockets) {
            sockets.forEach(sid => io.to(sid).emit("webrtc-offer", {from, offer}))
        } else {
            console.log(`[WR] webrtc-offer DROPPED — user ${to} not connected`)
        }
    })

    socket.on("webrtc-answer", ({to, answer}) => {
        console.log(`[WR] webrtc-answer — to: ${to}, type: ${answer?.type}`)
        const sockets = users[String(to)]
        if (sockets) {
            sockets.forEach(sid => io.to(sid).emit("webrtc-answer", {answer}))
        } else {
            console.log(`[WR] webrtc-answer DROPPED — user ${to} not connected`)
        }
    })

    socket.on("webrtc-ice", ({to, candidate}) => {
        const sockets = users[String(to)]
        if (sockets) {
            sockets.forEach(sid => io.to(sid).emit("webrtc-ice", {candidate}))
        } else {
            console.log(`[WR] webrtc-ice DROPPED — user ${to} not connected`)
        }
    })

    socket.on("disconnect", async () => {
        try {
            const offlineUserId = removeUser(socket.id)
            if (offlineUserId) {
                // Last socket closed — record offline with exact server timestamp
                const lastSeen = new Date()
                await pool.query(
                    'UPDATE people SET "isOnline" = $1, "lastSeen" = $2 WHERE id = $3',
                    [false, lastSeen, offlineUserId]
                )
                io.emit('presenceUpdate', {
                    userId: offlineUserId,
                    isOnline: false,
                    lastSeen: lastSeen.toISOString()
                })
            }
        } catch (e) {
            console.log('disconnect error: ' + e)
        }
    })
}))
