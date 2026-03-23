// src/App.tsx
import Landing from "./pages/Landing";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f7f7f7]">
      <main className="flex-grow">
        <Landing />
      </main>
      <Footer />
    </div>
  );
}

export default App;
