// Update the routes in App.jsx to include the new OrderConfirmationPage
import OrderConfirmationPage from './pages/OrderConfirmationPage';

// Add this route inside the Routes component
<Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />

export default OrderConfirmationPage