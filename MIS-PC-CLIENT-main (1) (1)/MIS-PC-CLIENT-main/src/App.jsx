import { Routes, Route } from "react-router-dom";

import Login from "./Authentication/Login/LoginForm.jsx";

import UserProtected from "./Authentication/ProtectedRoutes/UserProtected.jsx";
import AdminProtected from "./Authentication/ProtectedRoutes/AdminProtected.jsx";

import UserLayout from "./User/layout/UserLayout.jsx";
import MiInput from "./User/pages/miinput.jsx";

import AdminLayout from "./ADMIN/layout/AdminLayout.jsx";

import Dashboard from "./ADMIN/pages/Dashboard/dashboard.jsx";
import Production from "./ADMIN/pages/Production/production.jsx";
import Tracking from "./ADMIN/pages/Tracking/Tracking.jsx";
import ReworkStations from "./ADMIN/pages/Masters/ReworkStations.jsx";
import ProductStage from "./ADMIN/pages/Tracking/ProductStage.jsx";
import CreateProductionOrderModal from "./ADMIN/pages/Tracking/ProductionOrder.jsx"; 
import ScanStage from "./ADMIN/pages/Tracking/ScanStage.jsx";
import ScanHistory from "./ADMIN/pages/Tracking/ScanHistory.jsx";

import Users from "./ADMIN/pages/Users/users.jsx";

import Masters from "./ADMIN/pages/Masters/masters.jsx";
import ManageLines from "./ADMIN/pages/Masters/ManageLines.jsx";
import ManageStages from "./ADMIN/pages/Masters/ManageStages.jsx";
import ManageModels from "./ADMIN/pages/Masters/ManageModels.jsx";
import QRMaster from "./ADMIN/pages/Masters/ManageQRMaster.jsx";
import ManageCategories from "./ADMIN/pages/Masters/ManageCategories.jsx";
import ManageProducts from "./ADMIN/pages/Masters/ManageProducts.jsx";
import ManagepdFields from "./ADMIN/pages/Masters/ManagepdFields.jsx";
import ManageItems from "./ADMIN/pages/Masters/ManageItems.jsx";
import ManageItemFields from "./ADMIN/pages/Masters/ManageItemFields.jsx";

import PackegingRuleManager from "./ADMIN/pages/Tracking/PackegingRuleManager.jsx";

import Reports from "./ADMIN/pages/Reports/reports.jsx";
import Settings from "./ADMIN/pages/Settings/settings.jsx";

import QualityControl from "./ADMIN/pages/Quality/QualityControl.jsx";

function App() {


  return (
    <Routes>

      {/* Landing */}
      <Route path="/" element={<div>This is Landing Page...</div>} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* ================= USER ================= */}

      <Route element={<UserProtected />}>
        <Route
          path="/user"
          element={<UserLayout userName="Himanshu" onLogout={() => {}} />}
        >
          <Route path="dashboard" element={<MiInput />} />
          <Route path="workspace" element={<div>Workspace</div>} />
          <Route path="reports" element={<div>User Reports</div>} />
          <Route path="settings" element={<div>User Settings</div>} />
        </Route>
      </Route>

      {/* ================= ADMIN ================= */}

      <Route element={<AdminProtected />}>
        <Route path="/admin" element={<AdminLayout />}>

          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />
          {/* Production */}
          <Route path="production" element={<Production />} />
          {/* Tracking */}
          <Route path="tracking" element={<Tracking />}>
            <Route path="product-stage" element={<ProductStage />} />
            <Route path="scan-stage" element={<ScanStage />} />
            <Route path="production-order" element={<CreateProductionOrderModal />} />
            <Route path="scan-history" element={<ScanHistory />} />
            <Route path="manage-packaging" element={<PackegingRuleManager />} />
          </Route>
          {/* Users */}
          <Route path="users" element={<Users />} />
          <Route path="quality" element={<QualityControl />} />
          {/* Masters */}
          <Route path="masters" element={<Masters />}>
            <Route path="lines" element={<ManageLines />} />
            <Route path="stages" element={<ManageStages />} />
            <Route path="models" element={<ManageModels />} />
            <Route path="qr-master" element={<QRMaster />} />
            <Route path="categories" element={<ManageCategories />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="pd-fields" element={<ManagepdFields />} />
            <Route path="items" element={<ManageItems />} />
            <Route path="item-fields" element={<ManageItemFields />} />
            <Route path="rework-stations" element={<ReworkStations />} />
          </Route>
          {/* Reports */}
          <Route path="reports" element={<Reports />} />
          {/* Settings */}
          <Route path="settings" element={<Settings />} />

        </Route>
      </Route>

    </Routes>
  );
}

export default App;