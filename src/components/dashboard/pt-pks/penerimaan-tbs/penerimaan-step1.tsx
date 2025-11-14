"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search } from "lucide-react";
import type { PenerimaanFormData } from "./penerimaan-wizard";

type Material = {
  id: string;
  name: string;
  code: string;
  kategori: { name: string };
  satuan: { name: string; symbol: string };
};

type Supplier = {
  id: string;
  ownerName: string;
  type: string;
  address: string;
  companyName?: string | null;
};

type Transporter = {
  id: string;
  nomorKendaraan: string;
  namaSupir: string;
  telepon?: string | null;
};

type Step1Props = {
  data: Partial<PenerimaanFormData>;
  onUpdate: (data: Partial<PenerimaanFormData>) => void;
  onNext: () => void;
};

export function PenerimaanStep1({ data, onUpdate, onNext }: Step1Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [filteredTransporters, setFilteredTransporters] = useState<Transporter[]>([]);
  const [searchSupplier, setSearchSupplier] = useState("");
  const [searchTransporter, setSearchTransporter] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const [formData, setFormData] = useState({
    materialId: data.materialId || "",
    supplierId: data.supplierId || "",
    transporterType: data.transporterType || "existing" as "existing" | "new",
    transporterId: data.transporterId || "",
    nomorKendaraan: data.nomorKendaraan || "",
    namaSupir: data.namaSupir || "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const url = searchSupplier
          ? `/api/pt-pks/penerimaan-tbs/suppliers?search=${encodeURIComponent(searchSupplier)}`
          : "/api/pt-pks/penerimaan-tbs/suppliers";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSuppliers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSuppliers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchSupplier]);

  useEffect(() => {
    if (searchTransporter) {
      const filtered = transporters.filter(
        (t) =>
          t.nomorKendaraan.toLowerCase().includes(searchTransporter.toLowerCase()) ||
          t.namaSupir.toLowerCase().includes(searchTransporter.toLowerCase())
      );
      setFilteredTransporters(filtered);
    } else {
      setFilteredTransporters(transporters);
    }
  }, [searchTransporter, transporters]);

  const fetchData = async () => {
    try {
      const [materialsRes, suppliersRes, transportersRes] = await Promise.all([
        fetch("/api/pt-pks/material"),
        fetch("/api/pt-pks/penerimaan-tbs/suppliers"),
        fetch("/api/pt-pks/transporter"),
      ]);

      if (materialsRes.ok) {
        const materialsData = await materialsRes.json();
        setMaterials(materialsData);
      }

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      }

      if (transportersRes.ok) {
        const transportersData = await transportersRes.json();
        setTransporters(transportersData);
        setFilteredTransporters(transportersData);
      }

      // Get current user from session
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        if (session?.user?.name) {
          setUserName(session.user.name);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSelect = (supplierId: string) => {
    setFormData({ ...formData, supplierId });
  };

  const handleNext = () => {
    if (!formData.materialId) {
      alert("Produk harus dipilih");
      return;
    }

    if (!formData.supplierId) {
      alert("Supplier harus dipilih");
      return;
    }

    if (formData.transporterType === "existing" && !formData.transporterId) {
      alert("Transporter harus dipilih");
      return;
    }

    if (formData.transporterType === "new") {
      if (!formData.nomorKendaraan || !formData.namaSupir) {
        alert("Nomor kendaraan dan nama supir harus diisi");
        return;
      }
    }

    const now = new Date();
    onUpdate({
      ...formData,
      tanggalTerima: now,
      operatorPenimbang: userName || "Operator",
    });
    onNext();
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Auto Generate Section */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
        <div>
          <Label className="text-sm text-muted-foreground">No. Penerimaan</Label>
          <div className="font-mono font-semibold">Auto Generate</div>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Tanggal & Jam Terima</Label>
          <div className="font-medium">{new Date().toLocaleString("id-ID")}</div>
        </div>
      </div>

      {/* Produk Selection */}
      <div className="space-y-2">
        <Label htmlFor="material">Produk *</Label>
        <Select value={formData.materialId} onValueChange={(value) => setFormData({ ...formData, materialId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih produk" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{material.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {material.code} - {material.kategori.name} ({material.satuan.symbol})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator Penimbang */}
      <div className="space-y-2">
        <Label htmlFor="operator">Operator Penimbang</Label>
        <Input
          id="operator"
          value={userName || "Loading..."}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Operator otomatis diambil dari user yang sedang login
        </p>
      </div>

      {/* Supplier Selection */}
      <div className="space-y-2">
        <Label htmlFor="supplier">Supplier *</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="searchSupplier"
            placeholder="Cari nama supplier, perusahaan, atau alamat..."
            value={searchSupplier}
            onChange={(e) => setSearchSupplier(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="border rounded-md max-h-96 overflow-y-auto">
          {suppliers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchSupplier
                  ? "Supplier tidak ditemukan"
                  : "Belum ada supplier terdaftar"}
              </div>
            </div>
          ) : (
            <div className="grid gap-2 p-2">
              {suppliers.map((supplier) => {
                const isSelected = formData.supplierId === supplier.id;
                return (
                  <div
                    key={supplier.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-md"
                        : "bg-card hover:border-primary/50"
                    }`}
                    onClick={() => handleSupplierSelect(supplier.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-base">
                            {supplier.ownerName}
                          </div>
                          {isSelected && (
                            <div className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                              Dipilih
                            </div>
                          )}
                        </div>
                        {supplier.companyName && (
                          <div className="text-sm text-muted-foreground mb-1">
                            {supplier.companyName}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Tipe:</span>
                            <span>{supplier.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Alamat:</span>
                            <span className="line-clamp-1">{supplier.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Kendaraan & Supir Section */}
      {formData.supplierId && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">Kendaraan & Supir</h3>
          
          <RadioGroup
            value={formData.transporterType}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                transporterType: value as "existing" | "new",
                transporterId: "",
                nomorKendaraan: "",
                namaSupir: "",
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="font-normal cursor-pointer">
                Pilih dari data yang ada
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="font-normal cursor-pointer">
                Tambah data baru
              </Label>
            </div>
          </RadioGroup>

          {formData.transporterType === "existing" && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="transporter">Cari Transporter</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchTransporter"
                  placeholder="Cari nomor kendaraan atau nama supir..."
                  value={searchTransporter}
                  onChange={(e) => setSearchTransporter(e.target.value)}
                  className="pl-9"
                />
              </div>

              {searchTransporter && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {filteredTransporters.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      Transporter tidak ditemukan
                    </div>
                  ) : (
                    filteredTransporters.map((transporter) => (
                      <div
                        key={transporter.id}
                        className={`p-3 cursor-pointer hover:bg-muted border-b last:border-b-0 ${
                          formData.transporterId === transporter.id ? "bg-muted" : ""
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, transporterId: transporter.id });
                          setSearchTransporter("");
                        }}
                      >
                        <div className="font-medium">{transporter.nomorKendaraan}</div>
                        <div className="text-sm text-muted-foreground">
                          Supir: {transporter.namaSupir}
                          {transporter.telepon && ` - ${transporter.telepon}`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {formData.transporterId && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                  {(() => {
                    const selected = transporters.find((t) => t.id === formData.transporterId);
                    return selected ? (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{selected.nomorKendaraan}</div>
                          <div className="text-sm text-muted-foreground">
                            Supir: {selected.namaSupir}
                            {selected.telepon && ` - ${selected.telepon}`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({ ...formData, transporterId: "" });
                          }}
                        >
                          Ubah
                        </Button>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}

          {formData.transporterType === "new" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="nomorKendaraan">Nomor Kendaraan *</Label>
                <Input
                  id="nomorKendaraan"
                  placeholder="B 1234 XYZ"
                  value={formData.nomorKendaraan}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorKendaraan: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaSupir">Nama Supir *</Label>
                <Input
                  id="namaSupir"
                  placeholder="Nama supir"
                  value={formData.namaSupir}
                  onChange={(e) =>
                    setFormData({ ...formData, namaSupir: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} size="lg">
          Lanjut ke Timbangan Bruto
        </Button>
      </div>
    </div>
  );
}
