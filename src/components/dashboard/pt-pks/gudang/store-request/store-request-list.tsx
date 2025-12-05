"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { StoreRequestForm } from "./store-request-form";
import { StoreRequestDetail } from "./store-request-detail";
import { format } from "date-fns";

interface StoreRequest {
  id: string;
  nomorSR: string;
  tanggalRequest: string;
  divisi: string;
  requestedBy: string;
  approvedBy?: string;
  status: string;
  items: Array<{
    id: string;
    jumlahRequest: number;
    material: {
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

export function StoreRequestList() {
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedSR, setSelectedSR] = useState<StoreRequest | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchStoreRequests();
  }, [statusFilter]);

  const fetchStoreRequests = async () => {
    try {
      let url = "/api/pt-pks/gudang/store-request";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStoreRequests(data);
      }
    } catch (error) {
      console.error("Error fetching store requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      APPROVED: "default",
      COMPLETED: "default",
      REJECTED: "destructive",
      NEED_PR: "default",
      CANCELLED: "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const filteredSRs = storeRequests.filter(
    (sr) =>
      sr.nomorSR.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sr.divisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sr.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuccess = () => {
    setShowForm(false);
    setShowDetail(false);
    fetchStoreRequests();
  };

  if (showForm) {
    return <StoreRequestForm onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />;
  }

  if (showDetail && selectedSR) {
    // Ensure selectedSR has all required fields for StoreRequestDetail
    const detailData = {
      ...selectedSR,
      items: selectedSR.items.map(item => ({
        id: item.id,
        jumlahRequest: item.jumlahRequest ?? 0,
        keterangan: ('keterangan' in item && typeof item.keterangan === "string") ? item.keterangan : "",
        material: {
          partNumber: ('partNumber' in item.material && typeof item.material.partNumber === "string") ? item.material.partNumber : "",
          namaMaterial: item.material.namaMaterial ?? "",
          stockOnHand: ('stockOnHand' in item.material && typeof item.material.stockOnHand === "number") ? item.material.stockOnHand : 0,
          satuanMaterial: {
            symbol: item.material.satuanMaterial?.symbol ?? "",
          },
        },
      })),
    };
    return (
      <StoreRequestDetail
        storeRequest={detailData}
        onClose={() => {
          setShowDetail(false);
          setSelectedSR(null);
        }}
        onSuccess={handleSuccess}
      />
    );
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Store Request</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Buat SR Baru
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor SR, divisi, atau pemohon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="NEED_PR">Need PR</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor SR</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSRs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Tidak ada data store request
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSRs.map((sr) => (
                    <TableRow key={sr.id}>
                      <TableCell className="font-medium">{sr.nomorSR}</TableCell>
                      <TableCell>
                        {format(new Date(sr.tanggalRequest), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{sr.divisi}</TableCell>
                      <TableCell>{sr.requestedBy}</TableCell>
                      <TableCell>{sr.items.length} item</TableCell>
                      <TableCell>{getStatusBadge(sr.status)}</TableCell>
                      <TableCell>{sr.approvedBy || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSR(sr);
                            setShowDetail(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
