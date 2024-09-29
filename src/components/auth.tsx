import { useState } from "react";
import "../App.css";
import { auth, googleProvider } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';

export const Auth = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // check the user
    console.log(auth?.currentUser?.email)
    console.log(auth?.currentUser?.uid)

    const signIn = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('User created');
        } catch (error) {
            console.log('User not created', error);
        }
    };

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            console.log('User signed in with Google');
        } catch (error) {
            console.log('User not signed in with Google', error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            console.log('User signed out');
        } catch (error) {
            console.log('User not signed out', error);
        }
    }

    return (
        <div>
            <input placeholder="Email..." onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Password..." type="password" onChange={(e) => setPassword(e.target.value)} />
            <button onClick={signIn}>Sign In</button>
            <button onClick={signInWithGoogle}>Sign In with Google</button>
            <button onClick={logout}>Log Out</button>
        </div>
    );
};
