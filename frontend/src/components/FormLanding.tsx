import { useState, type FormEvent } from "react";
import api from "../api/axios";

const FormLanding = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      // Ajustar la ruta cuando este el endpoint en Django
      await api.post('/api/vehiculos/registro/', data);
      
      setSent(true);
      console.log("Datos enviados al backend:", data);
    } catch (error) {
      console.error("Hubo un error al enviar el formulario:", error);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:p-8">
      <form
        className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
        onSubmit={handleSubmit}
      >
        {/* Placa del Vehículo */}
        <div>
          <label
            className="mb-2 block text-left text-sm font-bold text-slate-800"
            htmlFor="plate"
          >
            Placa del Vehículo *
          </label>
          <input
            id="plate"
            name="plate"
            type="text"
            required
            placeholder="ABC-123"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
        </div>

        {/* Nombre del Conductor */}
        <div>
          <label
            className="mb-2 block text-left text-sm font-bold text-slate-800"
            htmlFor="driverName"
          >
            Nombre del Conductor *
          </label>
          <input
            id="driverName"
            name="driverName"
            type="text"
            required
            placeholder="Tu nombre completo"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-green-700 focus:ring-1 focus:ring-green-700"
          />
        </div>

        {/* Tu Rol */}
        <div>
          <label
            className="mb-2 block text-left text-sm font-bold text-slate-800"
            htmlFor="role"
          >
            Tu Rol
          </label>
          <select
            id="role"
            name="role"
            defaultValue=""
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-700 focus:ring-1 focus:ring-green-700"
          >
            <option value="" disabled>
              Seleccionar rol
            </option>
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
            <option value="administrativo">Administrativo</option>
            <option value="visitante">Visitante</option>
          </select>
        </div>

        {/* Tipo de Vehículo */}
        <div>
          <label
            className="mb-2 block text-left text-sm font-bold text-slate-800"
            htmlFor="vehicleType"
          >
            Tipo de Vehículo
          </label>
          <select
            id="vehicleType"
            name="vehicleType"
            defaultValue=""
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-700 focus:ring-1 focus:ring-green-700"
          >
            <option value="" disabled>
              Seleccionar tipo
            </option>
            <option value="sedan">Automóvil / Sedán</option>
            <option value="pickup">Camioneta</option>
            <option value="moto">Motocicleta</option>
          </select>
        </div>

        {/* Botón de Envío */}

        <div className="pt-2 md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-[#1a630a] py-4 font-bold text-white shadow-lg transition hover:bg-[#145208] active:scale-[0.98]"
          >
            Enviar Solicitud de Registro
          </button>
        </div>

        {sent && (
          <div className="mt-2 rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm font-bold text-green-800 md:col-span-2">
            ¡Solicitud enviada con éxito!
          </div>
        )}
      </form>
    </section>
  );
};

export default FormLanding;
