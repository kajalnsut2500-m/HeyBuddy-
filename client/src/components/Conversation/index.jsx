import React, {useEffect, useState} from "react";
import API from "../../api";

const Conversation = ({conversation, currentUser}) => {
    const [user, setUser] = useState(null)

    useEffect(() => {
        const friendId = conversation.users.find(m => m != currentUser.id)
        API.get('/getUserById/' + friendId)
            .then(res => setUser(res.data))
            .catch(e => console.log(e))
    }, []);

    if (!user) return null

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 8px',
                borderRadius: '14px',
                gap: '12px',
                cursor: 'pointer',
                transition: 'background 0.15s',
                marginBottom: '2px',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF1F1'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            <img
                className="contacts-image"
                src={user.image}
                alt={user.nickname}
            />
            <div style={{flex: 1, minWidth: 0}}>
                <p style={{margin: 0, fontWeight: '600', color: '#1C1C2E', fontSize: '14px'}}>
                    {user.nickname}
                </p>
                <p style={{margin: 0, color: '#94A3B8', fontSize: '12px', marginTop: '2px', fontFamily: 'Quicksand, sans-serif', fontWeight: 500}}>
                    Tap to open chat
                </p>
            </div>
        </div>
    );
};

export default Conversation;