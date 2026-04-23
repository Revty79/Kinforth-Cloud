import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/**/*.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://kinforthcloud_app:Darkness1@10.0.0.218:5432/kinforthcloud",
  },

  strict: true,
  verbose: true,
});

