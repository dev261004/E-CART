  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import tsconfigPaths from "vite-tsconfig-paths";

  export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
      port: 5173
    },
    build: {
      outDir: "dist"
    }
  });
//  import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tsconfigPaths from "vite-tsconfig-paths";

// export default defineConfig({
//   plugins: [react(), tsconfigPaths()],
//   server: {
//     host: "0.0.0.0",
//     port: 5173,
//     allowedHosts: [
//       ".ngrok-free.dev",
//       "localhost",
//       "127.0.0.1",
//     ],
//     proxy: {
//       "/api": {
//         target: "http://localhost:4000",
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//     hmr: {
//       host: "collaborative-gregorio-unleavened.ngrok-free.dev",
//       protocol: "wss",
//       port: 443,
//     },
//   },
//   build: {
//     outDir: "dist",
//   },
// });
