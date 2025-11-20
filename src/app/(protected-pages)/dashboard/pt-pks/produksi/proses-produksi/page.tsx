"use client";

import { useState } from "react";
import { ProsesProduksiList } from "@/components/dashboard/pt-pks/proses-produksi/proses-produksi-list";
import { ProsesProduksiWizard } from "@/components/dashboard/pt-pks/proses-produksi/proses-produksi-wizard";
import { ProsesProduksiDetail } from "@/components/dashboard/pt-pks/proses-produksi/proses-produksi-detail";

type ViewMode = "list" | "create" | "edit" | "detail";

export default function ProsesProduksiPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateClick = () => {
    setSelectedId(null);
    setViewMode("create");
  };

  const handleEditClick = (id: string) => {
    setSelectedId(id);
    setViewMode("edit");
  };

  const handleViewClick = (id: string) => {
    setSelectedId(id);
    setViewMode("detail");
  };

  const handleSuccess = () => {
    setViewMode("list");
    setSelectedId(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedId(null);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-6">
      {viewMode === "list" && (
        <ProsesProduksiList
          key={refreshKey}
          onCreateClick={handleCreateClick}
          onEditClick={handleEditClick}
          onViewClick={handleViewClick}
          onRefresh={handleRefresh}
        />
      )}

      {(viewMode === "create" || viewMode === "edit") && (
        <ProsesProduksiWizard
          id={viewMode === "edit" ? selectedId || undefined : undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}

      {viewMode === "detail" && selectedId && (
        <ProsesProduksiDetail
          id={selectedId}
          onBack={handleCancel}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
