import React, {useEffect, useRef, useState} from 'react';
import Message from "../../components/Message";
import "./chatcontainer.css"
import API from "../../api";
import {PeerConnection} from "../../webrtc/PeerConnection";
import {DocumentSplitter} from "../../webrtc/DocumentSplitter";

const EMOJIS = ['😀','😂','😍','🥰','😎','😢','😡','👍','👎','❤️','🔥','🎉','🙏','💯','😭','🤔','😅','🥳','😴','🤣','✅','🫡']

function formatLastSeen(lastSeenUtc) {
    if (!lastSeenUtc) return ''
    const diffMs = Date.now() - new Date(lastSeenUtc).getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    if (diffSecs < 60) return 'just now'
    const diffMins = Math.floor(diffSecs / 60)
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
}

function ChatContainer({currentChat, currentUser, socket, outgoingPeerRef, presenceMap, openPdfById}) {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const [image, setImage] = useState("")
    const [recName, setRecName] = useState("")
    const [arrivalMessage, setArrivalMessage] = useState(null)
    const [isTyping, setIsTyping] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [readByOther, setReadByOther] = useState(false)
    const [pendingFile, setPendingFile] = useState(null)
    const [sendingFile, setSendingFile] = useState(false)
    const scrollRef = useRef()
    const fileInputRef = useRef()
    const typingTimeoutRef = useRef(null)

    const recId = currentChat?.users.find(m => m != currentUser.id)
    const recPresence = recId ? presenceMap?.[String(recId)] : null

    // Incoming chat messages
    useEffect(() => {
        if (!socket) return
        const handler = (data) => {
            setArrivalMessage({ senderId: data.senderId, text: data.text })
        }
        socket.on("getMessage", handler)
        return () => socket.off("getMessage", handler)
    }, [socket])

    // Typing + read receipt socket events
    useEffect(() => {
        if (!socket) return

        const handleTyping = ({ senderId }) => {
            if (String(senderId) === String(recId)) setIsTyping(true)
        }
        const handleStopTyping = ({ senderId }) => {
            if (String(senderId) === String(recId)) setIsTyping(false)
        }
        const handleMessagesRead = ({ chatId }) => {
            if (currentChat && String(chatId) === String(currentChat.id)) setReadByOther(true)
        }

        socket.on("userTyping", handleTyping)
        socket.on("userStopTyping", handleStopTyping)
        socket.on("messagesRead", handleMessagesRead)

        return () => {
            socket.off("userTyping", handleTyping)
            socket.off("userStopTyping", handleStopTyping)
            socket.off("messagesRead", handleMessagesRead)
        }
    }, [socket, recId, currentChat])

    // Mark messages as read + reset when switching chats
    useEffect(() => {
        if (!socket || !currentChat || !recId) return
        setReadByOther(false)
        setPendingFile(null)
        socket.emit("markRead", {
            senderId: currentUser.id,
            receiverId: recId,
            chatId: currentChat.id
        })
    }, [currentChat])

    useEffect(() => {
        if (arrivalMessage && currentChat?.users.map(String).includes(String(arrivalMessage.senderId))) {
            setMessages((prev) => [...prev, arrivalMessage])
        }
    }, [arrivalMessage, currentChat])

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await API.get('/getMessages/' + currentChat?.id)
                setMessages(response.data)
                if (currentChat) {
                    const res = await API.get('/getUserById/' + recId)
                    setImage(res.data.image)
                    setRecName(res.data.nickname)
                }
            } catch (e) {
                console.log(e)
            }
        }
        fetchData().then()
    }, [currentChat])

    useEffect(() => {
        scrollRef.current?.scrollIntoView({behavior: "smooth"})
    }, [messages])

    const handleInputChange = (e) => {
        setNewMessage(e.target.value)
        if (!socket || !currentChat || !recId) return

        socket.emit("typing", { senderId: currentUser.id, receiverId: recId })

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", { senderId: currentUser.id, receiverId: recId })
        }, 1500)
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) setPendingFile(file)
        e.target.value = ''
    }

    // Sends the PDF via WebRTC AND creates a visible message bubble in the chat
    const handleFileSelect = async (file) => {
        if (!file || !currentChat || !recId || !socket) return
        setSendingFile(true)

        // Show a pending "sending file" bubble immediately on sender's side
        const pdfId = crypto.randomUUID()
        const fileText = `📄 ${file.name}|pdfId:${pdfId}`
        const tempId = 'temp-file-' + Date.now()
        const tempMsg = { id: tempId, senderId: currentUser.id, text: fileText, pending: true }
        setMessages(prev => [...prev, tempMsg])
        setPendingFile(null)

        try {
            // Start WebRTC transfer
            console.log('[WR] SENDER: creating PeerConnection, recId=', recId)
            const peer = new PeerConnection(socket, currentUser.id, recId, () => {})
            outgoingPeerRef.current = peer
            console.log('[WR] SENDER: outgoingPeerRef set, calling createOffer')

            const channelOpen = new Promise(resolve => { peer.onOpen = resolve })
            await peer.createOffer()
            console.log('[WR] SENDER: createOffer done, waiting for DataChannel to open...')
            await channelOpen
            console.log('[WR] SENDER: DataChannel open! Starting file transfer')

            const splitter = new DocumentSplitter()
            await splitter.splitAndStream(file, peer, () => {}, pdfId)
            console.log('[WR] SENDER: splitAndStream complete')

            // File transferred — now create the persistent chat message for both sides
            socket.emit("sendMessage", { senderId: currentUser.id, receiverId: recId, text: fileText })
            const response = await API.post('/createMessage', {
                chatId: currentChat.id,
                senderId: currentUser.id,
                text: fileText
            })
            // Replace temp bubble with real saved message
            setMessages(prev => prev.map(m => m.id === tempId ? response.data : m))
        } catch (err) {
            console.error('File transfer failed:', err)
            // Keep the bubble but mark it as failed
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, pending: false, text: `❌ ${file.name} (failed)` } : m
            ))
        } finally {
            setSendingFile(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() && !pendingFile) return

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        if (socket && recId) socket.emit("stopTyping", { senderId: currentUser.id, receiverId: recId })
        setShowEmojiPicker(false)

        // Send pending file
        if (pendingFile) {
            await handleFileSelect(pendingFile)
        }

        // Send text message
        if (newMessage.trim()) {
            const tempId = 'temp-' + Date.now()
            const tempMessage = { id: tempId, senderId: currentUser.id, text: newMessage, pending: true }

            setMessages(prev => [...prev, tempMessage])
            setNewMessage("")
            setReadByOther(false)

            socket.emit("sendMessage", { senderId: currentUser.id, receiverId: recId, text: tempMessage.text })

            try {
                const response = await API.post('/createMessage', {
                    chatId: currentChat.id,
                    senderId: currentUser.id,
                    text: tempMessage.text
                })
                setMessages(prev => prev.map(m => m.id === tempId ? response.data : m))
            } catch (err) {
                setMessages(prev => prev.filter(m => m.id !== tempId))
                setNewMessage(tempMessage.text)
                alert("Message failed to send. Please try again.")
            }
        }
    }

    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji)
        setShowEmojiPicker(false)
    }

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const lastOwnIdx = messages.map((m, i) => String(m.senderId) === String(currentUser.id) ? i : -1)
                                .filter(i => i !== -1).pop()

    return (
        <div className="message-container" onClick={() => setShowEmojiPicker(false)}>
            <div className="chat-header">
                <div className="chat-header-avatar">
                    {image ? <img src={image} alt={recName}/> : recName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="chat-header-name">{recName}</div>
                    <div className="chat-header-status">
                        {isTyping
                            ? <span className="typing-status">typing<span className="typing-dots"><span>.</span><span>.</span><span>.</span></span></span>
                            : recPresence?.isOnline
                                ? '● Online'
                                : recPresence?.lastSeen
                                    ? `Last seen ${formatLastSeen(recPresence.lastSeen)}`
                                    : recPresence
                                        ? 'Offline'
                                        : ''
                        }
                    </div>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((m, index) => (
                    <div ref={scrollRef} key={m.id}>
                        <Message
                            message={m}
                            own={String(m.senderId) === String(currentUser.id)}
                            ownImage={currentUser.image}
                            image={image}
                            showReadReceipt={index === lastOwnIdx && !m.pending}
                            readByOther={readByOther}
                            onPdfClick={openPdfById}
                        />
                    </div>
                ))}
            </div>

            {showEmojiPicker && (
                <div className="emoji-picker" onClick={e => e.stopPropagation()}>
                    {EMOJIS.map(emoji => (
                        <span key={emoji} className="emoji-item" onClick={() => addEmoji(emoji)}>
                            {emoji}
                        </span>
                    ))}
                </div>
            )}

            {/* File attachment preview */}
            {pendingFile && (
                <div className="attachment-preview">
                    <div className="attachment-chip">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                        </svg>
                        <span className="attachment-chip-name">{pendingFile.name}</span>
                        <span className="attachment-size">{formatSize(pendingFile.size)}</span>
                        <button className="attachment-remove" onClick={() => setPendingFile(null)} title="Remove">✕</button>
                    </div>
                    <p className="attachment-hint">Hit send to transfer this PDF to {recName || 'the other person'}</p>
                </div>
            )}

            {sendingFile && (
                <div className="attachment-preview">
                    <div className="attachment-chip" style={{opacity: 0.7}}>
                        <span style={{fontSize: 13}}>⏳ Transferring PDF via WebRTC...</span>
                    </div>
                </div>
            )}

            <div className="send-bar">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <span
                    className={`send-plus ${sendingFile ? 'send-plus--disabled' : ''}`}
                    title="Attach PDF"
                    onClick={() => !sendingFile && fileInputRef.current.click()}
                >+</span>
                <span className="emoji-btn" title="Emoji" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(p => !p) }}>😊</span>
                <input
                    className="send-input"
                    placeholder={pendingFile ? "Add a message (optional)..." : "Send a message"}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e) }}
                    disabled={sendingFile}
                />
                <div
                    className={`send-btn ${pendingFile ? 'send-btn--active' : ''}`}
                    onClick={handleSubmit}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default ChatContainer;
