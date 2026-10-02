import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["pdfkit", "nodemailer", "@prisma/client", "@prisma/adapter-pg"]
};

export default nextConfig;
