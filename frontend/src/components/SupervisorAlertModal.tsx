import { useState, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { WebSocketMessage } from "../hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Check, CheckCircle } from "lucide-react";
import api from "../api/axios";

interface PlacaDetectadaMessage {
  type: "PLACA_DETECTADA";
  data: {
    placa: string;
    registro_id: number;
    camara: string;
    confianza: number;
  };
}

interface User {
  rol: string;
  [key: string]: unknown;
}

function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

function isSupervisor(): boolean {
  const user = getCurrentUser();
  return user?.rol === "SUPERVISOR";
}

function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.rol === "ADMIN";
}

export function SupervisorAlertModal() {
  const [pendingDetection, setPendingDetection] = useState<PlacaDetectadaMessage["data"] | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type !== "PLACA_DETECTADA") return;
    
    const placaData = message as unknown as PlacaDetectadaMessage;
    const data = placaData.data;
    
    if (!data || !data.placa) return;

    if (isSupervisor()) {
      setPendingDetection(data);
    } else if (isAdmin()) {
      setToastMessage(`Placa detectada: ${data.placa}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  }, []);

  const { isConnected } = useWebSocket({
    onMessage: handleWebSocketMessage,
    autoReconnect: true,
  });

  const handleConfirm = async () => {
    if (!pendingDetection) return;
    
    setIsProcessing(true);
    try {
      await api.patch(`/logs-deteccion/${pendingDetection.registro_id}/`, {
        estado_acceso: "AUTORIZADO",
      });
      
      setToastMessage(`Placa ${pendingDetection.placa} autorizada`);
      setShowToast(true);
    } catch (error) {
      console.error("Error confirming access:", error);
      setToastMessage("Error al confirmar acceso");
      setShowToast(true);
    } finally {
      setPendingDetection(null);
      setIsProcessing(false);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const handleReject = async () => {
    if (!pendingDetection) return;
    
    setIsProcessing(true);
    try {
      await api.patch(`/logs-deteccion/${pendingDetection.registro_id}/`, {
        estado_acceso: "DENEGADO",
      });
      
      setToastMessage(`Placa ${pendingDetection.placa} denegada`);
      setShowToast(true);
    } catch (error) {
      console.error("Error rejecting access:", error);
      setToastMessage("Error al denegar acceso");
      setShowToast(true);
    } finally {
      setPendingDetection(null);
      setIsProcessing(false);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  const closeModal = () => {
    setPendingDetection(null);
  };

  if (!isSupervisor()) return null;

  return (
    <>
      {pendingDetection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Placa detectada
                </h2>
                <p className="text-sm text-gray-500">
                  Requiere confirmación de supervisor
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Placa:</span>
                <span className="font-mono font-bold text-gray-900">
                  {pendingDetection.placa}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cámara:</span>
                <span className="text-gray-900">
                  {pendingDetection.camara}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Confianza IA:</span>
                <span className="text-gray-900">
                  {Math.round((pendingDetection.confianza || 0) * 100)}%
                </span>
              </div>
            </div>

            <p className="mt-4 text-center text-lg font-medium text-gray-900">
              ¿Confirmar ingreso?
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
              >
                <X className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 bg-green-700 hover:bg-green-800"
              >
                <Check className="mr-2 h-4 w-4" />
                Confirmar
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span>{isConnected ? "Conectado" : "Desconectado"}</span>
            </div>
          </div>
        </div>
      )}

      {showToast && !pendingDetection && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up rounded-lg bg-white p-4 shadow-lg ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-900">{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}

export default SupervisorAlertModal;