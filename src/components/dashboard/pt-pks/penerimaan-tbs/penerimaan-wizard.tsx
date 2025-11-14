"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenerimaanStep1 } from "./penerimaan-step1";
import { PenerimaanStep2 } from "./penerimaan-step2";
import { PenerimaanStep3 } from "./penerimaan-step3";
import { PenerimaanStep4 } from "./penerimaan-step4";

export type PenerimaanFormData = {
  // Step 1
  tanggalTerima: Date;
  materialId: string;
  operatorPenimbang: string;
  supplierId: string;
  transporterType: "existing" | "new";
  transporterId?: string;
  nomorKendaraan?: string;
  namaSupir?: string;
  
  // Step 2
  metodeBruto: "MANUAL" | "SISTEM_TIMBANGAN";
  beratBruto: number;
  waktuTimbangBruto: Date;
  
  // Step 3
  metodeTarra: "MANUAL" | "SISTEM_TIMBANGAN";
  beratTarra: number;
  waktuTimbangTarra: Date;
  potonganPersen: number;
  
  // Step 4
  hargaPerKg: number;
  
  // Calculated fields
  beratNetto1?: number;
  potonganKg?: number;
  beratNetto2?: number;
  totalBayar?: number;
};

export function PenerimaanTBSWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PenerimaanFormData>>({
    tanggalTerima: new Date(),
    metodeBruto: "MANUAL",
    metodeTarra: "MANUAL",
    potonganPersen: 0,
    beratBruto: 0,
    beratTarra: 0,
    hargaPerKg: 0,
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = (data: Partial<PenerimaanFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        status: "COMPLETED",
      };

      const res = await fetch("/api/pt-pks/penerimaan-tbs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        alert("Data penerimaan TBS berhasil disimpan!");
        // Reset form
        setFormData({
          tanggalTerima: new Date(),
          metodeBruto: "MANUAL",
          metodeTarra: "MANUAL",
          potonganPersen: 0,
          beratBruto: 0,
          beratTarra: 0,
          hargaPerKg: 0,
        });
        setCurrentStep(1);
      } else {
        const data = await res.json();
        alert(`Gagal menyimpan: ${data.error}`);
      }
    } catch (error) {
      console.error("Error submitting penerimaan:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Informasi Pengirim" },
    { number: 2, title: "Timbangan Bruto" },
    { number: 3, title: "Timbangan Tarra" },
    { number: 4, title: "Harga & Konfirmasi" },
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
          <CardTitle>Penerimaan TBS - {steps[currentStep - 1]?.title}</CardTitle>
          <CardDescription>
            Step {currentStep} dari {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <PenerimaanStep1
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <PenerimaanStep2
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <PenerimaanStep3
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <PenerimaanStep4
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
