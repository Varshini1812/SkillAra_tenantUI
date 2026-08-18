import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            if (req.headers.host) {
              proxyReq.setHeader("X-Forwarded-Host", req.headers.host);
              const host = req.headers.host.split(":")[0].toLowerCase();
              if (host.endsWith(".localhost")) {
                const sub = host.slice(0, -".localhost".length);
                if (sub && !sub.includes(".")) {
                  proxyReq.setHeader("X-Tenant-Subdomain", sub);
                }
              }
            }
            const tenant = req.headers["x-tenant-subdomain"];
            if (tenant) proxyReq.setHeader("X-Tenant-Subdomain", tenant);
          });
        },
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
