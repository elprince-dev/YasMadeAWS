import { Route, Routes } from 'react-router-dom';
import OrderConfirmationPage from './pages/OrderConfirmationPage';

function App() {
  return (
    <Routes>
      <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
    </Routes>
  );
}

export default App;