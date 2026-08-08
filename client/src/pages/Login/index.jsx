import React, {useEffect, useState} from 'react';
import { useNavigate } from "react-router-dom"
import {userSelector, clearState, loginUser} from '../../store/slices/userSlice';
import {useDispatch, useSelector} from "react-redux";
import {useForm} from "react-hook-form";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faAngleLeft} from '@fortawesome/free-solid-svg-icons'

import "./login.css"

function Login() {
    const dispatch = useDispatch();
    const {register, handleSubmit} = useForm();
    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const {isSuccess, isError, errorMessage} = useSelector(userSelector);

    const onSubmit = (data) => {
        dispatch(loginUser(data));
    };

    useEffect(() => {
        if (isError) {
            setError(errorMessage)
            dispatch(clearState())
        }
        if (isSuccess) {
            dispatch(clearState())
            navigate("/chats")
        }
    }, [isError, isSuccess]);

    return (
        <div className="box">
            <div className="left-side">
                <span className="logo">{process.env.REACT_APP_NAME}</span>
                <p className="left-side-tagline">Chat without the formality.</p>
                <p className="left-side-desc">Connect with the people who matter, in real time.</p>
            </div>
            <div className="right-side">
                <div className="back" onClick={() => navigate(-1)}>
                    <FontAwesomeIcon className="icon" icon={faAngleLeft}/>
                    Back
                </div>
                <div className="container-login">
                    <h3 className="loginText">Welcome back 👋</h3>
                    <p className="lead text">
                        If you are already a member you can login with your email address and password.
                    </p>
                    {error && <p className="error">{error}</p>}

                    <form className="loginForm my-4" onSubmit={handleSubmit(onSubmit)} method="POST">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            {...register("email")}
                            required
                        />

                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••••"
                            {...register("password")}
                            autoComplete="on"
                            required
                        />

                        <input type="submit" value="Log In"/>
                    </form>
                    <span className="text-center">
                        <p style={{color: '#64748B', fontSize: '14px', fontFamily: 'Quicksand, sans-serif', fontWeight: 500}}>
                            Don't have an account?{' '}
                            <a style={{textDecoration: 'none', color: '#FF6B6B', fontWeight: 700}} href="/registration">
                                Sign up here
                            </a>
                        </p>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Login;
