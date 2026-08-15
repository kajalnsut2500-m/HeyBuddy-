import React, { useState, useEffect, useRef } from 'react';
import API from "../../api";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { userSelector } from "../../store/slices/userSlice";

import { PeerConnection } from "../../webrtc/PeerConnection";
import { DocumentReceiver } from "../../webrtc/DocumentReceiver";
import DocumentViewer from "../../components/DocumentViewer";

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

    // WebRTC receiver state
    const [pdfUrl, setPdfUrl] = useState(null)
    const [transferFilename, setTransferFilename] = useState('')
    const [transferBytesReceived, setTransferBytesReceived] = useState(0)
    const [transferTotalBytes, setTransferTotalBytes] = useState(0)
    const peerRef = useRef(null)
    const outgoingPeerRef = useRef(null)

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

    const handleSubmit = () => {
        setClicked(true)
    }

    const handleCloseViewer = () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
        setTransferFilename('')
        setTransferBytesReceived(0)
        setTransferTotalBytes(0)
    }

    const changeChat = (chat) => {
        setClicked(false)
        setCurrentChat(chat)
        if (pdfUrl) URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
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
                    setTransferFilename(filename)
                    setTransferTotalBytes(totalBytes)
                    setTransferBytesReceived(0)
                    setPdfUrl(null)
                },
                (bytesReceived) => {
                    setTransferBytesReceived(bytesReceived)
                },
                (url, filename) => {
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
                            <Conversation conversation={c} currentUser={currentUser}/>
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
                    />
                    : <AddConversationContainer currentUser={currentUser}/>}
            </div>
            {(transferFilename || pdfUrl) && (
                <div className="transfer-panel">
                    <DocumentViewer
                        pdfUrl={pdfUrl}
                        filename={transferFilename}
                        bytesReceived={transferBytesReceived}
                        totalBytes={transferTotalBytes}
                        onClose={handleCloseViewer}
                    />
                </div>
            )}
        </div>
    )
}

export default Chats;
