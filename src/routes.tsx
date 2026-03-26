import React, { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'

const HomePage = React.lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const PracticePage = React.lazy(() => import('./pages/PracticePage').then(m => ({ default: m.PracticePage })))
const QuestionPage = React.lazy(() => import('./pages/QuestionPage').then(m => ({ default: m.QuestionPage })))
const NotesPage = React.lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })))
const FusenDetailPage = React.lazy(() => import('./pages/FusenDetailPage').then(m => ({ default: m.FusenDetailPage })))
const AnalysisPage = React.lazy(() => import('./pages/AnalysisPage').then(m => ({ default: m.AnalysisPage })))
const FlashCardListPage = React.lazy(() => import('./pages/FlashCardListPage').then(m => ({ default: m.FlashCardListPage })))
const FlashCardPage = React.lazy(() => import('./pages/FlashCardPage').then(m => ({ default: m.FlashCardPage })))
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))

const DevToolsReview = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/review/ReviewPage'))
  : null

const FusenReview = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/fusen-review/FusenReviewPage'))
  : null

const FusenAnnotate = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/fusen-annotate/FusenAnnotatePage'))
  : null

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
    path: '/notes/:fusenId',
    element: <AppLayout><Suspense fallback={<Loading />}><FusenDetailPage /></Suspense></AppLayout>,
  },
  {
    path: '/cards',
    element: <AppLayout><Suspense fallback={<Loading />}><FlashCardListPage /></Suspense></AppLayout>,
  },
  {
    path: '/cards/review',
    element: <AppLayout><Suspense fallback={<Loading />}><FlashCardPage /></Suspense></AppLayout>,
  },
  {
    path: '/analysis',
    element: <AppLayout><Suspense fallback={<Loading />}><AnalysisPage /></Suspense></AppLayout>,
  },
  ...(import.meta.env.DEV && DevToolsReview ? [{
    path: '/dev-tools/review',
    element: <Suspense fallback={<Loading />}><DevToolsReview /></Suspense>,
  }] : []),
  ...(import.meta.env.DEV && FusenReview ? [{
    path: '/dev-tools/fusen-review',
    element: <Suspense fallback={<Loading />}><FusenReview /></Suspense>,
  }] : []),
  ...(import.meta.env.DEV && FusenAnnotate ? [{
    path: '/dev-tools/fusen-annotate',
    element: <Suspense fallback={<Loading />}><FusenAnnotate /></Suspense>,
  }] : []),
])
