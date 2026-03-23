import Layout from "@/components/layout";

const UsersMan = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Gestion de usuarios
        </h1>
        <p className="mt-2 text-slate-600">
          Administra altas, bajas y cambios de usuarios del sistema.
        </p>
      </div>
    </Layout>
  );
};

export default UsersMan;
