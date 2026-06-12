import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { AuditPage } from "@/pages/AuditPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { EvaluationPage } from "@/pages/EvaluationPage";
import { HitlPage } from "@/pages/HitlPage";
import { InsertPage } from "@/pages/InsertPage";
import { TransactionsPage } from "@/pages/TransactionsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="insert" element={<InsertPage />} />
        <Route path="simulator" element={<Navigate to="/insert" replace />} />
        <Route path="evaluations/:transactionId" element={<EvaluationPage />} />
        <Route path="hitl" element={<HitlPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="audit/:transactionId" element={<AuditPage />} />
      </Route>
    </Routes>
  );
}
