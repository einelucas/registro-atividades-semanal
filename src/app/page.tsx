import App from '@/components/App';
export default function Home(){
 const config={clientId:process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID||'',tenant:process.env.NEXT_PUBLIC_ENTRA_TENANT_ID||'',scope:process.env.NEXT_PUBLIC_ENTRA_API_SCOPE||''};
 const payload=JSON.stringify(config).replace(/</g,'\\u003c');
 return <><script dangerouslySetInnerHTML={{__html:`window.INPASA_CONFIG=${payload};`}}/><App/></>;
}
