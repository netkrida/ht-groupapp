"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PengirimanFormData } from "./pengiriman-wizard";

type Vendor = {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
};

type VendorVehicle = {
  id: string;
  nomorKendaraan: string;
  namaSupir: string;
  noHpSupir?: string | null;
  vendor: Vendor;
};

type Step2Props = {
  data: Partial<PengirimanFormData>;
  onUpdate: (data: Partial<PengirimanFormData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function PengirimanStep2({ data, onUpdate, onNext, onBack }: Step2Props) {
  const [vehicles, setVehicles] = useState<VendorVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    vendorVehicleId: data.vendorVehicleId || "",
  });

  useEffect(() => {
    fetchVendorVehicles();
  }, []);

  const fetchVendorVehicles = async () => {
    try {
      const res = await fetch("/api/pt-pks/vendor/vehicles");
      if (res.ok) {
        const data = await res.json();
        setVehicles(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch vendor vehicles:", res.statusText);
        setVehicles([]);
      }
    } catch (error) {
      console.error("Error fetching vendor vehicles:", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!formData.vendorVehicleId) {
      alert("Vendor dan kendaraan harus dipilih");
      return;
    }

    onUpdate(formData);
    onNext();
  };

  const selectedVehicle = vehicles.find((v) => v.id === formData.vendorVehicleId);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Pilih Vendor Transportir & Kendaraan</h3>
        
        <div className="space-y-2">
          <Label htmlFor="vendorVehicleId">Vendor & Kendaraan *</Label>
          <Select
            value={formData.vendorVehicleId}
            onValueChange={(value) => setFormData({ ...formData, vendorVehicleId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kendaraan" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.vendor.name} - {vehicle.nomorKendaraan} ({vehicle.namaSupir})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVehicle && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-primary">Informasi Vendor</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Kode:</strong> {selectedVehicle.vendor.code}</p>
                  <p><strong>Nama Vendor:</strong> {selectedVehicle.vendor.name}</p>
                  <p><strong>Contact Person:</strong> {selectedVehicle.vendor.contactPerson}</p>
                  <p><strong>Telepon:</strong> {selectedVehicle.vendor.phone}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-primary">Informasi Kendaraan & Supir</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Nomor Kendaraan:</strong> {selectedVehicle.nomorKendaraan}</p>
                  <p><strong>Nama Supir:</strong> {selectedVehicle.namaSupir}</p>
                  {selectedVehicle.noHpSupir && (
                    <p><strong>No. HP Supir:</strong> {selectedVehicle.noHpSupir}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Kembali
        </Button>
        <Button onClick={handleNext}>
          Lanjut ke Timbangan Tarra
        </Button>
      </div>
    </div>
  );
}
