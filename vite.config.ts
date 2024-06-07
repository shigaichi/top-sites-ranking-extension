import { defineConfig } from "vite";
import { crx, defineManifest } from "@crxjs/vite-plugin";

const manifest = defineManifest({
  manifest_version: 3,
  name: "Web site access ranking checker",
  description: "__MSG_extensionDescription__",
  version: "0.0.2",
  default_locale: "en",
  permissions: ["activeTab"],
  icons: {
    "16": "images/icon16.png",
    "32": "images/icon32.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png",
  },
  action: {
    default_popup: "src/popup.html",
    default_icon: {
      "16": "images/icon16.png",
      "32": "images/icon32.png",
      "48": "images/icon48.png",
      "128": "images/icon128.png",
    },
  },
});

export default defineConfig({
  plugins: [crx({ manifest })],
});
