import React from 'react';
import {createRoot} from 'react-dom/client';
import App from '../../src/components/App';
import '../../src/styles/globals.css';
declare global { interface Window {INPASA_CONFIG?:{clientId?:string;tenant?:string;scope?:string};INPASA_API_URL?:string;INPASA_DEMO?:boolean;} }
window.INPASA_CONFIG={clientId:import.meta.env.VITE_ENTRA_CLIENT_ID||'',tenant:import.meta.env.VITE_ENTRA_TENANT_ID||'',scope:import.meta.env.VITE_ENTRA_API_SCOPE||''};
window.INPASA_API_URL=import.meta.env.VITE_API_URL||'';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
