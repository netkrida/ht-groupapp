import { VendorTable } from "@/components/dashboard/pt-pks/vendor/vendor-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = {
  title: "Daftar Vendor | PT PKS",
  description: "Manajemen data vendor transportir untuk PT PKS",
};

export default async function VendorPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/pt-pks">PT PKS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Vendor</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold mt-2">Daftar Vendor Transportir</h1>
        <p className="text-muted-foreground">
          Manajemen data vendor, kendaraan, dan supir
        </p>
      </div>

      <VendorTable />
    </div>
  );
}
