import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Llamada al endpoint de login
      const response = await api.post("/auth/login/", {
        username,
        password,
      });

      // El backend devuelve los tokens en cookies httpOnly, no en el body
      // Si la respuesta es 200, el login fue exitoso
      if (response.status === 200 && response.data.user) {
        // Guardar info del usuario en localStorage
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        // Forzar reload para que App.tsx detecte el nuevo user y actualice isAuthenticated
        window.location.href = "/dashboard";
        return;
      }
      
      // Si por alguna razón no hay user, mostrar error
      setError("Error al iniciar sesión");
    } catch (err: unknown) {
      // Manejo de errores
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err.response as { data?: { error?: string } })?.data?.error
        : "Error de conexión";
      
      setError(errorMessage || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  // TODO: Eliminar en producción - función temporal para testing sin backend
  // const handleSkipLogin = () => {
  //   localStorage.setItem("authToken", "mock-token");
  //   localStorage.setItem("user", JSON.stringify({ username: "test-user" }));
  //   navigate("/dashboard");
  // };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-800">SCAVI</h1>
          <p className="mt-2 text-slate-600">
            Sistema de Control de Acceso Vehicular Institucional
          </p>
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-left text-sm font-bold text-slate-800"
            >
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-left text-sm font-bold text-slate-800"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-800 py-3 font-bold text-white shadow-lg transition hover:bg-green-700 disabled:bg-slate-400"
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>

{/* Botón temporal para testing - DESHABILITADO en producción 
          <div className="mt-6 border-t pt-4">
            <button
              type="button"
              onClick={handleSkipLogin}
              className="w-full rounded-xl border border-slate-300 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
            >
              Acceso rápido (sin credenciales)
            </button>
          </div>
          */}
      </div>
    </div>
  );
};

export default LoginPage;