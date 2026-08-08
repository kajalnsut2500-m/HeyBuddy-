import React, {useEffect, useState} from "react";
import {useSelector, useDispatch} from "react-redux";
import {userSelector, getUser} from "../../store/slices/userSlice";

const Card = () => {
    const {currentUser} = useSelector(userSelector)
    const [user, setUser] = useState(null)

    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
        }
    }, [currentUser]);

    if (!user) return (
        <div>
            <i className="fa fa-sign-in-alt mx-1" />
            <a href="/login" style={{textDecoration: "none", color: "white"}}>
                 Log In
            </a>
        </div>
    )

return (
    <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0'}}>
        <img
            src={user.image}
            alt={user.nickname}
            style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                backgroundColor: '#ccc'
            }}
        />
        <span style={{fontWeight: '600', fontSize: '15px', color: 'white'}}>{user.nickname}</span>
    </div>
);
};
export default Card;