import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import Overview from "./pages/Overview/Overview";
import Customers from "./pages/Customers/Customers";
import Opportunities from "./pages/Opportunities/Opportunities";
import SalesReps from "./pages/SalesReps/SalesReps";
import Products from "./pages/Products/Products";
import Reports from "./pages/Reports/Reports";
import Settings from "./pages/Settings/Settings";
import Revenue from "./pages/Revenue/Revenue";

function Placeholder({ title, description }) {
  return (
    <section>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">ANALYTICS</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="empty-state">
        <h2>{title} workspace</h2>
        <p>
          This module will be connected to the live analytics APIs next.
        </p>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Overview />} />

          <Route path="/revenue" element={<Revenue />} />

          <Route path="/customers" element={<Customers />} />

          <Route path="/opportunities" element={<Opportunities />} />

          <Route path="/sales-reps" element={<SalesReps />} />

          <Route path="/products" element={<Products />} />

          <Route path="/reports" element={<Reports />} />

          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
