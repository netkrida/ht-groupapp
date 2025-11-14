"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

type SupplierMarker = {
  id: string;
  type: string;
  ownerName: string;
  companyName: string | null;
  address: string;
  personalPhone: string;
  longitude: number;
  latitude: number;
};

type SupplierTypeLabel = {
  [key: string]: string;
};

const supplierTypeLabels: SupplierTypeLabel = {
  RAMP_PERON: "Ramp/Peron",
  KUD: "KUD",
  KELOMPOK_TANI: "Kelompok Tani",
};

export default function SupplierMapClient() {
  const [suppliers, setSuppliers] = useState<SupplierMarker[]>([]);
  const [loading, setLoading] = useState(true);

  // Default center (Indonesia)
  const defaultCenter: LatLngExpression = [-2.5489, 118.0149];
  const defaultZoom = 5;

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pt-pks/supplier?type=map");
      const data = await response.json();
      if (response.ok) {
        setSuppliers(data.suppliers);
      } else {
        console.error("Error fetching suppliers:", data.error);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fix Leaflet icon issue in production
  useEffect(() => {
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  if (loading) {
    return (
      <div className="h-[600px] w-full rounded-md border bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading suppliers...</div>
      </div>
    );
  }

  // Calculate center based on suppliers
  const center: LatLngExpression =
    suppliers.length > 0 && suppliers[0]
      ? [suppliers[0].latitude, suppliers[0].longitude]
      : defaultCenter;

  const zoom = suppliers.length > 0 ? 8 : defaultZoom;

  return (
    <div className="relative h-[600px] w-full rounded-md border overflow-hidden z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {suppliers.map((supplier) => (
          <Marker
            key={supplier.id}
            position={[supplier.latitude, supplier.longitude]}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{supplier.ownerName}</div>
                {supplier.companyName && (
                  <div className="text-sm">{supplier.companyName}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  {supplierTypeLabels[supplier.type] || supplier.type}
                </div>
                <div className="text-xs">{supplier.address}</div>
                <div className="text-xs">{supplier.personalPhone}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
