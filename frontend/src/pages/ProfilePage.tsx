import Layout from "@/components/layout";

const ProfilePage = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800">Perfil</h1>
        <p className="mt-2 text-slate-600">
          Aqui podras consultar y actualizar la informacion de tu cuenta.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500">Nombre</h2>
            <p className="mt-1 text-base font-medium text-slate-800">
              Usuario Demo
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500">Correo</h2>
            <p className="mt-1 text-base font-medium text-slate-800">
              usuario@ulsa.edu.ni
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
