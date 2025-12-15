import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import LogoCsr from './images/logo_csr.png';
import TableComponent from './TableComponent';
import '../caisse.css';

const MgJournaux = ({ socket }) => {
  const navigate = useNavigate();
  const [donnees, setDonnees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [donneesFiltrees, setDonneesFiltrees] = useState([]);
  const [serviceSelectionne, setServiceSelectionne] = useState(null);

  // Fonction pour formater la date de manière sécurisée
  const formaterDate = (patient) => {
    // Chercher une date valide dans différentes propriétés possibles
    const dateSource = patient.dateCreation || 
                      patient.dateModification || 
                      patient.lastUpdate || 
                      patient.journalEntryDate ||
                      patient.dateService;
    
    if (!dateSource) {
      return 'N/A';
    }

    try {
      const dateObj = new Date(dateSource);
      // Vérifier si la date est valide
      if (isNaN(dateObj.getTime())) {
        return 'Date invalide';
      }
      return dateObj.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return 'Erreur date';
    }
  };

  // Fonction pour formater les services
  const formaterServices = (services) => {
    if (!services || !Array.isArray(services)) return 'Aucun service';
    
    return services.map(service => {
      if (typeof service === 'object') {
        return service.name || service.value || 'Service inconnu';
      }
      return service;
    }).join(', ');
  };

  // Fonction pour formater les examens
  const formaterExamens = (examens) => {
    if (!examens || !Array.isArray(examens)) return 'Aucun examen';
    
    return examens.map(examen => 
      typeof examen === 'object' ? examen.name || 'Examen inconnu' : examen
    ).join(', ');
  };

  // Récupérer les données depuis le serveur
  useEffect(() => {
    setChargement(true);
    
    // Utiliser l'événement correct pour récupérer les données du journal
    socket.emit('recuperer_donnees_journal', (response) => {
      if (response && response.success) {
        setDonnees(response.donnees || []);
        setErreur(null);
        console.log(`✅ ${response.donnees?.length || 0} patients chargés pour le journal`);
      } else {
        const errorMsg = response?.message || "Erreur lors de la récupération des données";
        setErreur(errorMsg);
        console.error("Erreur:", errorMsg);
      }
      setChargement(false);
    });
  }, [socket]);

  // Fonction pour récupérer les données d'un service spécifique
  const afficherDonneesService = (service) => {
    setChargement(true);
    
    // Utiliser l'événement pour récupérer les données du service spécifique
    socket.emit('recuperer_donnees_service', service, (response) => {
      if (response && response.success) {
        setDonneesFiltrees(response.donnees || []);
        setServiceSelectionne(service);
        console.log(`✅ ${response.donnees?.length || 0} données chargées pour ${service}`);
      } else {
        const errorMsg = response?.error || `Erreur lors du chargement du journal ${service}`;
        setErreur(errorMsg);
        console.error("Erreur:", errorMsg);
      }
      setChargement(false);
    });
  };

  // Fonction pour créer un fichier JSON pour un service spécifique
  const creerFichierJSON = (service) => {
    // Filtrer les données pour le service sélectionné
    const donneesFiltrees = donnees.filter(item => {
      // Vérifier dans servicesSelectionnes
      const services = item.servicesSelectionnes || [];
      return services.some(s => s.value === service || s === service);
    });
    
    if (donneesFiltrees.length === 0) {
      alert(`Aucune donnée trouvée pour le service ${service}`);
      return;
    }
    
    // Créer un objet JSON avec les données filtrées
    const jsonData = JSON.stringify(donneesFiltrees, null, 2);
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal_${service}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Émettre un événement pour enregistrer le fichier côté serveur
    socket.emit('sauvegarder_journal', { service, donnees: donneesFiltrees }, (response) => {
      if (response && response.success) {
        alert(`Journal ${service} créé avec succès!`);
      } else {
        alert("Erreur lors de la création du journal: " + (response?.error || 'Erreur inconnue'));
      }
    });
  };

  // Fonction pour retourner à la page précédente
  const retour = () => {
    navigate(-1);
  };

  // Fonction pour retourner à la sélection des services
  const retourSelection = () => {
    setServiceSelectionne(null);
    setDonneesFiltrees([]);
  };

  return (
    <>
      <div className="entete TC marges_logo_5px">
        <div className="marges_logo_5px">
          <img className='logo_clinique marges_logo_5px' src={LogoCsr} alt="Tchad" id="logo" />
        </div>
        <div className='titre_entete'>
          <div className="titre-container">
            <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
          </div>
          <h3 className='sous_titre_entete'>
            {serviceSelectionne ? `Journal ${serviceSelectionne}` : 'Journaux par Service'}
          </h3>
        </div>
      </div>

      <div className="conteneur-journaux">
        {chargement && (
          <div className="chargement">
            <div className="spinner"></div>
            Chargement des données...
          </div>
        )}
        
        {erreur && (
          <div className="erreur">
            <strong>Erreur:</strong> {erreur}
            <button onClick={() => window.location.reload()} className="btn-reessayer">
              Réessayer
            </button>
          </div>
        )}
        
        {!chargement && !erreur && !serviceSelectionne && (
          <div className="journal-selection">
            <h3>Sélectionnez un service pour afficher son journal</h3>
            
            <div className="boutons-services">
              <button className="bouton-service" onClick={() => afficherDonneesService('consultation')}>
                📋 Journal Consultation
              </button>
              <button className="bouton-service" onClick={() => afficherDonneesService('laboratoire')}>
                🔬 Journal Laboratoire
              </button>
              <button className="bouton-service" onClick={() => afficherDonneesService('echographie')}>
                📊 Journal Échographie
              </button>
              <button className="bouton-service" onClick={() => afficherDonneesService('hospitalisation')}>
                🏥 Journal Hospitalisation
              </button>
              <button className="bouton-service" onClick={() => afficherDonneesService('chirurgie')}>
                🔪 Journal Chirurgie
              </button>
              <button className="bouton-service" onClick={() => afficherDonneesService('kinesitherapie')}>
                💪 Journal Kinésithérapie
              </button>
              <button className="bouton-service" onClick={() => afficherDonneesService('fibroscopie')}>
                📡 Journal Fibroscopie
              </button>
            </div>

            {/* Statistiques globales */}
            <div className="stats-globales">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">
                    {donnees.length}
                  </span>
                  <span className="stat-label">Patients total</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {new Set(donnees.map(p => p.caisseUser)).size}
                  </span>
                  <span className="stat-label">Caissiers actifs</span>
                </div>
                <div className="stat-item">
                  
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    Veuillez être attentif lors de la vérification des journaux pour de raison de sécurité
                  </span>
                  <span className="stat-label">Ces journaux concernent les travaux de la clinique</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {serviceSelectionne && (
          <div className="journal-donnees">
            <div className="journal-header">
              <h3>Journal du service : {serviceSelectionne}</h3>
              <div className="journal-actions">
                <button className="btn-retour" onClick={retourSelection}>
                  ↩️ Retour aux services
                </button>
                <button 
                  className="btn-export" 
                  onClick={() => creerFichierJSON(serviceSelectionne)}
                >
                  📥 Exporter JSON
                </button>
              </div>
            </div>
            
            {donneesFiltrees.length > 0 ? (
              <div className="tableau-journal">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Nom Patient</th>
                      <th>ID CSR</th>
                      <th>Num Client</th>
                      <th>Services</th>
                      <th>Examens</th>
                      <th>Total</th>
                      <th>Caissier</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donneesFiltrees.map((patient, index) => (
                      <tr key={index}>
                        <td>{formaterDate(patient)}</td>
                        <td>{patient.nomClient || 'Non spécifié'}</td>
                        <td>{patient.numID_CSR || 'N/A'}</td>
                        <td>{patient.numClient || 'N/A'}</td>
                        <td>{formaterServices(patient.servicesSelectionnes)}</td>
                        <td>{formaterExamens(patient.examensSelectionnes)}</td>
                        <td>{(patient.total_OP || 0).toLocaleString('fr-FR')} FCFA</td>
                        <td>{patient.caisseUser || 'Non spécifié'}</td>
                        <td>
                          <span className={`statut ${(patient.isLaboratorized || 'en attente').toLowerCase().replace(' ', '-')}`}>
                            {patient.isLaboratorized || 'En attente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="stats-service">
                  <p>
                    <strong>{donneesFiltrees.length}</strong> enregistrement(s) trouvé(s) pour le service {serviceSelectionne}
                  </p>
                  <p>
                    <strong>Total:</strong> {
                      donneesFiltrees.reduce((sum, item) => sum + (parseFloat(item.total_OP) || 0), 0).toLocaleString('fr-FR')
                    } FCFA
                  </p>
                  <p>
                    <strong>Dernière mise à jour:</strong> {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="aucune-donnee">
                <p>ⓘ Aucune donnée trouvée pour le service {serviceSelectionne}</p>
                <button className="btn-retour" onClick={retourSelection}>
                  ↩️ Retour aux services
                </button>
              </div>
            )}
          </div>
        )}

        {!serviceSelectionne && !chargement && !erreur && (
          <div className='ftt__footer BC sep'>
            <button className="glow-on-hover MenuBtn" type="button" onClick={retour}>
              Retour à la caisse
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MgJournaux;
