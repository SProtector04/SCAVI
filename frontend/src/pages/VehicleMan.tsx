import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Car, Plus, Search, Edit, Trash2, X, Check, Key, User, Building } from "lucide-react"
import api from "../api/axios"

interface Vehiculo {
  id: number
  placa: string
  marca?: string
  modelo?: string
  color?: string
  tipo?: string
  propietario?: string
  departamento?: string
  activo?: boolean
}

const mockVehiculos: Vehiculo[] = [
  { id: 1, placa: "ABC-123", marca: "Toyota", modelo: "Corolla", color: "Negro", tipo: "Sedán", propietario: "María García", departamento: "Ingeniería", activo: true },
  { id: 2, placa: "XYZ-789", marca: "Honda", modelo: "Civic", color: "Blanco", tipo: "Sedán", propietario: "Carlos Martínez", departamento: "RRHH", activo: true },
  { id: 3, placa: "DEF-456", marca: "Ford", modelo: "Explorer", color: "Gris", tipo: "SUV", propietario: "Juan Rodríguez", departamento: "Arquitectura", activo: true },
  { id: 4, placa: "GHI-321", marca: "Nissan", modelo: "Sentra", color: "Azul", tipo: "Sedán", propietario: "Ana López", departamento: "Ciencias", activo: false },
  { id: 5, placa: "JKL-654", marca: "Hyundai", modelo: "Tucson", color: "Rojo", tipo: "SUV", propietario: "Laura Fernández", departamento: "Derecho", activo: true },
]

function VehicleMan() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)
  const [formData, setFormData] = useState({
    placa: "",
    marca: "",
    modelo: "",
    color: "",
    tipo: "Sedán",
    propietario: "",
    departamento: "",
  })

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const response = await api.get("/vehiculos/")
        const data = response.data
        const vehiculosArray = Array.isArray(data) ? data : (data.results || [])
        setVehiculos(vehiculosArray)
      } catch {
        setVehiculos(mockVehiculos)
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
      v.marca?.toLowerCase().includes(search) ||
      v.modelo?.toLowerCase().includes(search) ||
      v.propietario?.toLowerCase().includes(search)
    )
  })

  const openModal = (vehiculo?: Vehiculo) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo)
      setFormData({
        placa: vehiculo.placa,
        marca: vehiculo.marca || "",
        modelo: vehiculo.modelo || "",
        color: vehiculo.color || "",
        tipo: vehiculo.tipo || "Sedán",
        propietario: vehiculo.propietario || "",
        departamento: vehiculo.departamento || "",
      })
    } else {
      setEditingVehiculo(null)
      setFormData({
        placa: "",
        marca: "",
        modelo: "",
        color: "",
        tipo: "Sedán",
        propietario: "",
        departamento: "",
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingVehiculo(null)
  }

  const handleSave = () => {
    if (editingVehiculo) {
      setVehiculos(vehiculos.map((v) => (v.id === editingVehiculo.id ? { ...v, ...formData } : v)))
    } else {
      setVehiculos([...vehiculos, { id: Math.max(...vehiculos.map((v) => v.id), 0) + 1, ...formData, activo: true }])
    }
    closeModal()
  }

  const handleDelete = (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este vehículo?")) return
    setVehiculos(vehiculos.filter((v) => v.id !== id))
  }

  const handleToggleActive = (vehiculo: Vehiculo) => {
    setVehiculos(vehiculos.map((v) => (v.id === vehiculo.id ? { ...v, activo: !v.activo } : v)))
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vehículo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Propietario</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Departamento</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Cargando...
                    </td>
                  </tr>
                ) : filteredVehiculos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No se encontraron vehículos
                    </td>
                  </tr>
                ) : (
                  filteredVehiculos.map((vehiculo) => (
                    <tr key={vehiculo.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-semibold text-foreground">{vehiculo.placa}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-foreground">{vehiculo.marca} {vehiculo.modelo}</p>
                          <p className="text-sm text-muted-foreground">{vehiculo.color} • {vehiculo.tipo}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{vehiculo.propietario}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{vehiculo.departamento}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleActive(vehiculo)}
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold cursor-pointer ${
                            vehiculo.activo
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {vehiculo.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openModal(vehiculo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(vehiculo.id)}>
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
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Marca</label>
                  <Input
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Toyota"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Modelo</label>
                  <Input
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Corolla"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Color</label>
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Negro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Sedán">Sedán</option>
                    <option value="SUV">SUV</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Motocicleta">Motocicleta</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Propietario</label>
                <Input
                  value={formData.propietario}
                  onChange={(e) => setFormData({ ...formData, propietario: e.target.value })}
                  placeholder="Nombre del propietario"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Departamento</label>
                <Input
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  placeholder="Departamento"
                />
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