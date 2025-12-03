"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PengirimanStep1 } from "./pengiriman-step1";
import { PengirimanStep2 } from "./pengiriman-step2";
import { PengirimanStep3 } from "./pengiriman-step3";
import { PengirimanStep4 } from "./pengiriman-step4";
import { PengirimanStep5 } from "./pengiriman-step5";
import { useRouter } from "next/navigation";

export type PengirimanFormData = {
  // Step 1
  tanggalPengiriman: Date;
  operatorPenimbang: string;
  buyerId: string;
  contractId: string;
  contractItemId: string;
  
  // Step 2
  vendorVehicleId: string;
  
  // Step 3
  metodeTarra: "MANUAL" | "SISTEM_TIMBANGAN";
  beratTarra: number;
  waktuTimbangTarra: Date;
  
  // Step 4
  metodeGross: "MANUAL" | "SISTEM_TIMBANGAN";
  beratGross: number;
  waktuTimbangGross: Date;
  
  // Step 5
  ffa: number;
  air: number;
  kotoran: number;
  
  // Calculated fields
  beratNetto?: number;
};

export function PengirimanProductWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PengirimanFormData>>({
    tanggalPengiriman: new Date(),
    metodeTarra: "MANUAL",
    metodeGross: "MANUAL",
    beratTarra: 0,
    beratGross: 0,
    ffa: 0,
    air: 0,
    kotoran: 0,
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = (data: Partial<PengirimanFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (finalData?: Partial<PengirimanFormData>) => {
    setLoading(true);

    try {
      // Merge final data dari step terakhir
      const mergedData = { ...formData, ...finalData };
      
      // Hitung berat netto
      const beratNetto = (mergedData.beratGross || 0) - (mergedData.beratTarra || 0);
      
      const submitData = {
        ...mergedData,
        beratNetto,
        status: "COMPLETED",
      };

      console.log("Submitting data:", submitData);

      const res = await fetch("/api/pt-pks/pengiriman-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Pengiriman product berhasil disimpan!\nNomor Pengiriman: ${data.nomorPengiriman}\nNo Segel: ${data.noSegel}`);
        
        // Reset form
        setFormData({
          tanggalPengiriman: new Date(),
          metodeTarra: "MANUAL",
          metodeGross: "MANUAL",
          beratTarra: 0,
          beratGross: 0,
          ffa: 0,
          air: 0,
          kotoran: 0,
        });
        setCurrentStep(1);
        
        // Redirect to list page or show success
        router.push("/dashboard/pt-pks/pemasaran/pengiriman-product");
      } else {
        const data = await res.json();
        alert(`Gagal menyimpan: ${data.error}`);
      }
    } catch (error) {
      console.error("Error submitting pengiriman:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Informasi Penerima" },
    { number: 2, title: "Vendor Transportir" },
    { number: 3, title: "Timbangan Tarra" },
    { number: 4, title: "Timbangan Gross" },
    { number: 5, title: "Mutu Kernel" },
  ];

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.number}
              </div>
              <div className="text-xs mt-1 text-center">{step.title}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 ${
                  currentStep > step.number ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>Pengiriman Product - {steps[currentStep - 1]?.title}</CardTitle>
          <CardDescription>
            Step {currentStep} dari {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <PengirimanStep1
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <PengirimanStep2
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <PengirimanStep3
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <PengirimanStep4
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 5 && (
            <PengirimanStep5
              data={formData}
              onUpdate={updateFormData}
              onSubmit={handleSubmit}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
