import { useEffect, useState } from "react";
import Layout from "@/components/layout";
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
        const response = await api.get("/access_logs/");
        setLogs(response.data);
      } catch (err) {
        console.error("Error al obtener los registros:", err);
        setError("No se pudieron cargar los registros de acceso. Verifica la conexión con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <p className="text-slate-600">
            Monitoreo en tiempo real de los vehículos que han ingresado o intentado ingresar al recinto.
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
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Cámara / Ubicación</th>
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
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${log.estado_acceso === 'AUTORIZADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
    </Layout>
  );
};

export default HistoryPage;
