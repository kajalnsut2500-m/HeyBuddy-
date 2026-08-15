import React from "react";
import moment from "moment-timezone"
import "./message.css";

function isFileMessage(text) {
    return text && (text.startsWith('📄 ') || text.startsWith('❌ '))
}

function getFilename(text) {
    // Strip the leading emoji + space
    return text.replace(/^[📄❌]\s/, '')
}

export default function Message({ message, own, image, ownImage, showReadReceipt, readByOther }) {
    const timeAgo = message.createdAt
        ? moment(message.createdAt).fromNow()
        : "sending..."

    const isFile = isFileMessage(message.text)
    const isFailed = message.text?.startsWith('❌')

    return (
        <div className={`message ${own ? "own" : ""} ${message.pending ? "pending" : ""}`}>
            <div className="messageTop">
                <img
                    className="messageImg"
                    src={own ? ownImage : image}
                    alt=""
                />
                {isFile ? (
                    <div className={`messageFile ${own ? "messageFile--own" : ""} ${isFailed ? "messageFile--failed" : ""}`}>
                        <div className="messageFile-icon">
                            {isFailed ? (
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                                </svg>
                            )}
                        </div>
                        <div className="messageFile-info">
                            <span className="messageFile-name">{getFilename(message.text)}</span>
                            <span className="messageFile-label">
                                {isFailed ? 'Transfer failed' : message.pending ? 'Transferring…' : 'Sent via WebRTC'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="messageText">{message.text}</p>
                )}
            </div>
            <div className="messageBottom">
                {timeAgo}
                {own && showReadReceipt && (
                    <span className={`read-receipt ${readByOther ? 'read' : 'sent'}`}>
                        {readByOther ? ' ✓✓' : ' ✓'}
                    </span>
                )}
            </div>
        </div>
    );
}
