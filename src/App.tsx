import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { Cart } from "@/components/Cart";
import { FavoritesDrawer } from "@/components/FavoritesDrawer";
import Index from "./pages/Index";
import Product from "./pages/Product";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { ProductForm } from "./pages/admin/ProductForm";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminProductTemplates } from "./pages/admin/AdminProductTemplates";
import { AdminBanners } from "./pages/admin/AdminBanners";
import { AdminTopBanner } from "./pages/admin/AdminTopBanner";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import AdminMenu from "./pages/admin/AdminMenu";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminTags } from "./pages/admin/AdminTags";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FavoritesProvider>
      <CartProvider>
        <AdminProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produto/:slug" element={<Product />} />
              <Route path="/checkout" element={<Checkout />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/new" element={<ProductForm />} />
              <Route path="/admin/products/:id/edit" element={<ProductForm />} />
              <Route path="/admin/product-templates" element={<AdminProductTemplates />} />
              <Route path="/admin/banners" element={<AdminBanners />} />
              <Route path="/admin/top-banner" element={<AdminTopBanner />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/tags" element={<AdminTags />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Cart />
            <FavoritesDrawer />
          </BrowserRouter>
        </TooltipProvider>
      </AdminProvider>
    </CartProvider>
    </FavoritesProvider>
  </QueryClientProvider>
);

export default App;
