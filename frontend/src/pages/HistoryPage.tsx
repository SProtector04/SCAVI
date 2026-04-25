import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Camera, Clock, CheckCircle, XCircle, HelpCircle } from "lucide-react"
import api from "../api/axios"

interface AccessLog {
  id: number
  vehiculo_placa: string
  placa_detectada_ia: string
  camara_nombre: string
  fecha_hora: string
  estado_acceso: string
}

const statusIconMap: Record<string, React.ElementType> = {
  AUTORIZADO: CheckCircle,
  DENEGADO: XCircle,
  DESCONOCIDO: HelpCircle,
}

const statusColorMap: Record<string, string> = {
  AUTORIZADO: "bg-green-100 text-green-700",
  DENEGADO: "bg-red-100 text-red-700",
  DESCONOCIDO: "bg-yellow-100 text-yellow-700",
}

function HistoryPage() {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get("/registros-accesos/")
        const data = response.data
        const logsArray = Array.isArray(data) ? data : (data.results || [])
        setLogs(logsArray)
      } catch (err) {
        console.error("Error al obtener los registros:", err)
        setError("No se pudieron cargar los registros de acceso.")
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Historial de Accesos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-muted"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const Icon = statusIconMap[log.estado_acceso] || HelpCircle
                const statusClass = statusColorMap[log.estado_acceso] || "bg-gray-100 text-gray-700"

                return (
                  <div
                    key={log.id}
                    className="flex gap-4 rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground">{log.vehiculo_placa || log.placa_detectada_ia || "Sin placa"}</h3>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass}`}>
                          {log.estado_acceso}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          <span>{log.camara_nombre || "Sin cámara"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatFecha(log.fecha_hora)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {logs.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No hay registros de acceso en el sistema.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default HistoryPage