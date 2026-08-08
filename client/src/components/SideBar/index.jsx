import React, {useEffect} from "react";
import {logoutUser, getUser, clearState} from '../../store/slices/userSlice';
import {useDispatch} from "react-redux";
import {NavLink} from 'react-router-dom';
import "./sidebar.css"

const Index = ({children}) => {
    const dispatch = useDispatch();

    const logout = () => {
        dispatch(logoutUser())
        dispatch(clearState())
    };

    useEffect(() => {
        dispatch(getUser())
    }, [])

    return (
        <div className="side-container">
            <div className="sidebar">
                <div className="sidebar-logo">H</div>

                <NavLink to="/chats" className="sidebar-icon" title="Chats">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                </NavLink>

                <NavLink to="/settings" className="sidebar-icon" title="Settings">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.05 7.05 0 0 0-1.62-.94l-.36-2.54A.484.484 0 0 0 14 3h-3.84a.484.484 0 0 0-.47.41l-.36 2.54a7.41 7.41 0 0 0-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.27.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54a7.41 7.41 0 0 0 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                    </svg>
                </NavLink>

                <div className="sidebar-spacer"/>

                <div className="sidebar-icon logout" title="Logout" onClick={logout}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                </div>
            </div>

            <div className="sidebar-children">
                {children}
            </div>
        </div>
    );
};

export default Index;