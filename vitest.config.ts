import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
      "@components": fileURLToPath(
        new URL("./src/components", import.meta.url),
      ),
      "@helpers": fileURLToPath(
        new URL("./src/components/helpers", import.meta.url),
      ),
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/admin-editor/postSave.ts",
        "src/lib/admin-editor/linkCard.ts",
        "src/lib/cms/utils.ts",
        "src/lib/cms/sync.ts",
        "src/lib/sortFunctions.ts",
        "src/lib/taxonomyFilter.ts",
        "src/lib/formatDate.ts",
        "src/lib/textConverter.ts",
      ],
    },
  },
});
