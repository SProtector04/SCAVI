// src/components/InfoCard.tsx
import React from "react";

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, value }) => {
  return (
    <div className="bg-white p-10 rounded-2xl shadow-md flex flex-col items-center justify-center border border-slate-100 max-w-sm w-full m-2">
      {/* Contenedor del Icono */}
      <div className="bg-green-50 p-4 rounded-xl mb-5 flex items-center justify-center w-16 h-16">
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement, {
              // @ts-ignore
              className: "w-8 h-8 text-green-800",
            })
          : icon}
      </div>

      <h3 className="text-xl font-semibold text-slate-950 mb-2 text-center">
        {title}
      </h3>

      <p className="text-base text-slate-700 text-center">{value}</p>
    </div>
  );
};

export default InfoCard;
