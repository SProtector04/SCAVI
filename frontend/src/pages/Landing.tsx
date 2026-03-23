const Landing = () => {
  return (
    <div className="flex h-screen items-center justify-top text-center bg-[#f7f7f7] p-4">
      <div>
        <h2 className="mx-auto m-4 w-2/3 rounded-full border border-green-800 bg-white p-2 text-center shadow-sm text-green-900 font-small">
          Universidad Tecnológica La Salle
        </h2>
        <h1 className="text-2 font-bold  text-3xl m-4 w-full mx-auto">
          Sistema de Control de Acceso Vehicular Institucional
        </h1>
        <p className="text-color-gray m-4">
          Automatiza y optimiza el control de acceso vehicular en tu institución
          con tecnología de reconocimiento de placas, monitoreo en tiempo real y
          gestión centralizada de usuarios.
        </p>
        <button className="bg-green-800 hover:bg-green-700 text-white font-bold py-2 rounded m-1 w-full shadow-md">
          Ingresar al Sistema
        </button>
        <br />
        <button className="text-green-800 hover:bg-[#f0f9f6] font-bold py-2 rounded border border-green-800 m-1 w-full shadow-md">
          Más Información
        </button>

        <h1 className="text-2 font-bold  text-3xl m-4 w-full mx-auto">
          Registra tu vehículo
        </h1>
        <p className="text-color-gray">
          Completa el formulario para registrar tu vehículo
        </p>
        <h1 className="text-2 font-bold  text-3xl m-4 w-full mx-auto">
          Información de Contacto
        </h1>
      </div>
    </div>
  );
};

export default Landing;
