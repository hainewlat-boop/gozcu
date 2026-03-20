
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { InventoryList } from './pages/Inventory/InventoryList';
import { WorkOrders } from './pages/Cmms/WorkOrders';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/cmms" element={<WorkOrders />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
