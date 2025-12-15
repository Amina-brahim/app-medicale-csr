import React, { useEffect, useState } from 'react';   
import { useNavigate } from "react-router-dom";
import LogoCsr from './images/logo_csr.png';
//import io from "socket.io-client";
import "./AnalysesTable.css"; // Import du CSS

const MgLabo = ({socket}) => {
  const [analyses, setAnalyses] = useState([]);
  //const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  // Convertit isLaboratorized (0,1,2,3) en texte lisible
  const mapLaboStatus = (code) => {
    const statusMap = {
      0: "En attente",
      1: "En cours",
      2: "Terminé",
      3: "Annulé",
    };
    return statusMap[code] || "En attente";
  };

  useEffect(() => {
    //const newSocket = io("http://localhost:4600"); // Adaptez l'URL
    //setSocket(newSocket);

    // Écouter les nouveaux patients
    socket.on("nouveau_patient", (newData) => {
      // Vérifier si le service est "laboratoire" avant d'ajouter
      if (newData.service === "laboratoire") {
        setAnalyses((prevAnalyses) => {
          // Vérifie si l'analyse existe déjà via numClient
          const existingIndex = prevAnalyses.findIndex(
            (a) => a.numClient === newData.numClient
          );

          if (existingIndex >= 0) {
            // Mise à jour si le patient existe
            const updatedAnalyses = [...prevAnalyses];
            updatedAnalyses[existingIndex] = {
              ...newData,
              status: mapLaboStatus(newData.isLaboratorized),
            };
            return updatedAnalyses;
          } else {
            // Ajout cumulatif si nouveau patient
            return [
              ...prevAnalyses,
              {
                ...newData,
                status: mapLaboStatus(newData.isLaboratorized),
              },
            ];
          }
        });
      }
    });

    // Écouter les mises à jour de statut
    socket.on("mise_ajour_patient_labo", (updatedPatient) => {
      setAnalyses((prevAnalyses) =>
        prevAnalyses.map((item) =>
          item.numClient === updatedPatient.numClient
            ? { ...item, isLaboratorized: updatedPatient.isLaboratorized, status: mapLaboStatus(updatedPatient.isLaboratorized) }
            : item
        )
      );
    });

    // Charger les données existantes du laboratoire au démarrage
    socket.emit('recuperer_donnees_laboratoire', (response) => {
      if (response.success) {
        const patientsLabo = response.donnees.map(patient => ({
          ...patient,
          status: mapLaboStatus(patient.isLaboratorized)
        }));
        setAnalyses(patientsLabo);
      } else {
        console.error("Erreur chargement données labo:", response.error);
      }
    });

    return () => socket.disconnect();
  }, []);

  // Envoie les mises à jour au serveur
  const handleStatusChange = (numClient, newStatusText) => {
    const statusToCode = {
      "En attente": 0,
      "En cours": 1,
      "Terminé": 2,
      "Annulé": 3
    };
    const newCode = statusToCode[newStatusText] ?? 0;
    
    // Mise à jour normale du statut
    socket.emit("update_status_labo", {
      numClient,
      isLaboratorized: newCode
    });

    // Mise à jour optimiste locale
    setAnalyses((prev) =>
      prev.map((item) =>
        item.numClient === numClient
          ? { ...item, status: newStatusText }
          : item
      )
    );

    if (newStatusText === "Terminé") {
      // Optionnel: Suppression locale après un délai
      setTimeout(() => {
        setAnalyses(prev => prev.filter(item => item.numClient !== numClient));
      }, 1000);
    }
  };

  // Fonction pour exporter le journal laboratoire
  const exporterJournalLabo = () => {
    socket.emit('sauvegarder_journal', { 
      service: 'laboratoire', 
      donnees: analyses 
    }, (response) => {
      if (response.success) {
        alert(`Journal laboratoire exporté: ${response.fichier}`);
      } else {
        alert("Erreur lors de l'export: " + response.error);
      }
    });
  };

  // Fonction pour retourner à la page précédente
  const retour = () => {
    navigate(-1);
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
          <br />
          <h2 className='sous_titre_entete'>File des travaux techniques</h2>
        </div>
      </div>



      <table className="table-labo">
        <thead>
          <tr>
            <th><h2>Code OP</h2></th>
            <th >CSR ID</th>
            <th>Etat Labo</th>
          </tr>
        </thead>
        <tbody>
          {analyses.length === 0 ? (
            <tr>
              <td colSpan="6" className="aucune-analyse">
                Aucune analyse en cours pour le laboratoire
              </td>
            </tr>
          ) : (
            analyses.map((item) => (
              <tr key={item.numClient}>
                <td>{item.numClient}</td>
                <td className="tableCSRID">{item.numID_CSR}</td>
                <td>
                  <select
                    value={item.status}
                    onChange={(e) =>
                      handleStatusChange(item.numClient, e.target.value)
                    }
                    className="etatLabo"
                  >
                    {["En attente", "En cours", "Terminé", "Annulé"].map(
                      (option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      )
                    )}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
};

export default MgLabo;

/*                <td className="tableNomClient">{item.nomClient}</td>

      <div className="journal-actions-labo">
        <button className="btn-export-lab" onClick={exporterJournalLabo}>
          Exporter Journal
        </button>
        <button className="btn-retour-lab" onClick={retour}>
          Retour
        </button>
      </div>
*/
