import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Car, Plus, Search, Edit, Trash2, X, Check } from "lucide-react"
import api from "../api/axios"

interface Vehiculo {
  placa: string
  tipo: string
}

function VehicleMan() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)
  const [formData, setFormData] = useState({
    placa: "",
    tipo: "DOCENTE",
  })

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const response = await api.get("/vehiculos/")
        const data = response.data
        const vehiculosArray = Array.isArray(data) ? data : (data.results || [])
        setVehiculos(vehiculosArray)
      } catch (err) {
        console.error("Error fetching vehiculos:", err)
        setError("No se pudieron cargar los vehículos")
      } finally {
        setLoading(false)
      }
    }
    fetchVehiculos()
  }, [])

  const filteredVehiculos = vehiculos.filter((v) => {
    const search = searchTerm.toLowerCase()
    return (
      v.placa?.toLowerCase().includes(search) ||
      v.tipo?.toLowerCase().includes(search)
    )
  })

  const openModal = (vehiculo?: Vehiculo) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo)
      setFormData({
        placa: vehiculo.placa,
        tipo: vehiculo.tipo,
      })
    } else {
      setEditingVehiculo(null)
      setFormData({
        placa: "",
        tipo: "DOCENTE",
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingVehiculo(null)
  }

  const handleSave = async () => {
    try {
      if (editingVehiculo) {
        await api.put(`/vehiculos/${formData.placa}/`, formData)
        setVehiculos(vehiculos.map((v) => (v.placa === editingVehiculo.placa ? formData : v)))
      } else {
        const response = await api.post("/vehiculos/", formData)
        setVehiculos([...vehiculos, response.data])
      }
      closeModal()
    } catch (err) {
      console.error("Error saving vehiculo:", err)
      alert("Error al guardar el vehículo")
    }
  }

  const handleDelete = async (placa: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar el vehículo ${placa}?`)) return
    try {
      await api.delete(`/vehiculos/${placa}/`)
      setVehiculos(vehiculos.filter((v) => v.placa !== placa))
    } catch (err) {
      console.error("Error deleting vehiculo:", err)
      alert("Error al eliminar el vehículo")
    }
  }

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      DOCENTE: "Docente",
      ESTUDIANTE: "Estudiante",
      VISITANTE: "Visitante",
      ADMINISTRATIVO: "Administrativo",
    }
    return tipos[tipo] || tipo
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      DOCENTE: "bg-primary/10 text-primary",
      ESTUDIANTE: "bg-secondary/20 text-secondary",
      ADMINISTRATIVO: "bg-accent/30 text-accent-foreground",
      VISITANTE: "bg-muted text-muted-foreground",
    }
    return colors[tipo] || "bg-muted text-muted-foreground"
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Vehículos</h1>
          <p className="text-muted-foreground">Administra los vehículos registrados en el sistema</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Vehículo
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar vehículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Placa</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      Cargando...
                    </td>
                  </tr>
                ) : filteredVehiculos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      No se encontraron vehículos
                    </td>
                  </tr>
                ) : (
                  filteredVehiculos.map((vehiculo) => (
                    <tr key={vehiculo.placa} className="hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-semibold text-foreground">{vehiculo.placa}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTipoColor(vehiculo.tipo)}`}>
                          {getTipoLabel(vehiculo.tipo)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openModal(vehiculo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(vehiculo.placa)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingVehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Placa</label>
                <Input
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                  placeholder="ABC-123"
                  disabled={!!editingVehiculo}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="DOCENTE">Docente</option>
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="VISITANTE">Visitante</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Check className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleMan