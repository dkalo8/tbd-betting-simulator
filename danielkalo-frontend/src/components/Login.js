import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function Login({ setUser }) {
    const onSuccess = (res) => {
        const idToken = res.credential;
        const tokenData = jwtDecode(idToken);
        const loginData = {
            googleId: tokenData.sub,
            ...tokenData,
            idToken,
        };
        setUser(loginData);
        localStorage.setItem("login", JSON.stringify(loginData));
        console.log('Login Success: currentUser:', loginData);
    };

    const onFailure = (res) => {
        console.log('Login failed: res:', res);
    }

    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <GoogleLogin
                onSuccess={onSuccess}
                onFailure={onFailure}
                useOneTap
                size="medium"
                width="250"
            />
        </GoogleOAuthProvider>
    );
}

export default Login;