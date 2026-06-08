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
    {
      slug: "blog-posts",
      labels: { singular: "Blog post", plural: "Blog posts" },
      admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "publishedAt", "_status"],
      },
      access: { read: () => true },
      versions: { drafts: true },
      fields: [
        { name: "title", type: "text", localized: true, required: true },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          index: true,
          admin: {
            description:
              "URL-safe identifier, shared across locales (e.g. 'welcome-to-bansko').",
          },
        },
        { name: "excerpt", type: "textarea", localized: true },
        { name: "featuredImage", type: "upload", relationTo: "media" },
        { name: "body", type: "richText", localized: true, required: true },
        { name: "author", type: "text" },
        {
          name: "tags",
          type: "array",
          localized: true,
          fields: [{ name: "label", type: "text", required: true }],
        },
        {
          name: "publishedAt",
          type: "date",
          required: true,
          admin: { date: { pickerAppearance: "dayOnly" } },
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
