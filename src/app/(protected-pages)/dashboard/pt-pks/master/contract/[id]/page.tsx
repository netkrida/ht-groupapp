import { ContractDetail } from "@/components/dashboard/pt-pks/buyer/contract-detail";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { notFound } from "next/navigation";
import { db } from "@/server/db";

async function getContract(id: string) {
  try {
    return await db.contract.findUnique({
      where: { id },
      include: {
        buyer: true,
        company: true,
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching contract:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);

  return {
    title: contract
      ? `Kontrak ${contract.contractNumber} | PT PKS`
      : "Kontrak Tidak Ditemukan",
    description: contract
      ? `Detail kontrak ${contract.contractNumber} dengan ${contract.buyer.name}`
      : "Kontrak tidak ditemukan",
  };
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);

  if (!contract) {
    notFound();
  }

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
              <BreadcrumbLink href="/dashboard/pt-pks/master/buyer">
                Buyer
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/pt-pks/master/buyer/${contract.buyer.id}`}>
                {contract.buyer.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/pt-pks/master/buyer/${contract.buyer.id}/contracts`}>
                Kontrak
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{contract.contractNumber}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-2">
          <h1 className="text-3xl font-bold">Detail Kontrak</h1>
          <p className="text-muted-foreground">
            Informasi lengkap kontrak pembelian
          </p>
        </div>
      </div>

      <ContractDetail contract={contract} />
    </div>
  );
}
