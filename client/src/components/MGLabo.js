import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import LogoCsr from './images/logo_csr.png';
import io from "socket.io-client";
import "./AnalysesTable.css";

const MgLabo = () => {
  const [analyses, setAnalyses] = useState([]);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  // Convertit le code numérique en texte (pour l'affichage initial)
  const mapLaboStatus = (code) => {
    if (typeof code === 'string') return code; // Déjà en texte
    
    const statusMap = {
      0: "En attente",
      1: "En cours",
      2: "Terminé",
      3: "Annulé",
    };
    return statusMap[code] || "En attente";
  };

  // Convertit le texte en code numérique (pour l'envoi au serveur)
  const mapStatusToCode = (statusText) => {
    const statusMap = {
      "En attente": 0,
      "En cours": 1,
      "Terminé": 2,
      "Annulé": 3
    };
    return statusMap[statusText] || 0;
  };

  // Fonction pour formater les examens
  const formaterExamens = (examens) => {
    if (!examens || !Array.isArray(examens)) return 'Aucun examen';
    
    // Si c'est un tableau d'objets
    if (examens.length > 0 && typeof examens[0] === 'object') {
      return examens.map(examen => examen.name || 'Examen inconnu').join(', ');
    }
    
    // Si c'est un tableau de strings
    return examens.join(', ');
  };

  // Fonction pour formater les services
  const formaterServices = (services) => {
    if (!services || !Array.isArray(services)) return 'Aucun service';
    
    // Si c'est un tableau d'objets
    if (services.length > 0 && typeof services[0] === 'object') {
      return services.map(service => service.name || service.value || 'Service inconnu').join(', ');
    }
    
    // Si c'est un tableau de strings
    return services.join(', ');
  };

  useEffect(() => {
    const newSocket = io("http://localhost:4600");
    setSocket(newSocket);

    // Écouter les nouvelles analyses
    newSocket.on("nouveau_patient", (newData) => {
      console.log("Nouveau patient reçu:", newData);
      setAnalyses((prevAnalyses) => {
        // Vérifie si l'analyse existe déjà via numID_CSR
        const existingIndex = prevAnalyses.findIndex(
          (a) => a.numID_CSR === newData.numID_CSR
        );

        if (existingIndex >= 0) {
          // Mise à jour si le patient existe
          const updatedAnalyses = [...prevAnalyses];
          updatedAnalyses[existingIndex] = newData;
          console.log("Patient mis à jour:", updatedAnalyses[existingIndex]);
          return updatedAnalyses;
        } else {
          // Ajout cumulatif si nouveau patient
          console.log("Nouveau patient ajouté:", newData);
          return [...prevAnalyses, newData];
        }
      });
    });

    // Écouter les mises à jour de statut du serveur
    newSocket.on("Etat Analyses Mis à Jour", (data) => {
      console.log("Mise à jour reçue du serveur:", data);
      setAnalyses(prev => 
        prev.map(item => {
          if (item.numID_CSR === data.numID_CSR) {
            console.log("Item mis à jour:", data);
            return { ...item, ...data };
          }
          return item;
        })
      );
    });

    // Écouter les erreurs
    newSocket.on("error", (error) => {
      console.error("Erreur de socket:", error);
    });

    // Nettoyer à la déconnexion
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Envoie les mises à jour au serveur
  const handleStatusChange = async (numID_CSR, newStatusText) => {
    const newCode = mapStatusToCode(newStatusText);
    
    console.log("Changement de statut:", { numID_CSR, newStatusText, newCode });
    
    // Mise à jour optimiste locale
    setAnalyses(prev =>
      prev.map(item =>
        item.numID_CSR === numID_CSR
          ? { ...item, isLaboratorized: newStatusText }
          : item
      )
    );
    
    // Envoi au serveur avec numID_CSR
    try {
      if (socket) {
        socket.emit("update_status", {
          numID_CSR: numID_CSR,
          isLaboratorized: newCode
        });
        console.log("Statut envoyé au serveur");
      } else {
        console.error("Socket non disponible");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi au serveur:", error);
      // Revertir en cas d'erreur
      setAnalyses(prev =>
        prev.map(item =>
          item.numID_CSR === numID_CSR
            ? { ...item, isLaboratorized: item.isLaboratorized }
            : item
        )
      );
    }
    
    if (newStatusText === "Terminé") {
      // Suppression de l'analyse lorsqu'elle est terminée après un court délai
      setTimeout(() => {
        setAnalyses(prev => prev.filter(item => item.numID_CSR !== numID_CSR));
      }, 500);
    }
  };

  return (
    <>
      <div className="entete TC">
        <div className="marges_logo_5px">
          <img className='logo_clinique marges_logo_5px' src={LogoCsr} alt="Tchad" id="logo" />
        </div>
        <div className='titre_entete'>
          <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
          <h3 className='sous_titre_entete'>Laboratoire d'Analyses Médicale</h3>
          <br />
          <h2 className='sous_titre_entete'>File des travaux techniques</h2>
        </div>
      </div>

      <div className="table-container">
        <table className="analyses-table">
          <thead>
            <tr>
              <th className="col-numero">N° Client</th>
              <th className="col-nom">Nom Patient</th>
              <th className="col-csr">CSR ID</th>

              <th className="col-examens">Examens Demandés</th>
              <th className="col-statut">Statut Laboratoire</th>
            </tr>
          </thead>
          <tbody>
            {analyses.length > 0 ? (
              analyses.map((item) => (
                <tr key={item.numID_CSR} className="patient-row">
                  <td className="col-numero">{item.numClient}</td>
                  <td className="col-nom">{item.nomClient || 'Non spécifié'}</td>
                  <td className="col-csr">{item.numID_CSR}</td>
                  
                  <td className="col-examens">
                    <div className="examens-list">
                      {formaterExamens(item.examensSelectionnes || item.examensDetails)}
                    </div>
                    
                  </td>
                  <td className="col-statut">
                    <select
                      value={mapLaboStatus(item.isLaboratorized)}
                      onChange={(e) =>
                        handleStatusChange(item.numID_CSR, e.target.value)
                      }
                      className={`etatLabo status-${mapLaboStatus(item.isLaboratorized).toLowerCase().replace(' ', '-')}`}
                    >
                      {["En attente", "En cours", "Terminé", "Annulé"].map(
                        (option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        )
                      )}
                    </select>
                    <div className="status-indicator">
                      {mapLaboStatus(item.isLaboratorized)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  <div className="empty-state">
                    <span className="empty-icon">🔬</span>
                    <h3>Aucune analyse en attente</h3>
                    <p>Les nouvelles analyses apparaitront ici automatiquement</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </>
  );
};

export default MgLabo;
