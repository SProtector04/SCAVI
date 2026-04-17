import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, AlertCircle, Info, Clock, CheckCircle } from "lucide-react"
import api from "../api/axios"

interface Alerta {
  id: number
  tipo: string
  prioridad: string
  titulo: string
  descripcion: string
  esta_resuelta: boolean
  creado_en: string
}

const tipoIconMap: Record<string, React.ElementType> = {
  ERROR_INFERENCIA: AlertCircle,
  BAJA_CONFIANZA: AlertTriangle,
  ACCESO_SOSPECHOSO: AlertTriangle,
  FALLA_CAMARA: AlertCircle,
  SISTEMA: Info,
}

const prioridadColorMap: Record<string, string> = {
  BAJA: "bg-blue-100 text-blue-700",
  MEDIA: "bg-yellow-100 text-yellow-700",
  ALTA: "bg-orange-100 text-orange-700",
  CRITICA: "bg-red-100 text-red-700",
}

function AlertsPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const response = await api.get("/alertas/")
        const data = response.data
        const alertasArray = Array.isArray(data) ? data : (data.results || [])
        setAlertas(alertasArray)
      } catch (err) {
        console.error("Error fetching alertas:", err)
        setError("No se pudieron cargar las alertas")
      } finally {
        setLoading(false)
      }
    }
    fetchAlertas()
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alertas del Sistema</h1>
        <p className="text-muted-foreground">Monitorea las alertas y notificaciones del sistema</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Alertas Activas</CardTitle>
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
              {alertas.map((alerta) => {
                const Icon = tipoIconMap[alerta.tipo] || Info
                const prioridadClass = prioridadColorMap[alerta.prioridad] || "bg-gray-100 text-gray-700"

                return (
                  <div
                    key={alerta.id}
                    className="flex gap-4 rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground">{alerta.titulo}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${prioridadClass}`}>
                            {alerta.prioridad}
                          </span>
                          {alerta.esta_resuelta && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{alerta.descripcion}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatFecha(alerta.creado_en)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {alertas.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No hay alertas en el sistema
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AlertsPage