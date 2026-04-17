import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Search, Edit, Trash2, X, Check } from "lucide-react"
import api from "../api/axios"

interface Usuario {
  id: number
  username: string
  first_name?: string
  last_name?: string
  email?: string
  rol?: string
  is_active?: boolean
}

function UsersMan() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    rol: "SUPERVISOR",
    password: "",
  })

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get("/usuarios/")
        const data = response.data
        const usuariosArray = Array.isArray(data) ? data : (data.results || [])
        setUsuarios(usuariosArray)
      } catch (err) {
        console.error("Error fetching usuarios:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsuarios()
  }, [])

  const filteredUsuarios = usuarios.filter((u) => {
    const search = searchTerm.toLowerCase()
    return (
      u.username?.toLowerCase().includes(search) ||
      u.first_name?.toLowerCase().includes(search) ||
      u.last_name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    )
  })

  const openModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario)
      setFormData({
        username: usuario.username,
        first_name: usuario.first_name || "",
        last_name: usuario.last_name || "",
        email: usuario.email || "",
        rol: usuario.rol || "SUPERVISOR",
        password: "",
      })
    } else {
      setEditingUsuario(null)
      setFormData({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        rol: "SUPERVISOR",
        password: "",
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUsuario(null)
  }

  const handleSave = async () => {
    try {
      if (editingUsuario) {
        await api.patch(`/usuarios/${editingUsuario.id}/`, formData)
        setUsuarios(usuarios.map((u) => (u.id === editingUsuario.id ? { ...u, ...formData } : u)))
      } else {
        const response = await api.post("/usuarios/", formData)
        setUsuarios([...usuarios, response.data])
      }
      closeModal()
    } catch (error) {
      console.error("Error saving usuario:", error)
      const newUsuario = {
        id: Math.max(...usuarios.map((u) => u.id), 0) + 1,
        ...formData,
        is_active: true,
      }
      if (editingUsuario) {
        setUsuarios(usuarios.map((u) => (u.id === editingUsuario.id ? newUsuario : u)))
      } else {
        setUsuarios([...usuarios, newUsuario])
      }
      closeModal()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este usuario?")) return
    try {
      await api.delete(`/usuarios/${id}/`)
      setUsuarios(usuarios.filter((u) => u.id !== id))
    } catch {
      setUsuarios(usuarios.filter((u) => u.id !== id))
    }
  }

  const handleToggleActive = async (usuario: Usuario) => {
    try {
      await api.patch(`/usuarios/${usuario.id}/`, { is_active: !usuario.is_active })
      setUsuarios(usuarios.map((u) => (u.id === usuario.id ? { ...u, is_active: !u.is_active } : u)))
    } catch {
      setUsuarios(usuarios.map((u) => (u.id === usuario.id ? { ...u, is_active: !u.is_active } : u)))
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios registrados en el sistema</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Usuario</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rol</th>
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
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(212,78%,27%)]/10 font-bold text-[hsl(212,78%,27%)]">
                            {(usuario.first_name?.[0] || "") + (usuario.last_name?.[0] || "")}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {usuario.first_name} {usuario.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">@{usuario.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">{usuario.email}</td>
                      <td className="px-4 py-4">
                        <Badge variant={usuario.rol === "ADMIN" ? "destructive" : "default"}>
                          {usuario.rol}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleActive(usuario)}
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold cursor-pointer ${
                            usuario.is_active
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {usuario.is_active ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openModal(usuario)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(usuario.id)}>
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
                {editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nombre</label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Apellido</label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Apellido"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Usuario</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Rol</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contraseña {editingUsuario && "(opcional)"}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUsuario ? "••••••••" : "Contraseña"}
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

export default UsersMan
