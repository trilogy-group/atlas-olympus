import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode"; 
import { useNavigate } from 'react-router-dom'; 
import { saveGooglePhoto } from "../../data/fetchData";

const GoogleLoginButton = () => {

  const navigate = useNavigate();
  const onSuccess = (credentialResponse) => {
    // console.log(`credentialResponse = ${JSON.stringify(credentialResponse)}`);
    const decoded = jwtDecode(credentialResponse.credential);
    // console.log(`decoded = ${JSON.stringify(decoded)}`);

    localStorage.setItem('user_info', JSON.stringify(decoded));
    localStorage.setItem('token_for_backend', credentialResponse.credential);
    localStorage.setItem('fresh_login', 'true');
    localStorage.setItem('session_timestamp', Date.now().toString());
    navigate('/dashboard/passive');

    let payload = {
                    googleimage: decoded.picture.toString(),
                    email: decoded.email.toString()
                  };

    saveGooglePhoto(payload);
    
  };

  const onError = () => {
    console.log('Login Failed');
  };

  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={onError}
      useOneTap
      theme="filled_blue"
      size="large"
      text="signin_with"
      shape="rectangular"
      logo_alignment="left"
      width="320" // 20% less width (400 * 0.8 = 320)
      // redirect_uri="http://localhost:3000/dashboard/passive" // Ensure this URI is correct
    />
  );
};

export default GoogleLoginButton;
