import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { userSelector, loginUser, clearState } from '../../store/slices/userSlice';
import './home.css';

const DEMO_EMAIL    = process.env.REACT_APP_DEMO_EMAIL    || 'demo@heybuddy.com';
const DEMO_PASSWORD = process.env.REACT_APP_DEMO_PASSWORD || 'demo123';

const TECH = [
    { label: 'React 18',   color: '#0891B2', bg: '#E0F7FA' },
    { label: 'Node.js',    color: '#15803D', bg: '#DCFCE7' },
    { label: 'Express',    color: '#374151', bg: '#F3F4F6' },
    { label: 'PostgreSQL', color: '#1D4ED8', bg: '#DBEAFE' },
    { label: 'Sequelize',  color: '#0369A1', bg: '#E0F2FE' },
    { label: 'Socket.IO',  color: '#FFFFFF', bg: '#111827' },
    { label: 'Redis',      color: '#B91C1C', bg: '#FEE2E2' },
    { label: 'Docker',     color: '#1D4ED8', bg: '#DBEAFE' },
    { label: 'Redux',      color: '#6D28D9', bg: '#EDE9FE' },
    { label: 'Cloudinary', color: '#3730A3', bg: '#E0E7FF' },
];

const FEATURES = [
    {
        icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>,
        title: 'Real-time messaging',
        desc: 'Instant delivery with typing indicators and double-tick read receipts.',
        color: '#FF6B6B', bg: '#FFF1F1',
    },
    {
        icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>,
        title: 'WebRTC file transfer',
        desc: 'Send PDFs peer-to-peer, no server upload needed.',
        color: '#6C63FF', bg: '#F0EEFF',
    },
    {
        icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm4.5 11.5h-4v4h-1v-4h-4v-1h4v-4h1v4h4v1z"/></svg>,
        title: 'Start new chats',
        desc: 'Find anyone on HeyBuddy! and kick off a conversation instantly.',
        color: '#F59E0B', bg: '#FFFBEB',
    },
];

const ACHIEVEMENTS = [
    { title: 'WebRTC peer-to-peer file transfer', desc: 'Real-time PDF sharing directly between browsers using WebRTC data channels — no server relay or storage required.' },
    { title: 'Decoupled Socket.IO microservice', desc: 'Typing indicators, read receipts, and instant delivery via a standalone Socket.IO server, independent of the REST API.' },
    { title: 'Session auth backed by Redis', desc: 'Stateful login with express-session + Redis persistence, bcrypt password hashing, and session-protected API routes.' },
];

export default function Home() {
    const { isAuth, isSuccess, isError, errorMessage } = useSelector(userSelector);
    const dispatch = useDispatch();
    const [copied, setCopied] = useState(false);
    const [loginErr, setLoginErr] = useState(null);

    useEffect(() => {
        if (isError) { setLoginErr(errorMessage || 'Invalid credentials.'); dispatch(clearState()); }
        if (isSuccess) dispatch(clearState());
    }, [isError, isSuccess]);

    if (isAuth) return <Navigate to="/chats" replace />;

    const guestLogin = () => { setLoginErr(null); dispatch(loginUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD })); };

    const copy = () => {
        navigator.clipboard?.writeText(`Email: ${DEMO_EMAIL}\nPassword: ${DEMO_PASSWORD}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    return (
        <div className="lp-wrap">

            {/* ── Navbar ── */}
            <nav className="lp-nav">
                <span className="lp-nav-logo">
                    <span className="lp-star lp-star-a">★</span>
                    HeyBuddy!
                    <span className="lp-star lp-star-b">★</span>
                </span>
                <div className="lp-nav-links">
                    <a href="/login" className="lp-nav-ghost">Log In</a>
                    <a href="/registration" className="lp-nav-cta">Get Started</a>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="lp-hero">
                <div className="lp-hero-blob" />

                <div className="lp-hero-text">
                    <div className="lp-badge lp-anim-1">✦ Free forever · No credit card</div>
                    <h1 className="lp-h1 lp-anim-2">
                        Chat with<br/>
                        <span className="lp-h1-accent">anyone,</span><br/>
                        anytime.
                    </h1>
                    <p className="lp-sub lp-anim-3">
                        Real-time messaging, WebRTC file sharing, typing indicators and read receipts — all in one warm little app.
                    </p>
                    <div className="lp-hero-btns lp-anim-4">
                        <button className="lp-btn-primary lp-pulse" onClick={guestLogin}>
                            Try as Guest
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>
                        </button>
                        <a href="/registration" className="lp-btn-ghost">Create account</a>
                    </div>
                    {loginErr && <p className="lp-hero-err lp-anim-5">{loginErr}</p>}
                    <p className="lp-demo-hint lp-anim-5">
                        Demo: <code>{DEMO_EMAIL}</code> / <code>{DEMO_PASSWORD}</code>
                    </p>
                </div>

                {/* Animated chat card */}
                <div className="lp-hero-card lp-float">
                    <div className="lp-card-header">
                        <div className="lp-card-av">J</div>
                        <div>
                            <div className="lp-card-name">Jamie</div>
                            <div className="lp-card-status">● Online</div>
                        </div>
                    </div>
                    <div className="lp-card-msgs">
                        <div className="lp-msg lp-msg-other lp-pop-1">Hey! How are you? 👋</div>
                        <div className="lp-msg lp-msg-own   lp-pop-2">Just found HeyBuddy 🔥</div>
                        <div className="lp-msg lp-msg-other lp-pop-3">It's so fast! ⚡</div>
                        <div className="lp-msg lp-msg-own   lp-pop-4">Right?? Love the vibe 💯</div>
                        <div className="lp-typing lp-pop-5">
                            <span/><span/><span/>
                        </div>
                    </div>
                    <div className="lp-card-bar">
                        <span className="lp-card-placeholder">Type a message...</span>
                        <div className="lp-card-send">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Demo credentials ── */}
            <section className="lp-demo-section">
                <div className="lp-demo-card">
                    <div className="lp-demo-left">
                        <div className="lp-demo-label">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                            Demo Credentials
                        </div>
                        <div className="lp-demo-cred">
                            <span className="lp-demo-key">Email</span>
                            <code className="lp-demo-val">{DEMO_EMAIL}</code>
                        </div>
                        <div className="lp-demo-cred">
                            <span className="lp-demo-key">Password</span>
                            <code className="lp-demo-val">{DEMO_PASSWORD}</code>
                        </div>
                    </div>
                    <div className="lp-demo-right">
                        <button className="lp-copy-btn" onClick={copy}>
                            {copied
                                ? <><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> Copied!</>
                                : <><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy</>
                            }
                        </button>
                        <button className="lp-btn-primary lp-pulse" onClick={guestLogin}>
                            One-click login
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="lp-features">
                <h2 className="lp-section-title">Everything you need to connect</h2>
                <p className="lp-section-sub">Built for the way people actually chat.</p>
                <div className="lp-features-grid">
                    {FEATURES.map((f, i) => (
                        <div className="lp-feat-card" key={i} style={{'--fc': f.color, '--fb': f.bg}}>
                            <div className="lp-feat-icon">{f.icon}</div>
                            <h3 className="lp-feat-title">{f.title}</h3>
                            <p className="lp-feat-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Tech stack ── */}
            <section className="lp-tech">
                <p className="lp-section-label">Tech Stack</p>
                <div className="lp-tech-badges">
                    {TECH.map(t => (
                        <span key={t.label} className="lp-tech-badge" style={{color: t.color, background: t.bg}}>
                            {t.label}
                        </span>
                    ))}
                </div>
            </section>

            {/* ── Achievements ── */}
            <section className="lp-achievements">
                <h2 className="lp-section-title">Technical Highlights</h2>
                <div className="lp-ach-list">
                    {ACHIEVEMENTS.map((a, i) => (
                        <div className="lp-ach-card" key={i}>
                            <div className="lp-ach-num">{i + 1}</div>
                            <div>
                                <div className="lp-ach-title">{a.title}</div>
                                <div className="lp-ach-desc">{a.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="lp-cta">
                <h2 className="lp-cta-title">Ready to say hey? 👋</h2>
                <p className="lp-cta-sub">Join today and start chatting — completely free.</p>
                <div className="lp-cta-btns">
                    <button className="lp-btn-primary lp-btn-lg lp-pulse" onClick={guestLogin}>Try as Guest</button>
                    <a href="/registration" className="lp-btn-ghost lp-btn-lg">Create account</a>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="lp-footer">
                <span className="lp-footer-logo">HeyBuddy!</span>
                <span className="lp-footer-copy">Made with ♡ for better conversations</span>
            </footer>
        </div>
    );
}
