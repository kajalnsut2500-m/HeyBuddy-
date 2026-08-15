import React, { useState, useEffect, useRef } from 'react';
import API from "../../api";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { userSelector } from "../../store/slices/userSlice";

import { PeerConnection } from "../../webrtc/PeerConnection";
import { DocumentReceiver } from "../../webrtc/DocumentReceiver";
import DocumentViewer from "../../components/DocumentViewer";
import { savePdf, getPdf } from "../../utils/pdfStorage";

import ChatContainer from "../ChatContainer";
import AddConversationContainer from "../AddConversationContainer";
import Conversation from "../../components/Conversation";

import "./chats.css"


function Chats() {
    const { currentUser } = useSelector(userSelector)
    const [currentChat, setCurrentChat] = useState(null)
    const [list, setList] = useState([])
    const [socket, setSocket] = useState(null)
    const [clicked, setClicked] = useState(false)
    // {[userId]: {isOnline: bool, lastSeen: string|null}}
    const [presenceMap, setPresenceMap] = useState({})

    // WebRTC receiver state
    const [pdfUrl, setPdfUrl] = useState(null)
    const [transferFilename, setTransferFilename] = useState('')
    const [transferBytesReceived, setTransferBytesReceived] = useState(0)
    const [transferTotalBytes, setTransferTotalBytes] = useState(0)
    const [viewerVisible, setViewerVisible] = useState(false)
    const peerRef = useRef(null)
    const outgoingPeerRef = useRef(null)
    // Tracks the active object URL so we can revoke it before creating a new one
    const currentPdfUrlRef = useRef(null)

    // Revoke the active object URL and clear viewer state (keeps IndexedDB entry)
    const closePdfViewer = () => {
        if (currentPdfUrlRef.current) {
            URL.revokeObjectURL(currentPdfUrlRef.current)
            currentPdfUrlRef.current = null
        }
        setPdfUrl(null)
        setViewerVisible(false)
    }

    // Open a stored PDF by its pdfId — retrieves blob from IndexedDB, creates fresh URL
    const openPdfById = async (pdfId, filename) => {
        const blob = await getPdf(pdfId)
        if (!blob) {
            console.warn('[PDF] blob not found in storage for pdfId:', pdfId)
            return
        }
        if (currentPdfUrlRef.current) {
            URL.revokeObjectURL(currentPdfUrlRef.current)
        }
        const url = URL.createObjectURL(blob)
        currentPdfUrlRef.current = url
        setPdfUrl(url)
        setTransferFilename(filename)
        setTransferBytesReceived(0)
        setTransferTotalBytes(0)
        setViewerVisible(true)
    }

    // Revoke object URL on unmount to avoid leak
    useEffect(() => {
        return () => {
            if (currentPdfUrlRef.current) URL.revokeObjectURL(currentPdfUrlRef.current)
        }
    }, [])

    // Create ONE socket for everything: chat messages + WebRTC signaling
    useEffect(() => {
        const s = io(process.env.REACT_APP_SOCKET_URL)
        setSocket(s)
        return () => s.disconnect()
    }, [])

    // Register this socket with the server
    useEffect(() => {
        if (!socket) return
        socket.emit("addUser", currentUser.id)
    }, [socket, currentUser.id])

    // Real-time presence updates from the socket server
    useEffect(() => {
        if (!socket) return
        const handlePresence = ({userId, isOnline, lastSeen}) => {
            setPresenceMap(prev => ({
                ...prev,
                [String(userId)]: {isOnline, lastSeen}
            }))
        }
        socket.on('presenceUpdate', handlePresence)
        return () => socket.off('presenceUpdate', handlePresence)
    }, [socket])

    // Seed presenceMap from the API when Conversation fetches user data
    const updatePresence = (userId, data) => {
        setPresenceMap(prev => ({
            ...prev,
            [String(userId)]: {...prev[String(userId)], ...data}
        }))
    }

    const handleSubmit = () => {
        setClicked(true)
    }

    const changeChat = (chat) => {
        setClicked(false)
        setCurrentChat(chat)
        // Revoke the object URL (frees memory) but keep the blob in IndexedDB
        if (currentPdfUrlRef.current) {
            URL.revokeObjectURL(currentPdfUrlRef.current)
            currentPdfUrlRef.current = null
        }
        setPdfUrl(null)
        setViewerVisible(false)
        setTransferFilename('')
        setTransferBytesReceived(0)
        setTransferTotalBytes(0)
    }

    const fetchChats = async () => {
        try {
            const response = await API.get('/getChats/' + currentUser.id)
            setList(response.data)
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        fetchChats()
        const interval = setInterval(fetchChats, 5000)
        return () => clearInterval(interval)
    }, [currentUser.id])

    // Incoming WebRTC connection (Receiver side only)
    useEffect(() => {
        if (!socket) return

        const handleOffer = async ({ from, offer }) => {
            console.log('[WR] RECEIVER: socket received webrtc-offer — from:', from, 'currentUser:', currentUser.id, 'offer type:', offer?.type)
            const receiver = new DocumentReceiver(
                (filename, totalBytes) => {
                    // New transfer starting — revoke any previous object URL
                    if (currentPdfUrlRef.current) {
                        URL.revokeObjectURL(currentPdfUrlRef.current)
                        currentPdfUrlRef.current = null
                    }
                    setPdfUrl(null)
                    setTransferFilename(filename)
                    setTransferTotalBytes(totalBytes)
                    setTransferBytesReceived(0)
                    setViewerVisible(true)
                },
                (bytesReceived) => {
                    setTransferBytesReceived(bytesReceived)
                },
                async (blob, filename, pdfId) => {
                    // Persist blob in IndexedDB so it survives chat switches and page reloads
                    if (pdfId) await savePdf(pdfId, blob)
                    const url = URL.createObjectURL(blob)
                    currentPdfUrlRef.current = url
                    setPdfUrl(url)
                    setTransferFilename(filename)
                }
            )

            const peer = new PeerConnection(
                socket,
                currentUser.id,
                from,
                (data) => receiver.handleMessage(data)
            )
            peerRef.current = peer
            await peer.handleOffer(offer)
        }

        const handleAnswer = async ({ answer }) => {
            console.log('[WR] SENDER: socket received webrtc-answer — answer type:', answer?.type, 'outgoingPeerRef.current is', outgoingPeerRef.current ? 'SET' : 'NULL')
            if (!outgoingPeerRef.current) {
                console.error('[WR] SENDER: outgoingPeerRef is null — answer will be dropped!')
            }
            await outgoingPeerRef.current?.handleAnswer(answer)
        }

        socket.on('webrtc-offer', handleOffer)
        socket.on('webrtc-answer', handleAnswer)

        return () => {
            socket.off('webrtc-offer', handleOffer)
            socket.off('webrtc-answer', handleAnswer)
            peerRef.current?.close()
        }
    }, [socket, currentUser.id])

    return (
        <div className="chats-container">
            <div className="left-box">
                <div className="left-box-header">
                    <div className="left-box-header-row">
                        <div className="chats-title">Chats</div>
                        <button className="new-chat-btn" onClick={handleSubmit} title="New chat">
                           ➕
                        </button>
                    </div>
                    <input className="search-input" placeholder="🔍  Search"/>
                </div>
                <div className="conversations-scroll">
                    {list.map((c) => (
                        <div onClick={() => changeChat(c)} key={c.id}>
                            <Conversation
                                conversation={c}
                                currentUser={currentUser}
                                presenceMap={presenceMap}
                                onPresenceLoad={updatePresence}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="chat-wrapper">
                {!clicked ?
                    <ChatContainer
                        currentChat={currentChat}
                        currentUser={currentUser}
                        socket={socket}
                        outgoingPeerRef={outgoingPeerRef}
                        presenceMap={presenceMap}
                        openPdfById={openPdfById}
                    />
                    : <AddConversationContainer currentUser={currentUser}/>}
            </div>
            {(transferFilename || pdfUrl) && viewerVisible && (
                <div className="transfer-panel">
                    <DocumentViewer
                        pdfUrl={pdfUrl}
                        filename={transferFilename}
                        bytesReceived={transferBytesReceived}
                        totalBytes={transferTotalBytes}
                        onClose={closePdfViewer}
                    />
                </div>
            )}
        </div>
    )
}

export default Chats;
