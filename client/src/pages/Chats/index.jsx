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
    const [receivedPages, setReceivedPages] = useState([])
    const [totalPages, setTotalPages] = useState(0)
    const [transferFilename, setTransferFilename] = useState('')
    const peerRef = useRef(null)

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

    const changeChat = (chat) => {
        setClicked(false)
        setCurrentChat(chat)
        setReceivedPages([])
        setTotalPages(0)
        setTransferFilename('')
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
            const receiver = new DocumentReceiver(
                (filename, pages) => {
                    setTransferFilename(filename)
                    setTotalPages(pages)
                },
                (page) => {
                    setReceivedPages(prev => [...prev, page])
                },
                () => console.log('Transfer complete')
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
            await peerRef.current?.handleAnswer(answer)
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
                    />
                    : <AddConversationContainer currentUser={currentUser}/>}
            </div>
            {totalPages > 0 && (
                <div className="transfer-panel">
                    <DocumentViewer
                        pages={receivedPages}
                        totalPages={totalPages}
                        filename={transferFilename}
                    />
                </div>
            )}
        </div>
    )
}

export default Chats;
