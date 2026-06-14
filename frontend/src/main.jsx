import React from "react";
import ReactDOM from "react-dom/client";
import {GoogleOAuthProvider} from "@react-oauth/google";

import App from "./App.jsx";
import ToastProvider from "./components/ToastProvider.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
