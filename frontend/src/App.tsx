// src/App.tsx
import Footer from "./components/Footer";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f7f7f7]">
      <main className="flex-grow">
        <DashboardPage />
      </main>
      <Footer />
    </div>
  );
}

export default App;
