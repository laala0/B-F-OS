import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // This project lives in a subfolder alongside unrelated files (lead tracker,
  // quote workbooks) that also have a package-lock.json. Pin the tracing root
  // here so Next.js doesn't try to guess the monorepo root.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
