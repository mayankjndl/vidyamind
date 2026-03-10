import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy all /api/ai/* requests to the Python FastAPI backend.
  // This means the frontend fetch calls (e.g. fetch("/api/ai/tutor"))
  // remain unchanged — Next.js transparently forwards them.
  async rewrites() {
    return [
      {
        source: "/api/ai/:path*",
        destination: "http://localhost:8000/api/ai/:path*",
      },
    ];
  },
};

export default nextConfig;
