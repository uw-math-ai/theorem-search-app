import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@aws-sdk/client-secrets-manager'],
};

export default nextConfig;
