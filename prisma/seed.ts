import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create Companies first
  console.log("🏢 Creating companies...");
  const ptPks = await prisma.company.upsert({
    where: { code: "PT-PKS" },
    update: {},
    create: {
      code: "PT-PKS",
      name: "PT Perkebunan Kelapa Sawit",
    },
  });

  const ptHtk = await prisma.company.upsert({
    where: { code: "PT-HTK" },
    update: {},
    create: {
      code: "PT-HTK",
      name: "PT Husni Thamrin",
    },
  });

  const ptNilo = await prisma.company.upsert({
    where: { code: "PT-NILO" },
    update: {},
    create: {
      code: "PT-NILO",
      name: "PT Nilo Eng",
    },
  });

  const ptZta = await prisma.company.upsert({
    where: { code: "PT-ZTA" },
    update: {},
    create: {
      code: "PT-ZTA",
      name: "PT Zakiyyah ",
    },
  });

  console.log("✅ Companies created:", { ptPks, ptHtk, ptNilo, ptZta });

  // Create Roles for PT-PKS
  console.log("📝 Creating roles for PT-PKS...");
  const ptPksAdminRole = await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Admin",
        companyId: ptPks.id,
      },
    },
    update: {},
    create: {
      name: "Admin",
      description: "Full access to all features",
      companyId: ptPks.id,
      permissions: {
        canManageUsers: true,
        canManageCompanies: true,
        canViewReports: true,
        canCreateReports: true,
        canExportData: true,
      },
    },
  });

  const ptPksManagerRole = await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Manager",
        companyId: ptPks.id,
      },
    },
    update: {},
    create: {
      name: "Manager",
      description: "Can manage users and view reports",
      companyId: ptPks.id,
      permissions: {
        canManageUsers: false,
        canManageCompanies: false,
        canViewReports: true,
        canCreateReports: true,
        canExportData: true,
      },
    },
  });

  const ptPksUserRole = await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "User",
        companyId: ptPks.id,
      },
    },
    update: {},
    create: {
      name: "User",
      description: "Basic user access",
      companyId: ptPks.id,
      permissions: {
        canManageUsers: false,
        canManageCompanies: false,
        canViewReports: true,
        canCreateReports: false,
        canExportData: false,
      },
    },
  });

  console.log("✅ Roles created for PT-PKS:", {
    ptPksAdminRole,
    ptPksManagerRole,
    ptPksUserRole,
  });

  // Create Roles for other companies
  console.log("📝 Creating roles for other companies...");
  
  // PT-HTK Roles
  await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Admin",
        companyId: ptHtk.id,
      },
    },
    update: {},
    create: {
      name: "Admin",
      description: "Full access to all features",
      companyId: ptHtk.id,
      permissions: {
        canManageUsers: true,
        canManageCompanies: true,
        canViewReports: true,
        canCreateReports: true,
        canExportData: true,
      },
    },
  });

  await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Manager",
        companyId: ptHtk.id,
      },
    },
    update: {},
    create: {
      name: "Manager",
      description: "Can manage users and view reports",
      companyId: ptHtk.id,
      permissions: {
        canManageUsers: false,
        canManageCompanies: false,
        canViewReports: true,
        canCreateReports: true,
        canExportData: true,
      },
    },
  });

  await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "User",
        companyId: ptHtk.id,
      },
    },
    update: {},
    create: {
      name: "User",
      description: "Basic user access",
      companyId: ptHtk.id,
      permissions: {
        canManageUsers: false,
        canManageCompanies: false,
        canViewReports: true,
        canCreateReports: false,
        canExportData: false,
      },
    },
  });

  // PT-NILO Roles
  await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Admin",
        companyId: ptNilo.id,
      },
    },
    update: {},
    create: {
      name: "Admin",
      description: "Full access to all features",
      companyId: ptNilo.id,
      permissions: {
        canManageUsers: true,
        canManageCompanies: true,
        canViewReports: true,
        canCreateReports: true,
        canExportData: true,
      },
    },
  });

  await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Manager",
        companyId: ptNilo.id,
      },
    },
    update: {},
    create: {
      name: "Manager",
      description: "Can manage users and view reports",
      companyId: ptNilo.id,
      permissions: {
        canManageUsers: false,
        canManageCompanies: false,
        canViewReports: true,
        canCreateReports: true,
        canExportData: true,
      },
    },
  });

  await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "User",
        companyId: ptNilo.id,
      },
    },
    update: {},
    create: {
      name: "User",
      description: "Basic user access",
      companyId: ptNilo.id,
      permissions: {
        canManageUsers: false,
        canManageCompanies: false,
        canViewReports: true,
        canCreateReports: false,
        canExportData: false,
      },
    },
  });

  // PT-ZTA Roles
  await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Admin",
        companyId: ptZta.id,
      },
    },
    update: {},
    create: {
      name: "Admin",
      description: "Full access to all features",
      companyId: ptZta.id,
      permissions: {
        canManageUsers: true,
        canManageCompanies: true,
        canViewReports: true,
        canCreateReports: true,
        canExportData: true,
      },
    },
  });

  await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Manager",
        companyId: ptZta.id,
      },
    },
    update: {},
    create: {
      name: "Manager",
      description: "Can manage users and view reports",
      companyId: ptZta.id,
      permissions: {
        canManageUsers: false,
        canManageCompanies: false,
        canViewReports: true,
        canCreateReports: true,
        canExportData: true,
      },
    },
  });

  await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "User",
        companyId: ptZta.id,
      },
    },
    update: {},
    create: {
      name: "User",
      description: "Basic user access",
      companyId: ptZta.id,
      permissions: {
        canManageUsers: false,
        canManageCompanies: false,
        canViewReports: true,
        canCreateReports: false,
        canExportData: false,
      },
    },
  });

  console.log("✅ Roles created for all companies");

  // Hash password for all users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Admin User for PT-PKS
  console.log("👤 Creating admin user for PT-PKS...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pt-pks.com" },
    update: {},
    create: {
      email: "admin@pt-pks.com",
      name: "Admin PT PKS",
      password: hashedPassword,
      emailVerified: new Date(),
      companyId: ptPks.id,
      roleId: ptPksAdminRole.id,
    },
  });

  console.log("✅ Admin user created:", adminUser);

  // Create Manager User for PT-PKS
  console.log("👤 Creating manager user for PT-PKS...");
  const managerUser = await prisma.user.upsert({
    where: { email: "manager@pt-pks.com" },
    update: {},
    create: {
      email: "manager@pt-pks.com",
      name: "Manager PT PKS",
      password: hashedPassword,
      emailVerified: new Date(),
      companyId: ptPks.id,
      roleId: ptPksManagerRole.id,
    },
  });

  console.log("✅ Manager user created:", managerUser);

  // Create Regular User for PT-PKS
  console.log("👤 Creating regular user for PT-PKS...");
  const regularUser = await prisma.user.upsert({
    where: { email: "user@pt-pks.com" },
    update: {},
    create: {
      email: "user@pt-pks.com",
      name: "User PT PKS",
      password: hashedPassword,
      emailVerified: new Date(),
      companyId: ptPks.id,
      roleId: ptPksUserRole.id,
    },
  });

  console.log("✅ Regular user created:", regularUser);

  console.log("🎉 Seed completed successfully!");
  console.log("📝 All users password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
