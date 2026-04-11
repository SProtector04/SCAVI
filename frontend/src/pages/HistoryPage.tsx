import { useEffect, useState } from "react";
import api from "../api/axios";

interface AccessLog {
  id: number;
  vehiculo: string;
  camara: string;
  fecha_hora: string;
  estado_acceso: string;
}

const HistoryPage = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get("/registros-accesos/");
        // El ViewSet de DRF devuelve { results: [...] } con paginación, o [] si no hay paginación
        const data = response.data;
        const logsArray = Array.isArray(data) ? data : (data.results || []);
        setLogs(logsArray);
      } catch (err) {
        console.error("Error al obtener los registros:", err);
        setError("No se pudieron cargar los registros de acceso.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Función auxiliar para asignar estilos basados en el estado del acceso
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AUTORIZADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DENEGADO':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DESCONOCIDO':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Historial de Accesos</h1>
        <p className="mt-2 text-slate-600">
          Monitoreo en tiempo real de los vehículos (Autorizados, Denegados o Desconocidos).
        </p>
      </div>

      {loading && <p className="animate-pulse text-green-800 font-semibold">Cargando registros...</p>}
      {error && <p className="text-red-600 font-semibold bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="min-w-full border-collapse bg-white text-left text-sm text-slate-800">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th className="px-6 py-4 font-bold border-b border-slate-200">Placa Vehículo</th>
                <th className="px-6 py-4 font-bold border-b border-slate-200">C��mara / Ubicación</th>
                <th className="px-6 py-4 font-bold border-b border-slate-200">Fecha y Hora</th>
                <th className="px-6 py-4 font-bold border-b border-slate-200">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{log.vehiculo}</td>
                  <td className="px-6 py-4">{log.camara}</td>
                  <td className="px-6 py-4">{new Date(log.fecha_hora).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadge(log.estado_acceso)}`}>
                      {log.estado_acceso}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Aún no hay registros de acceso en el sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
