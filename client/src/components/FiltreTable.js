import React from 'react';

const FiltreTable = ({ data, searchTerm }) => {
  if (!data || data.length === 0) {
    return (
      <div className="no-data-message" style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: '#666',
        fontStyle: 'italic'
      }}>
        Aucun enregistrement trouvé
        {searchTerm && ` pour le CSR ID: ${searchTerm}`}
      </div>
    );
  }

  // Filtrer les en-têtes à exclure - Supprimer NUMCLIENT, NOMCLIENT, NUMID CSR, NUMAIRTEL, NUMTIGO
  const excludedHeaders = [
    'jeton_OP', 
    'isLaboratorized', 
    'dateCreation',
    'NUMCLIENT', 
    'NOMCLIENT', 
    'NUMID CSR', 
    'NUMAIRTEL', 
    'NUMTIGO'
  ];
  
  const headers = Object.keys(data[0]).filter(header => !excludedHeaders.includes(header));

  return (
    <div className='top_titre' style={{ textAlign: 'center', marginTop: '20px' }}>
      {/* Tableau des données */}
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ 
          width: '100%', 
          textAlign: 'center',
          borderCollapse: 'collapse',
          margin: '20px 0',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
              {headers.map((header) => (
                <th key={header} style={{ 
                  padding: '12px', 
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}>
                  {header.replace(/_/g, ' ').toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} style={{ 
                backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
              }}>
                {headers.map((header) => {
                  let value = item[header];
                  
                  // Formater les valeurs
                  if (value === null || value === undefined || value === '') {
                    value = '-';
                  } else if (typeof value === 'number') {
                    // Formater les nombres
                    value = value.toLocaleString();
                  } else if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
                    // Formater les strings numériques
                    value = Number(value).toLocaleString();
                  } else if (header === 'dateModification' && value) {
                    // Formater la date pour l'affichage
                    try {
                      value = new Date(value).toLocaleDateString('fr-FR');
                    } catch (e) {
                      value = value; // Garder la valeur originale en cas d'erreur
                    }
                  }
                  
                  return (
                    <td key={header} style={{ 
                      padding: '10px', 
                      border: '1px solid #ddd'
                    }}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ 
        marginTop: '20px', 
        fontSize: '14px', 
        color: '#666',
        padding: '10px',
        backgroundColor: '#e8f5e8',
        borderRadius: '5px'
      }}>
        Total des enregistrements trouvés: <strong>{data.length}</strong>
        {searchTerm && ` pour le CSR ID: ${searchTerm}`}
      </div>
    </div>
  );
};

export default FiltreTable;