import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import { Spinner } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Invoices from './pages/Invoices';
import InvoiceView from './pages/InvoiceView';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/pos" element={<Protected><POS /></Protected>} />
      <Route path="/invoices" element={<Protected><Invoices /></Protected>} />
      <Route path="/invoices/:id" element={<Protected><InvoiceView /></Protected>} />
      <Route path="/products" element={<Protected><Products /></Protected>} />
      <Route path="/customers" element={<Protected><Customers /></Protected>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
