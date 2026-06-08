import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  localization: {
    locales: [
      { code: "bg", label: "Български" },
      { code: "en", label: "English" },
    ],
    defaultLocale: "bg",
    fallback: true,
  },
  collections: [
    {
      slug: "users",
      auth: true,
      admin: { useAsTitle: "email" },
      fields: [],
    },
    {
      slug: "media",
      admin: { useAsTitle: "filename" },
      access: { read: () => true },
      upload: {
        mimeTypes: ["image/*"],
        imageSizes: [
          { name: "thumbnail", width: 400, height: 300, position: "centre" },
          { name: "card", width: 768, height: 512, position: "centre" },
          { name: "hero", width: 1600, height: 900, position: "centre" },
        ],
      },
      fields: [
        {
          name: "alt",
          type: "text",
          localized: true,
          required: true,
        },
      ],
    },
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),
  sharp,
});
