import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, Activity, AlertTriangle, Users, Clock } from "lucide-react"
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
  usuarios: number
}

interface HourlyAccess {
  hora: string
  accesos: number
}

interface AccessTypeDistribution {
  name: string
  value: number
  color: string
}

const mockLineData = [
  { hora: "06:00", accesos: 12 },
  { hora: "08:00", accesos: 78 },
  { hora: "10:00", accesos: 45 },
  { hora: "12:00", accesos: 89 },
  { hora: "14:00", accesos: 56 },
  { hora: "16:00", accesos: 67 },
  { hora: "18:00", accesos: 95 },
  { hora: "20:00", accesos: 34 },
]

const mockPieData = [
  { name: "Docentes", value: 35, color: PRIMARY_COLOR },
  { name: "Estudiantes", value: 45, color: SECONDARY_COLOR },
  { name: "Administrativos", value: 15, color: ACCENT_COLOR },
  { name: "Visitantes", value: 5, color: "#6B7280" },
]

function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVehiculos: 0,
    accesosHoy: 0,
    alertas: 0,
    usuarios: 0,
  })
  const [loading, setLoading] = useState(true)
  const [lineData, setLineData] = useState<HourlyAccess[]>(mockLineData)
  const [pieData, setPieData] = useState<AccessTypeDistribution[]>(mockPieData)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [vehiculosRes, registrosRes, alertasRes, usuariosRes] = await Promise.all([
          api.get("/vehiculos/"),
          api.get("/registros-accesos/"),
          api.get("/alertas/"),
          api.get("/usuarios/"),
        ])

        const vehiculos = Array.isArray(vehiculosRes.data) ? vehiculosRes.data : (vehiculosRes.data.results || [])
        const registros = Array.isArray(registrosRes.data) ? registrosRes.data : (registrosRes.data.results || [])
        const alertas = Array.isArray(alertasRes.data) ? alertasRes.data : (alertasRes.data.results || [])
        const usuarios = Array.isArray(usuariosRes.data) ? usuariosRes.data : (usuariosRes.data.results || [])

        const today = new Date().toISOString().split("T")[0]
        const accesosHoy = registros.filter((r: { fecha_hora: string }) => 
          r.fecha_hora && r.fecha_hora.startsWith(today)
        ).length

        setMetrics({
          totalVehiculos: vehiculos.length,
          accesosHoy,
          alertas: alertas.length,
          usuarios: usuarios.length,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setMetrics({
          totalVehiculos: 1234,
          accesosHoy: 12,
          alertas: 45,
          usuarios: 89,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
      label: "Alertas",
      value: metrics.alertas,
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
      {/* Metric Cards */}
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

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line Chart */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Flujo Vehicular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
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

        {/* Pie Chart */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Distribución por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
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

      {/* Recent Alerts */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Alertas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                tipo: "warning",
                titulo: "Acceso denegado múltiple",
                descripcion: "El vehículo con placa MNO-987 ha intentado ingresar 3 veces sin autorización.",
                fecha: "18/03/2026 09:45",
              },
              {
                tipo: "error",
                titulo: "Cámara fuera de línea",
                descripcion: "La cámara del Estacionamiento C no responde.",
                fecha: "18/03/2026 09:30",
              },
              {
                tipo: "info",
                titulo: "Mantenimiento programado",
                descripcion: "Mantenimiento de barrera Entrada Principal programado para mañana 06:00.",
                fecha: "18/03/2026 08:00",
              },
            ].map((alerta, i) => (
              <div key={i} className="flex gap-4 rounded-lg border border-border bg-muted/20 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  alerta.tipo === "error" ? "bg-red-100 text-red-700" :
                  alerta.tipo === "warning" ? "bg-yellow-100 text-yellow-700" :
                  "bg-primary/10 text-primary"
                }`}>
                  {alerta.tipo === "error" ? <AlertTriangle className="h-5 w-5" /> :
                   alerta.tipo === "warning" ? <AlertTriangle className="h-5 w-5" /> :
                   <Activity className="h-5 w-5" />}
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
