import { defineConfig } from "vite";
import { keycloakify } from "keycloakify/vite-plugin";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    },
    plugins: [
        react(),
        tailwindcss(),
        keycloakify({
            accountThemeImplementation: "none"
        })
    ]
});
