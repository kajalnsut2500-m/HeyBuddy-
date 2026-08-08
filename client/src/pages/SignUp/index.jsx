import React, {useEffect, useState} from 'react';
import {clearState, userSelector, registerUser} from "../../store/slices/userSlice";
import {useDispatch, useSelector} from "react-redux";
import {useForm} from "react-hook-form";
import {useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleLeft} from "@fortawesome/free-solid-svg-icons";

import "../Login/login.css"
import "./signup.css"

function SignUp() {
    const dispatch = useDispatch();
    const {register, handleSubmit} = useForm();
    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const {isSuccess, isError, errorMessage} = useSelector(userSelector);

    const onSubmit = (data) => {
        dispatch(registerUser(data));
    };

    useEffect(() => {
        if (isError) {
            let msg
            switch (errorMessage) {
                case 'nickname_unique': msg = 'This nickname is already taken!'; break
                case 'email_unique':    msg = 'This email is already taken!'; break
                default: msg = errorMessage
            }
            setError(msg)
            dispatch(clearState());
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
                <p className="left-side-tagline">Join the conversation.</p>
                <p className="left-side-desc">Create your free account and start chatting with anyone, anytime.</p>
            </div>
            <div className="right-side">
                <div className="back" onClick={() => navigate(-1)} style={{cursor: 'pointer'}}>
                    <FontAwesomeIcon className="icon" icon={faAngleLeft}/>
                    Back
                </div>
                <div className="container-signup">
                    <h3 className="loginText">Create an account ✨</h3>
                    <p className="lead text">
                        Become a member and enjoy communication with other users.
                    </p>
                    {error && <p className="error">{error}</p>}

                    <form className="loginForm my-3" onSubmit={handleSubmit(onSubmit)} method="POST">
                        <label>Nickname</label>
                        <input
                            type="text"
                            name="nickname"
                            placeholder="Steve"
                            {...register("nickname")}
                            required
                        />

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

                        <label>Repeat Password</label>
                        <input
                            type="password"
                            name="repeat_password"
                            placeholder="••••••••••"
                            {...register("repeat_password")}
                            autoComplete="on"
                            required
                        />

                        <input type="submit" value="Create Account"/>
                    </form>
                    <span className="text-center">
                        <p style={{color: '#64748B', fontSize: '14px', fontFamily: 'Quicksand, sans-serif', fontWeight: 500}}>
                            Already have an account?{' '}
                            <a style={{textDecoration: 'none', color: '#FF6B6B', fontWeight: 700}} href="/login">
                                Log In here
                            </a>
                        </p>
                    </span>
                </div>
            </div>
        </div>
    )
}

export default SignUp;
