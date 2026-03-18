import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SettingsProvider } from '@/stores/useSettingsStore'
import { UserProvider } from '@/stores/useUserStore'
import { AuditProvider } from '@/stores/useAuditStore'
import { PatientProvider } from '@/stores/usePatientStore'
import { DocumentProvider } from '@/stores/useDocumentStore'
import Layout from './components/Layout'

// Pages
import Index from './pages/Index'
import Patients from './pages/Patients'
import Consultation from './pages/Consultation'
import Documents from './pages/Documents'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Login from './pages/Login'

const App = () => (
  <UserProvider>
    <AuditProvider>
      <SettingsProvider>
        <PatientProvider>
          <DocumentProvider>
            <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/pacientes" element={<Patients />} />
                    <Route path="/prontuario/:id" element={<Consultation />} />
                    <Route path="/documentos" element={<Documents />} />
                    <Route path="/configuracoes" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </BrowserRouter>
          </DocumentProvider>
        </PatientProvider>
      </SettingsProvider>
    </AuditProvider>
  </UserProvider>
)

export default App
