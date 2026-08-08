import React from 'react'
import ReactDOM from 'react-dom/client'
import {BrowserRouter, Route, Routes, Navigate} from "react-router-dom"
import {Toaster} from 'react-hot-toast'
import store from "./store"
import {Provider} from "react-redux"
import {PersistGate} from 'redux-persist/integration/react'
import {persistStore} from 'redux-persist'

import "bootstrap/dist/css/bootstrap.css";
import "font-awesome/css/font-awesome.css";

import {PrivateRoute} from './routes'

import SideBar from "./components/SideBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Chats from "./pages/Chats";
import Settings from "./pages/Settings"

const persist = persistStore(store);

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route index element={<Home/>}/>
                <Route path='/login' element={<Login/>}/>
                <Route path='/registration' element={<SignUp/>}/>
                <Route path='/chats' element={<SideBar> <PrivateRoute> <Chats/> </PrivateRoute> </SideBar>}/>
                <Route path='/settings' element={<SideBar> <PrivateRoute> <Settings/> </PrivateRoute> </SideBar>}/>
            </Routes>
        </BrowserRouter>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <Provider store={store}>
        <PersistGate loading={null} persistor={persist}>
            <App/>
            <Toaster/>
        </PersistGate>
    </Provider>
)