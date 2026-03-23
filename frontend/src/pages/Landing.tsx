import InfoCard from "../components/InfoCard";
import FormLanding from "../components/FormLanding";
import { Mail, MapPin } from "lucide-react";

const Landing = () => {
  return (
    <div>
      <header className="bg-white m-0 font-bold text-green-800 text-xl p-4 pl-6 border border-green-800">
        SCAVI
      </header>
      <div className="min-h-screen bg-[#f7f7f7] p-4 text-center">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="mx-auto my-6 w-2/3 rounded-full border border-green-800 bg-white p-2 text-center shadow-sm text-green-900 font-small">
            Universidad Tecnológica La Salle
          </h2>
          <h1 className="text-2 font-bold  text-3xl my-6 w-full mx-auto">
            Sistema de Control de Acceso Vehicular Institucional
          </h1>
          <p className="text-color-gray my-6">
            Automatiza y optimiza el control de acceso vehicular en tu
            institución con tecnología de reconocimiento de placas, monitoreo en
            tiempo real y gestión centralizada de usuarios.
          </p>
          <button className="bg-green-800 hover:bg-green-700 text-white font-bold py-2 rounded m-1 w-full shadow-md">
            Ingresar al Sistema
          </button>
          <br />
          <button className="text-green-800 hover:bg-[#f0f9f6] font-bold py-2 rounded border border-green-800 m-1 w-full shadow-md">
            Más Información
          </button>

          <h1 className="text-2 font-bold  text-3xl my-6 w-full mx-auto">
            Registra tu vehículo
          </h1>
          <FormLanding />
          <h1 className="text-2 font-bold  text-3xl my-6 w-full mx-auto">
            Información de Contacto
          </h1>
          <div className="align-items-center justify-items-center">
            <InfoCard
              icon={<Mail size={32} />}
              title="Correo (Proximamente)"
              value="scavi@ulsa.edu.ni"
            />
            <InfoCard
              icon={<MapPin size={32} />}
              title="Direccion"
              value="Universidad Tecnológica La Salle, Leon, Nicaragua"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
