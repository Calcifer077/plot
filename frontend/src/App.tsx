// import { useEffect } from "react";

// const backendUrl = import.meta.env.VITE_BACKEND_URL;

function App() {
  // useEffect(() => {
  //   async function fetchHealth() {
  //     try {
  //       const response = await fetch(`${backendUrl}/health`);
  //       const data = await response.json();
  //       console.log("Health check response:", data);
  //     } catch (error) {
  //       console.error("Failed to fetch health status:", error);
  //     }
  //   }

  //   fetchHealth();
  // }, []);

  return <div className="text-red-900">Hello, Vite!</div>;
}

export default App;
