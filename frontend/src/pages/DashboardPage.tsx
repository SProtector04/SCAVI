import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertCircle, AlertTriangle, Car, Clock, Info, Users } from "lucide-react"
import api from "../api/axios"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const PRIMARY_COLOR = "hsl(212, 78%, 27%)"
const SECONDARY_COLOR = "hsl(175, 62%, 36%)"
const ACCENT_COLOR = "hsl(29, 86%, 60%)"

interface DashboardMetrics {
  totalVehiculos: number
  accesosHoy: number
  alertas: number
  alertasNoResueltas: number
  usuarios: number
  deteccionesHoy: number
}

interface Alert {
  id: number
  tipo: string
  prioridad: string
  titulo: string
  descripcion: string
  esta_resuelta: boolean
  creado_en: string
}

interface TypeDistribution {
  name: string
  value: number
  color: string
}

interface HourlyAccess {
  hora: string
  accesos: number
}

const tipoIconMap: Record<string, React.ElementType> = {
  ERROR_INFERENCIA: AlertCircle,
  BAJA_CONFIANZA: AlertTriangle,
  ACCESO_SOSPECHOSO: AlertTriangle,
  FALLA_CAMARA: AlertCircle,
  SISTEMA: Info,
  VEHICULO_NUEVO: Car,
  REINGRESO: Car,
  VEHICULO_NO_REGISTRADO: AlertTriangle,
}

const prioridadColorMap: Record<string, string> = {
  BAJA: "bg-blue-100 text-blue-700",
  MEDIA: "bg-yellow-100 text-yellow-700",
  ALTA: "bg-orange-100 text-orange-700",
  CRITICA: "bg-red-100 text-red-700",
}

function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVehiculos: 0,
    accesosHoy: 0,
    alertas: 0,
    alertasNoResueltas: 0,
    usuarios: 0,
    deteccionesHoy: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [typeDistribution, setTypeDistribution] = useState<TypeDistribution[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyAccess[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [vehiculosRes, registrosRes, alertasRes, usuariosRes, anprStatsRes] = await Promise.all([
          api.get("/vehiculos/"),
          api.get("/registros-accesos/"),
          api.get("/alertas/"),
          api.get("/usuarios/"),
          api.get("/anpr/events/stats/"),
        ])

        const vehiculos = Array.isArray(vehiculosRes.data) ? vehiculosRes.data : (vehiculosRes.data.results || [])
        const registros = Array.isArray(registrosRes.data) ? registrosRes.data : (registrosRes.data.results || [])
        const allAlertas = Array.isArray(alertasRes.data) ? alertasRes.data : (alertasRes.data.results || [])
        const usuarios = Array.isArray(usuariosRes.data) ? usuariosRes.data : (usuariosRes.data.results || [])

        const anprStats = anprStatsRes.data || {}
        const today = new Date().toISOString().split("T")[0]
        const todayStart = new Date().toISOString().split("T")[0] + "T00:00:00"

        const accesosHoy = registros.filter((r: { fecha_hora: string }) =>
          r.fecha_hora && r.fecha_hora >= todayStart
        ).length

        const alertasNoResueltas = allAlertas.filter((a: Alert) => !a.esta_resuelta).length

        const tipoCounts: Record<string, number> = {}
        vehiculos.forEach((v: { tipo: string }) => {
          tipoCounts[v.tipo] = (tipoCounts[v.tipo] || 0) + 1
        })

        setTypeDistribution([
          { name: "Docentes", value: tipoCounts["DOCENTE"] || 0, color: PRIMARY_COLOR },
          { name: "Estudiantes", value: tipoCounts["ESTUDIANTE"] || 0, color: SECONDARY_COLOR },
          { name: "Administrativos", value: tipoCounts["ADMINISTRATIVO"] || 0, color: ACCENT_COLOR },
          { name: "Visitantes", value: tipoCounts["VISITANTE"] || 0, color: "#6B7280" },
        ])

        const sortedAlertas = [...allAlertas]
          .filter((a: Alert) => !a.esta_resuelta)
          .sort((a: Alert, b: Alert) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
          .slice(0, 5)

        setRecentAlerts(sortedAlertas)
        setHourlyData([
          { hora: "06:00", accesos: Math.floor(accesosHoy * 0.1) },
          { hora: "08:00", accesos: Math.floor(accesosHoy * 0.3) },
          { hora: "10:00", accesos: Math.floor(accesosHoy * 0.2) },
          { hora: "12:00", accesos: Math.floor(accesosHoy * 0.25) },
          { hora: "14:00", accesos: Math.floor(accesosHoy * 0.15) },
          { hora: "16:00", accesos: Math.floor(accesosHoy * 0.2) },
          { hora: "18:00", accesos: Math.floor(accesosHoy * 0.35) },
          { hora: "20:00", accesos: Math.floor(accesosHoy * 0.1) },
        ])

        setMetrics({
          totalVehiculos: vehiculos.length,
          accesosHoy,
          alertas: allAlertas.length,
          alertasNoResueltas,
          usuarios: usuarios.length,
          deteccionesHoy: anprStats.detections_today || 0,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Error al cargar los datos del dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const metricCards = [
    {
      label: "Total Vehículos",
      value: metrics.totalVehiculos,
      icon: Car,
      color: "bg-[hsl(212,78%,27%)]/10 text-[hsl(212,78%,27%)]",
    },
    {
      label: "Accesos Hoy",
      value: metrics.accesosHoy,
      icon: Activity,
      color: "bg-[hsl(175,62%,36%)]/20 text-[hsl(175,62%,36%)]",
    },
    {
      label: "Alertas Activas",
      value: metrics.alertasNoResueltas,
      icon: AlertTriangle,
      color: "bg-[hsl(29,86%,60%)]/30 text-[hsl(29,86%,60%)]",
    },
    {
      label: "Usuarios",
      value: metrics.usuarios,
      icon: Users,
      color: "bg-[hsl(212,78%,27%)]/10 text-[hsl(212,78%,27%)]",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${metric.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : metric.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Flujo Vehicular (Hoy)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="hora"
                    tick={{ fill: "hsl(215, 20%, 45%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(214, 14%, 87%)" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(215, 20%, 45%)", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(214, 14%, 87%)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 14%, 87%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accesos"
                    stroke={PRIMARY_COLOR}
                    strokeWidth={3}
                    dot={{ fill: PRIMARY_COLOR, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: PRIMARY_COLOR }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Distribución por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(214, 14%, 87%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Alertas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted"></div>
                ))}
              </div>
            ) : recentAlerts.length > 0 ? (
              recentAlerts.map((alerta) => {
                const Icon = tipoIconMap[alerta.tipo] || Info
                const prioridadClass = prioridadColorMap[alerta.prioridad] || "bg-gray-100 text-gray-700"

                return (
                  <div key={alerta.id} className="flex gap-4 rounded-lg border border-border bg-muted/20 p-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${prioridadClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground">{alerta.titulo}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${prioridadClass}`}>
                            {alerta.prioridad}
                          </span>
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
              })
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay alertas activas.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage