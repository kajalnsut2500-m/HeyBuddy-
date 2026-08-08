const {Server} = require('socket.io')
require('dotenv').config()

const PORT = process.env.PORT || process.env.SOCKET_PORT || 8900

const io = new Server(PORT, {
    cors: {
        origin: process.env.CLIENT_URL
    }
})

let users = {}

const addUser = (userId, socketId) => {
    users[userId] = socketId
    console.log("user " + userId + " connected")
}

const removeUser = (socketId) => {
    for (let userId in users) {
        if (users[userId] === socketId) {
            delete users[userId];
            console.log("user " + userId + " disconnected")
        }
    }
}

io.on("connection", (socket => {
    socket.on("addUser", userId => {
        try {
            addUser(userId, socket.id)
        } catch (e) {
            console.log('connect: ' + e)
        }
    })

    socket.on("sendMessage", ({senderId, receiverId, text}) => {
        try {
            const user = users[receiverId]
            if (user) {
                io.to(user).emit("getMessage", { senderId, text })
            }
        } catch (e) {
            console.log('sendMessage: ' + e)
        }
    })

    // Typing indicator — relay to the other person
    socket.on("typing", ({ senderId, receiverId }) => {
        const user = users[String(receiverId)]
        if (user) io.to(user).emit("userTyping", { senderId })
    })

    socket.on("stopTyping", ({ senderId, receiverId }) => {
        const user = users[String(receiverId)]
        if (user) io.to(user).emit("userStopTyping", { senderId })
    })

    // Read receipts — tell sender their messages were seen
    socket.on("markRead", ({ senderId, receiverId, chatId }) => {
        const user = users[String(receiverId)]
        if (user) io.to(user).emit("messagesRead", { chatId })
    })

    // WebRTC signaling
    socket.on("webrtc-offer", ({ to, from, offer }) => {
        const receiverSocket = users[String(to)]
        if (receiverSocket) {
            io.to(receiverSocket).emit("webrtc-offer", { from, offer })
        }
    })

    socket.on("webrtc-answer", ({ to, answer }) => {
        const senderSocket = users[String(to)]
        if (senderSocket) {
            io.to(senderSocket).emit("webrtc-answer", { answer })
        }
    })

    socket.on("webrtc-ice", ({ to, candidate }) => {
        const targetSocket = users[String(to)]
        if (targetSocket) {
            io.to(targetSocket).emit("webrtc-ice", { candidate })
        }
    })

    socket.on("disconnect", () => {
        try {
            removeUser(socket.id)
        } catch (e) {
            console.log('disconnect: ' + e)
        }
    })
}))
