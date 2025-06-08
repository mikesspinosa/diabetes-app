import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Home from './pages/Home';
import GlucoseMonitoring from './pages/GlucoseMonitoring';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="glucose" element={<GlucoseMonitoring />} />
            <Route path="glucose/trends" element={<PlaceholderPage title="Tendencias de Glucosa" />} />
            <Route path="glucose/history" element={<PlaceholderPage title="Historial de Glucosa" />} />
            <Route path="carbs" element={<PlaceholderPage title="Registro de Carbohidratos" />} />
            <Route path="insulin" element={<PlaceholderPage title="Registro de Insulina" />} />
            <Route path="calculator" element={<PlaceholderPage title="Calculadora de Bolo" />} />
            <Route path="stats" element={<PlaceholderPage title="Estadísticas" />} />
            <Route path="devices" element={<PlaceholderPage title="Dispositivos" />} />
            <Route path="alerts" element={<PlaceholderPage title="Alertas" />} />
            <Route path="settings" element={<PlaceholderPage title="Configuración" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App; 