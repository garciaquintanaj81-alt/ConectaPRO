import { createRoot } from "react-dom/client";
import App from "./App";
import { StoreProvider } from "./store";
import { registerServiceWorker } from "./push";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <App />
  </StoreProvider>
);
