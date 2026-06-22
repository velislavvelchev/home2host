"use client";

// Drop-in replacement for @payloadcms/plugin-seo's built-in
// PreviewComponent. The stock version only renders URL + title +
// description (matches Google's basic SERP). Owner wanted to see the
// Meta Image they uploaded reflected in the preview, since modern
// SERPs and social-share cards both surface a thumbnail.
//
// Wired in via the plugin's `fields` override in payload.config.ts —
// we keep the same client-side props the plugin already passes
// (descriptionPath, hasGenerateURLFn, titlePath) and add image
// rendering on top.
//
// The image lives on `meta.image` as an upload-relation ID. We fetch
// the Media doc by ID against the Payload API to resolve a renderable
// URL — same pattern Payload uses elsewhere when an admin component
// needs a populated upload relation it only has an ID for.

import {
  useAllFormFields,
  useConfig,
  useDocumentInfo,
  useDocumentTitle,
  useForm,
  useLocale,
} from "@payloadcms/ui";
import { reduceToSerializableFields } from "@payloadcms/ui/shared";
import { formatAdminURL } from "payload/shared";
import { useEffect, useState } from "react";

type ClientProps = {
  descriptionPath?: string;
  hasGenerateURLFn?: boolean;
  titlePath?: string;
};

export function SeoPreviewWithImage(props: ClientProps) {
  const {
    descriptionPath = "meta.description",
    hasGenerateURLFn,
    titlePath = "meta.title",
  } = props;

  const {
    config: {
      routes: { api },
    },
  } = useConfig();
  const locale = useLocale();
  const [fields] = useAllFormFields();
  const { getData } = useForm();
  const docInfo = useDocumentInfo();
  const { title } = useDocumentTitle();

  const metaTitle = (fields[titlePath]?.value as string | undefined) ?? "";
  const metaDescription =
    (fields[descriptionPath]?.value as string | undefined) ?? "";
  const metaImageId = fields["meta.image"]?.value as
    | number
    | string
    | null
    | undefined;

  const [href, setHref] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  // Resolve the absolute URL via the plugin's own endpoint. Mirrors
  // the original PreviewComponent exactly so behavior is unchanged for
  // collections + globals that have a generateURL configured.
  useEffect(() => {
    if (!hasGenerateURLFn || href) return;
    const endpoint = formatAdminURL({
      apiRoute: api,
      path: "/plugin-seo/generate-url",
    });
    const localeCode = typeof locale === "object" ? locale?.code : locale;
    void fetch(endpoint, {
      body: JSON.stringify({
        id: docInfo.id,
        collectionSlug: docInfo.collectionSlug,
        doc: getData(),
        docPermissions: docInfo.docPermissions,
        globalSlug: docInfo.globalSlug,
        hasPublishPermission: docInfo.hasPublishPermission,
        hasSavePermission: docInfo.hasSavePermission,
        initialData: docInfo.initialData,
        initialState: reduceToSerializableFields(docInfo.initialState ?? {}),
        locale: localeCode,
        title,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
      .then((r) => r.json())
      .then((body: { result?: string }) => setHref(body.result))
      .catch(() => {
        // Silent — preview without a URL still shows title + desc.
      });
  }, [fields, href, locale, docInfo, hasGenerateURLFn, getData, api, title]);

  // Resolve the meta image URL by fetching the Media doc by ID. The
  // form state only carries the ID, not a populated relation; the
  // doc's `url` is what we render. Re-runs when the upload changes.
  useEffect(() => {
    if (metaImageId === null || metaImageId === undefined || metaImageId === "") {
      setImageUrl(undefined);
      return;
    }
    void fetch(`${api}/media/${metaImageId}?depth=0`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((doc: { url?: string }) => setImageUrl(doc?.url))
      .catch(() => setImageUrl(undefined));
  }, [metaImageId, api]);

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Inlined labels: the plugin-seo namespace registers
          translation keys at runtime, but TypeScript only sees
          Payload's base i18n type at compile time. Hardcoding the
          English admin chrome avoids a `t` cast for two static
          labels that don't change per content type. */}
      <div>Preview</div>
      <div style={{ color: "#9A9A9A", marginBottom: "5px" }}>
        Exact result listings may vary based on content and search relevancy.
      </div>
      <div
        style={{
          background: "var(--theme-elevation-50)",
          borderRadius: "5px",
          boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
          maxWidth: "600px",
          padding: "20px",
          pointerEvents: "none",
          width: "100%",
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div>
            <a href={href} style={{ textDecoration: "none" }}>
              {href || "https://..."}
            </a>
          </div>
          <h4 style={{ margin: 0 }}>
            <a href="/" style={{ textDecoration: "none" }}>
              {metaTitle}
            </a>
          </h4>
          <p style={{ margin: 0 }}>{metaDescription}</p>
        </div>
        {imageUrl ? (
          <div
            style={{
              flexShrink: 0,
              width: 96,
              height: 96,
              borderRadius: 6,
              overflow: "hidden",
              background: "var(--theme-elevation-100)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
