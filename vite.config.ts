import { defineConfig } from "vite";
import * as visualizer from "rollup-plugin-visualizer";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact(),
		visualizer.visualizer({
			filename: "./dist/bundle-analysis.html",
			open: true,
			template: "treemap",
		}),
	],
	optimizeDeps: {
		exclude: ["lucide-react"],
	},
});
