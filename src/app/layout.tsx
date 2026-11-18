import type { Metadata } from 'next';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter';
import '../styles/globals.css';
export const metadata:Metadata={title:'INPASA • Projetos & Arquitetura',description:'Registro de atividades, gestão e acompanhamento de projetos'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><AppRouterCacheProvider>{children}</AppRouterCacheProvider></body></html>}
