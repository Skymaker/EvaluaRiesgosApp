
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { initializeAppData } from "./app/utils/bootstrap.ts";
  import "./styles/index.css";

  const mountApp = () => {
    createRoot(document.getElementById("root")!).render(<App />);
  };

  initializeAppData()
    .then(mountApp)
    .catch((error) => {
      console.error("Error inicializando datos de la aplicación:", error);
      mountApp();
    });
  