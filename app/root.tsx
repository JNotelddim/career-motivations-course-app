import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { AuthProvider } from "./components/providers/authProvider";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  console.log({ ENV_DEV: import.meta.env.DEV }); 
  // console.log({ ENV_VITE_DEV_IDENTITY: process.env.VITE_DEV_IDENTITY });

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script src="/sdk/v1/sites.js"></script>
        {import.meta.env.DEV && (
          <script dangerouslySetInnerHTML={{ __html: `
            console.log("__DEV_MOCK_SITES_SDK__");
            console.log("Running in development mode -- Mocking 'window.sites()' SDK for testing identity.");

            if (!window) {
              console.warn("window is not defined. The mock implementation will not be applied.");
              return;
            }

            if (window.sites) {
              console.warn("window.sites already exists. The mock implementation will not be applied.");
              return;
            }

            window.sites = function() {
              return {
                user: function() {

                  // 3 core sdk identity scenatios: [ "authenticated", "guest", "sdk-unavailable" ]

                  if (import.meta.env.VITE_DEV_IDENTITY === "guest") {
                    console.log("Mocking unauthenticated user.");
                    return Promise.resolve(null);
                  } else if (import.meta.env.VITE_DEV_IDENTITY === "sdk-unavailable") {
                    console.log("Mocking SDK unavailable.");
                    return Promise.reject(new Error("Sites SDK is unavailable"));
                  } else if (import.meta.env.VITE_DEV_IDENTITY === "authenticated") {
                    console.log("Mocking authenticated user.");
                    return Promise.resolve({
                      _v: "1",
                      display_name: "Jared Test",
                      email: "jared-test@metalab.com",
                      tenant: "metalab",
                    });
                  } else {
                    // Default to unauthenticated if VITE_DEV_IDENTITY is not set or has an unrecognized value
                    console.warn("VITE_DEV_IDENTITY is not set or has an unrecognized value. Defaulting to unauthenticated state.");
                    return Promise.resolve(null);
                  }
                },
              };
            };
            ` }}></script>
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
