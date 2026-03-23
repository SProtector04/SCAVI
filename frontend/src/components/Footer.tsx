import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-green-800 py-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        {/* Logo / Siglas */}
        <span className="font-bold text-green-800 text-xl tracking-tight">
          SCAVI
        </span>

        {/* Texto de derechos o info adicional */}
        <p className="text-slate-500 text-sm font-medium">
          © 2026 Universidad Tecnológica La Salle. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
