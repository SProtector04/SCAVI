import InfoCard from "../components/InfoCard";
import FormLanding from "../components/FormLanding";
import { Mail, MapPin, Phone } from "lucide-react";

const Landing = () => {
  return (
    <div>
      <header className="bg-white m-0 font-bold text-green-800 text-xl p-4 pl-6 border border-green-800">
        SCAVI
      </header>
      <div className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-center md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="mx-auto my-6 rounded-full border border-green-800 bg-white p-2 text-center shadow-sm text-green-900 font-small">
            Universidad Tecnológica La Salle
          </h2>
          <h1 className="mx-auto my-6 w-full max-w-4xl text-3xl font-extrabold leading-tight md:my-10 md:text-5xl">
            Sistema de Control de Acceso Vehicular Institucional
          </h1>
          <p className="mx-auto my-6 max-w-3xl text-base text-slate-700 md:my-8 md:text-lg">
            Automatiza y optimiza el control de acceso vehicular en tu
            institución con tecnología de reconocimiento de placas, monitoreo en
            tiempo real y gestión centralizada de usuarios.
          </p>
          <div className="mx-auto my-6 grid w-full max-w-xl grid-cols-1 gap-3 md:my-8 md:grid-cols-2">
            <button className="w-full rounded bg-green-800 py-2 font-bold text-white shadow-md hover:bg-green-700">
              Ingresar al Sistema
            </button>
            <button className="w-full rounded border border-green-800 py-2 font-bold text-green-800 shadow-md hover:bg-[#f0f9f6]">
              Más Información
            </button>
          </div>

          <h1 className="mx-auto my-6 w-full max-w-3xl text-3xl font-bold md:my-12 md:text-4xl">
            Registra tu vehículo
          </h1>
          <FormLanding />
          <h1 className="mx-auto my-6 w-full max-w-3xl text-3xl font-bold md:my-12 md:text-4xl">
            Información de Contacto
          </h1>
          <div className="grid grid-cols-1 gap-6 justify-items-center md:grid-cols-2 lg:grid-cols-3">
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
            <InfoCard
              icon={<Phone size={32} />}
              title="Numero de Contacto (Proximamente)"
              value="0000-0000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
