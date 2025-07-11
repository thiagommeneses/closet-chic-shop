import { CheckoutForm } from '@/components/CheckoutForm';
import { Header } from '@/components/Header';

const Checkout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CheckoutForm />
    </div>
  );
};

export default Checkout;