import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ConfigPage from "./pages/ConfigPage.jsx";
import CreateSingleResourcePage from "./pages/CreateSingleResourcePage.jsx";
import CategoriesPage from "./pages/CategoriesPage.jsx";
import CreateCategoryPage from "./pages/CreateCategoryPage.jsx";

import BulkOperationsPage from "./pages/BulkOperationsPage.jsx";
import BulkCreatePage from "./pages/BulkCreatePage.jsx";
import BulkUpdatePage from "./pages/BulkUpdatePage.jsx";
import BulkReportPage from "./pages/BulkReportPage.jsx";
import BulkRequestDetailsPage from "./pages/BulkRequestDetailsPage.jsx";

import LiveChatPage from "./pages/LiveChatPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/bulk" replace />} />

        <Route path="bulk" element={<BulkOperationsPage />} />
        <Route path="bulk/create" element={<BulkCreatePage />} />
        <Route path="bulk/update" element={<BulkUpdatePage />} />
        <Route path="bulk/report" element={<BulkReportPage />} />
        <Route path="bulk/:id" element={<BulkRequestDetailsPage />} />

        <Route path="create-single-resource" element={<CreateSingleResourcePage />} />
        <Route path="config" element={<ConfigPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/create" element={<CreateCategoryPage />} />

        {/* Live Chat route */}
        <Route path="chat" element={<LiveChatPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}