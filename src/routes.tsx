import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { HomePage } from './pages/HomePage'
import { PracticePage } from './pages/PracticePage'
import { QuestionPage } from './pages/QuestionPage'
import { NotesPage } from './pages/NotesPage'
import { AnalysisPage } from './pages/AnalysisPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout><HomePage /></AppLayout>,
  },
  {
    path: '/practice',
    element: <AppLayout><PracticePage /></AppLayout>,
  },
  {
    path: '/practice/:questionId',
    element: <AppLayout><QuestionPage /></AppLayout>,
  },
  {
    path: '/notes',
    element: <AppLayout><NotesPage /></AppLayout>,
  },
  {
    path: '/analysis',
    element: <AppLayout><AnalysisPage /></AppLayout>,
  },
])
