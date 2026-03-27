import React, { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AuthGuard } from './components/auth/AuthGuard'

const HomePage = React.lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const PracticePage = React.lazy(() => import('./pages/PracticePage').then(m => ({ default: m.PracticePage })))
const QuestionPage = React.lazy(() => import('./pages/QuestionPage').then(m => ({ default: m.QuestionPage })))
const NotesPage = React.lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })))
const FusenDetailPage = React.lazy(() => import('./pages/FusenDetailPage').then(m => ({ default: m.FusenDetailPage })))
const AnalysisPage = React.lazy(() => import('./pages/AnalysisPage').then(m => ({ default: m.AnalysisPage })))
const FlashCardListPage = React.lazy(() => import('./pages/FlashCardListPage').then(m => ({ default: m.FlashCardListPage })))
const FlashCardPage = React.lazy(() => import('./pages/FlashCardPage').then(m => ({ default: m.FlashCardPage })))
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })))
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))

const DevToolsReview = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/review/ReviewPage'))
  : null

const FusenReview = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/fusen-review/FusenReviewPage'))
  : null

const FusenAnnotate = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/fusen-annotate/FusenAnnotatePage'))
  : null

const ExemplarMapping = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/exemplar-mapping/ExemplarMappingPage'))
  : null

const Loading = () => <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>

/** AuthGuard でラップするヘルパー */
function Protected({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}

export const router = createBrowserRouter([
  // --- 公開ルート（認証不要） ---
  {
    path: '/login',
    element: <Suspense fallback={<Loading />}><LoginPage /></Suspense>,
  },
  {
    path: '/auth/callback',
    element: <Suspense fallback={<Loading />}><AuthCallbackPage /></Suspense>,
  },
  {
    path: '/onboarding',
    element: <Suspense fallback={<Loading />}><OnboardingPage /></Suspense>,
  },

  // --- 認証必須ルート ---
  {
    path: '/',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><HomePage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/practice',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><PracticePage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/practice/:questionId',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><QuestionPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/notes',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><NotesPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/notes/:fusenId',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><FusenDetailPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/cards',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><FlashCardListPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/cards/review',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><FlashCardPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/analysis',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><AnalysisPage /></Suspense></AppLayout></Protected>,
  },

  // --- Dev Tools（認証不要。DEV環境のみ） ---
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
  ...(import.meta.env.DEV && ExemplarMapping ? [{
    path: '/dev-tools/exemplar-mapping',
    element: <Suspense fallback={<Loading />}><ExemplarMapping /></Suspense>,
  }] : []),
])
