import Layout from "@/components/layout";

const VehicleMan = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Gestion de vehiculos
        </h1>
        <p className="mt-2 text-slate-600">
          Seccion para registrar, actualizar y consultar vehiculos autorizados.
        </p>
      </div>
    </Layout>
  );
};

export default VehicleMan;
