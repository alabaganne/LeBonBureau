/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build autonome pour l'image Docker (voir DEPLOY.md).
  output: "standalone",
  images: {
    // Product photography is served from the Pexels CDN in this prototype.
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com" }],
  },
  async redirects() {
    // L'administration est celle de Medusa.
    const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    return [{ source: "/admin", destination: `${backend}/app`, permanent: false }];
  },
};

export default nextConfig;
