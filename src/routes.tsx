import React, { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'

const HomePage = React.lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const PracticePage = React.lazy(() => import('./pages/PracticePage').then(m => ({ default: m.PracticePage })))
const QuestionPage = React.lazy(() => import('./pages/QuestionPage').then(m => ({ default: m.QuestionPage })))
const NotesPage = React.lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })))
const AnalysisPage = React.lazy(() => import('./pages/AnalysisPage').then(m => ({ default: m.AnalysisPage })))
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))

const Loading = () => <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Suspense fallback={<Loading />}><LoginPage /></Suspense>,
  },
  {
    path: '/',
    element: <AppLayout><Suspense fallback={<Loading />}><HomePage /></Suspense></AppLayout>,
  },
  {
    path: '/practice',
    element: <AppLayout><Suspense fallback={<Loading />}><PracticePage /></Suspense></AppLayout>,
  },
  {
    path: '/practice/:questionId',
    element: <AppLayout><Suspense fallback={<Loading />}><QuestionPage /></Suspense></AppLayout>,
  },
  {
    path: '/notes',
    element: <AppLayout><Suspense fallback={<Loading />}><NotesPage /></Suspense></AppLayout>,
  },
  {
    path: '/analysis',
    element: <AppLayout><Suspense fallback={<Loading />}><AnalysisPage /></Suspense></AppLayout>,
  },
])
