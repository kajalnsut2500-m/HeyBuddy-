import React, {useEffect, useState} from "react";
import API from "../../api";

const Conversation = ({conversation, currentUser, presenceMap, onPresenceLoad}) => {
    const [user, setUser] = useState(null)
    const friendId = conversation.users.find(m => m != currentUser.id)

    useEffect(() => {
        API.get('/getUserById/' + friendId)
            .then(res => {
                setUser(res.data)
                // Seed initial presence from DB value (overridden by socket events later)
                if (onPresenceLoad) {
                    onPresenceLoad(friendId, {
                        isOnline: !!res.data.isOnline,
                        lastSeen: res.data.lastSeen || null
                    })
                }
            })
            .catch(e => console.log(e))
    }, []);

    if (!user) return null

    const presence = presenceMap?.[String(friendId)]
    const isOnline = presence ? presence.isOnline : !!user.isOnline

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
            <div style={{position: 'relative', flexShrink: 0}}>
                <img
                    className="contacts-image"
                    src={user.image}
                    alt={user.nickname}
                />
                <span
                    style={{
                        position: 'absolute',
                        bottom: 1,
                        right: 1,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: isOnline ? '#22c55e' : '#94A3B8',
                        border: '2px solid white',
                        display: 'block'
                    }}
                />
            </div>
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
