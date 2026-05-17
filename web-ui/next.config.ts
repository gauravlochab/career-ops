import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      // Old pages → new merged pages
      { source: "/dashboard/pipeline",     destination: "/dashboard/find?tab=pipeline",   permanent: false },
      { source: "/dashboard/scanner",      destination: "/dashboard/find?tab=scan",       permanent: false },
      { source: "/dashboard/evaluate",     destination: "/dashboard/find?tab=evaluate",   permanent: false },
      { source: "/dashboard/batch",        destination: "/dashboard/find?tab=batch",      permanent: false },
      { source: "/dashboard/analytics",    destination: "/dashboard/intel?tab=analytics", permanent: false },
      { source: "/dashboard/insights",     destination: "/dashboard/intel?tab=insights",  permanent: false },
      { source: "/dashboard/interview",    destination: "/dashboard/prep?tab=practice",   permanent: false },
      { source: "/dashboard/recruiter-find", destination: "/dashboard/prep?tab=recruiter", permanent: false },
      { source: "/dashboard/followups",    destination: "/dashboard/tracker?tab=followups", permanent: false },
      { source: "/dashboard/compare",      destination: "/dashboard/tracker?tab=compare", permanent: false },
    ]
  },
};

export default nextConfig;
