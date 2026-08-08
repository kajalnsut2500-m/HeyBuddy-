import React, { useState, useEffect } from 'react';
import "./container.css"
import API from "../../api";

function AddConversationContainer({ currentUser }) {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await API.get('/getNewConversations')
                setList(response.data)
            } catch (e) {
                console.log(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleClick = async (id) => {
        setAdding(id)
        try {
            await API.post('/createChat', {
                senderId: currentUser.id,
                receiverId: id
            })
            window.location.reload()
        } catch (e) {
            console.log(e)
            setAdding(null)
        }
    }

    return (
        <div className="add-conversation-container">
            <div className="add-conversation-header">
                <h2 className="add-conversation-title">New Conversation</h2>
                <p className="add-conversation-subtitle">Select a person to start chatting</p>
            </div>

            <div className="add-conversation-list">
                {loading && (
                    <div className="add-conversation-empty">Loading users...</div>
                )}
                {!loading && list.length === 0 && (
                    <div className="add-conversation-empty">No new users to add</div>
                )}
                {list.map((c) => (
                    <div className="add-user-row" key={c.id}>
                        <div className="add-user-avatar">
                            {c.image
                                ? <img src={c.image} alt={c.nickname} />
                                : <span>{c.nickname?.charAt(0).toUpperCase()}</span>
                            }
                        </div>
                        <div className="add-user-name">{c.nickname}</div>
                        <button
                            className="add-user-btn"
                            onClick={() => handleClick(c.id)}
                            disabled={adding === c.id}
                        >
                            {adding === c.id ? '...' : '+'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AddConversationContainer;