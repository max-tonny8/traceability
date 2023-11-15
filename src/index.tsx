import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import { COGNITO_CONFIG } from './Constants';

import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
  Auth: {
    region: COGNITO_CONFIG.REGION,
    userPoolId: COGNITO_CONFIG.USER_POOL_ID,
    userPoolWebClientId: COGNITO_CONFIG.USER_POOL_APP_CLIENT_ID,
    identityPoolId: 'us-east-1:e7622daa-1cea-4548-a8fb-0c80eed9afbd'
    
  }
})

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Authenticator hideSignUp variation='modal'>
        {({ signOut, user }) => (
          <App session={{signOut, user}}/>
        )}
    </Authenticator>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
