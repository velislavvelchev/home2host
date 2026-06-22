import config from "@payload-config";
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { Geist } from "next/font/google";
import type { ServerFunctionClient } from "payload";
import React from "react";

import { importMap } from "./admin/importMap.js";
import "./custom.scss";

// Load Geist Sans here (the admin route group owns its own <html>, so
// it doesn't inherit the frontend layout's font setup). Setting it as a
// CSS variable lets custom.scss pick it up via --font-geist-sans and
// route it into Payload's existing --font-body — no admin component
// needs to know about the swap.
const geistSans = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
  display: "swap",
});

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = ({ children }: Args) => (
  <RootLayout
    config={config}
    htmlProps={{ className: geistSans.variable }}
    importMap={importMap}
    serverFunction={serverFunction}
  >
    {children}
  </RootLayout>
);

export default Layout;
