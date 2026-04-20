import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, type Vehiculo } from "../hooks/useVehicles"
import { VehicleTable, VehicleFormModal } from "@/components/vehicles"

function VehicleMan() {
  const { data: vehiculos = [], isLoading: loading, error } = useVehicles()
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()
  const deleteVehicle = useDeleteVehicle()

  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)
  const [formData, setFormData] = useState({
    placa: "",
    tipo: "DOCENTE",
  })

  const filteredVehiculos = (vehiculos || []).filter((v) => {
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
        await updateVehicle.mutateAsync({ placa: formData.placa, data: formData })
      } else {
        await createVehicle.mutateAsync(formData)
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
      await deleteVehicle.mutateAsync(placa)
    } catch (err) {
      console.error("Error deleting vehiculo:", err)
      alert("Error al eliminar el vehículo")
    }
  }

  const handleFormChange = (field: "placa" | "tipo", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Pure UI functions - passed to presentational components
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

  const displayError = error ? "No se pudieron cargar los vehículos" : ""

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

      {displayError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {displayError}
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

      <VehicleTable
        vehiculos={filteredVehiculos}
        loading={loading}
        onEdit={openModal}
        onDelete={handleDelete}
        getTipoLabel={getTipoLabel}
        getTipoColor={getTipoColor}
      />

      <VehicleFormModal
        isOpen={showModal}
        isEditing={!!editingVehiculo}
        formData={formData}
        onClose={closeModal}
        onSubmit={handleSave}
        onChange={handleFormChange}
      />
    </div>
  )
}

export default VehicleMan