import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BusinessProvider, useBusiness } from '@/contexts/BusinessContext';
import Navbar from '@/components/Navbar';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Inventory from '@/pages/Inventory';
import Sales from '@/pages/Sales';
import Purchases from '@/pages/Purchases';
import Suppliers from '@/pages/Suppliers';
import Students from '@/pages/Students';
import StudentDetail from '@/pages/StudentDetail';
import Customers from '@/pages/Customers';
import CustomerDetail from '@/pages/CustomerDetail';
import Expenses from '@/pages/Expenses';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import './App.css';

// Wrapper component to handle conditional routing based on business type
function BusinessRoutes() {
  const { activeBusiness } = useBusiness();
  const isGeneralStore = activeBusiness === 'general';

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/sales" element={<Sales />} />
      <Route path="/purchases" element={<Purchases />} />
      <Route path="/suppliers" element={<Suppliers />} />
      {isGeneralStore ? (
        <>
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
        </>
      ) : (
        <>
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
        </>
      )}
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BusinessProvider>
      <Router>
        <div className="flex min-h-screen bg-slate-50">
          <Navbar />
          <main className="flex-1  justify-center">
            <div className="w-full max-w-7xl px-4 py-8">
              <BusinessRoutes />
            </div>
          </main>
        </div>
      </Router>
    </BusinessProvider>
  );
}

export default App;
