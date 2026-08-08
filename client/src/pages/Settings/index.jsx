import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {userSelector, updateUser, clearState, uploadImage, getUser} from "../../store/slices/userSlice";
import {useForm} from "react-hook-form";

import "./settings.css"

function Profile() {
    const {register, handleSubmit, setValue} = useForm();
    const {isSuccess, isError, errorMessage} = useSelector(userSelector);
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const dispatch = useDispatch();
    const {currentUser} = useSelector(userSelector)

    const onSubmit = (data) => {
        dispatch(updateUser(data));
    };

    const uploadImg = (data) => {
        dispatch(uploadImage(data));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) setPreviewUrl(URL.createObjectURL(file))
    }

    useEffect(() => {
        setValue("id", currentUser.id)
        setValue("email", currentUser.email)
        setValue("nickname", currentUser.nickname)

        if (isError) {
            let msg
            switch (errorMessage) {
                case 'SequelizeUniqueConstraintError': msg = 'This nickname is already taken!'; break
                default: msg = errorMessage
            }
            setSuccess(null)
            setError(msg)
            dispatch(clearState())
        }

        if (isSuccess) {
            setError(null)
            setSuccess('Profile updated successfully!')
            dispatch(clearState())
        }
    }, [currentUser, isError, isSuccess])

    const avatarSrc = previewUrl || currentUser.image

    return (
        <div className="sp-page">
            {/* Header banner */}
            <div className="sp-banner">
                <div className="sp-banner-inner">
                    <div className="sp-avatar-wrap">
                        <img className="sp-avatar" src={avatarSrc} alt={currentUser.nickname}/>
                        <label className="sp-avatar-edit" title="Change photo">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 1.42 9.06-9.06.59.59-9.06 9.06H5.92v-.59zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            <input
                                type="file"
                                accept="image/*"
                                style={{display: 'none'}}
                                onChange={handleFileChange}
                                {...register("file")}
                            />
                        </label>
                    </div>
                    <div className="sp-banner-info">
                        <h2 className="sp-display-name">{currentUser.nickname}</h2>
                        <p className="sp-display-email">{currentUser.email}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(uploadImg)} encType="multipart/form-data">
                    <button className="sp-upload-btn" type="submit">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
                        </svg>
                        Upload photo
                    </button>
                </form>
            </div>

            {/* Form card */}
            <div className="sp-body">
                {error   && <div className="sp-alert sp-alert--error">{error}</div>}
                {success && <div className="sp-alert sp-alert--success">{success}</div>}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="sp-card">
                        <h3 className="sp-card-title">Account details</h3>

                        <div className="sp-field">
                            <label className="sp-label">User ID</label>
                            <input
                                className="sp-input sp-input--disabled"
                                type="text"
                                {...register("id")}
                                disabled
                            />
                        </div>

                        <div className="sp-field">
                            <label className="sp-label">Email address</label>
                            <input
                                className="sp-input sp-input--disabled"
                                type="email"
                                {...register("email")}
                                disabled
                            />
                        </div>

                        <div className="sp-field">
                            <label className="sp-label">Nickname <span className="sp-required">*</span></label>
                            <input
                                className="sp-input"
                                type="text"
                                placeholder="Your nickname"
                                {...register("nickname")}
                                required
                            />
                            <p className="sp-hint">This is how others will see you in HeyBuddy!</p>
                        </div>

                        <button className="sp-save-btn" type="submit">Save changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Profile;
