import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, AlertCircle, Info, Clock } from "lucide-react"
import api from "../api/axios"

interface Alerta {
  id: number
  tipo: "warning" | "error" | "info"
  titulo: string
  descripcion: string
  fecha: string
}

const mockAlertas: Alerta[] = [
  {
    id: 1,
    tipo: "warning",
    titulo: "Acceso denegado múltiple",
    descripcion: "El vehículo con placa MNO-987 ha intentado ingresar 3 veces sin autorización.",
    fecha: "18/03/2026 09:45",
  },
  {
    id: 2,
    tipo: "error",
    titulo: "Cámara fuera de línea",
    descripcion: "La cámara del Estacionamiento C no responde. Verificar conexión de red.",
    fecha: "18/03/2026 09:30",
  },
  {
    id: 3,
    tipo: "warning",
    titulo: "Vehículo no registrado",
    descripcion: "Vehículo desconocido detectado en zona de carga. Placa: QRS-555.",
    fecha: "18/03/2026 09:15",
  },
  {
    id: 4,
    tipo: "info",
    titulo: "Mantenimiento programado",
    descripcion: "Mantenimiento de barrera Entrada Principal programado para mañana 06:00.",
    fecha: "18/03/2026 08:00",
  },
  {
    id: 5,
    tipo: "warning",
    titulo: "Alta afluencia detectada",
    descripcion: "Tiempo de espera superior a 5 minutos en Entrada Principal.",
    fecha: "18/03/2026 07:45",
  },
]

function AlertsPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const response = await api.get("/alertas/")
        const data = response.data
        const alertasArray = Array.isArray(data) ? data : (data.results || [])
        setAlertas(alertasArray)
      } catch {
        setAlertas(mockAlertas)
      } finally {
        setLoading(false)
      }
    }
    fetchAlertas()
  }, [])

  const iconMap = {
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
  }

  const colorMap = {
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alertas del Sistema</h1>
        <p className="text-muted-foreground">Monitorea las alertas y notificaciones del sistema</p>
      </div>

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
                const Icon = iconMap[alerta.tipo]
                const colorClass = colorMap[alerta.tipo]

                return (
                  <div
                    key={alerta.id}
                    className="flex gap-4 rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground">{alerta.titulo}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{alerta.fecha}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{alerta.descripcion}</p>
                    </div>
                  </div>
                )
              })}
              {alertas.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No hay alertas activas en el sistema
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