import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

export interface Vehiculo {
  placa: string
  tipo: string
}

const fetchVehiculos = async (): Promise<Vehiculo[]> => {
  const response = await api.get('/vehiculos/')
  const data = response.data
  return Array.isArray(data) ? data : data.results || []
}

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehiculos,
  })
}

export const useCreateVehicle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newVehicle: Omit<Vehiculo, 'placa'>) =>
      api.post('/vehiculos/', newVehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ placa, data }: { placa: string; data: Partial<Vehiculo> }) =>
      api.put(`/vehiculos/${placa}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (placa: string) => api.delete(`/vehiculos/${placa}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}