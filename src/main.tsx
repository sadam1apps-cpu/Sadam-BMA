import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import InstallPWA from './components/common/InstallPWA.tsx';
import UpdatePrompt from './components/common/UpdatePrompt.tsx';
import './index.css';

registerSW({immediate: true});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <InstallPWA />
    <UpdatePrompt />
  </StrictMode>,
);