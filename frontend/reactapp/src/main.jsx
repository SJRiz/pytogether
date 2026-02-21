import './index.css'

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (apiBaseUrl === "https://api.pytogether.org") {
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = "https://cloud.umami.is/script.js";
  script.setAttribute('data-website-id', "8606b76d-95d9-486a-97b1-13a91b5263fd");
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
);