import React from 'react';

const TableComponent = ({ data }) => {
  const initialData = ["No","Nom Client", "N° Uique CSR", "N° AirTel", "N° TIGO", "N° Médecin", "Mode Paiement", "Service", "Assuré", "Total FCFA", "Remie %", "Dette FCFA", "Jeton OP", "Etat Labo", "Date OP"
    //{id:0, NomClient: "Nom Client", NumID_CSR: "N° Uique CSR", NumAirTel: "N° AirTel", NumTIGO: "N° TIGO", NumMedecin: "N° Médecin", Mode_Paie_OP: "Mode Paiement", Total_OP: "Total FCFA", Remise_OP: "Remie %", Dette_OP: "Dette FCFA", Jeton_OP: "Jeton", isLaboratorized: false },
  ]
  const headers = (initialData);
  const rows = data.map(item => Object.values(item));

  return (
    <table>
      <thead>
        <tr>
          {headers.map(header => <th key={header}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, index) => <td key={index}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableComponent;