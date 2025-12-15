import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import LogoCsr from './images/logo_csr.png';
import '../caisse.css';

const options = [
  { name: "En espèce", value: "espece" },
  { name: "Par Chèque", value: "cheque" },
  { name: "Par Virement", value: "virement" },
  { name: "Trénsfert AirTel", value: "transfert_airtel" },
  { name: "Trénsfert TIGO", value: "transfer_tigo" }
];

const services = [
  { name: "Choisir Service", value: "aucun" },
  { name: "Consultation", value: "consultation" },
  { name: "Laboratoire", value: "laboratoire" },
  { name: "Echographie", value: "echographie" },
  { name: "Hospitalisation", value: "hospitalisation" },
  { name: "Chirurgie", value: "chirurgie" },
  { name: "Kinésithérapie", value: "kinesitherapie" },
  { name: "Fibroscopie", value: "fibroscopie" }
];

// Configuration par défaut des examens (fallback)
const examensParServiceDefaut = {
  consultation: [
    { id: "consult_specialisee", name: "Consultation Spécialisée", prix: 7500 },
    { id: "consult_generale", name: "Consultation Générale", prix: 5000 },
    { id: "consult_professeur", name: "Consultation Reference", prix: 2500 },
    { id: "consult_urgence", name: "Consultation Gynécologie", prix: 10000 }
  ],
  laboratoire: [
    { id: "nfs", name: "NFS", prix: 5000 },
    { id: "ts", name: "TS", prix: 3000 },
    { id: "vs", name: "VS", prix: 2000 },
    { id: "tc", name: "TC", prix: 4000 },
    { id: "tp", name: "TP", prix: 3500 },
    { id: "glycemie", name: "Glycémie", prix: 1500 },
    { id: "uree", name: "Urée", prix: 2000 },
    { id: "creatinine", name: "Créatinine", prix: 2000 },
    { id: "transaminases", name: "Transaminases", prix: 4000 },
    { id: "bilirubine", name: "Bilirubine", prix: 3000 },
    { id: "ionogramme", name: "Ionogramme Sanguin", prix: 4500 },
    { id: "crp", name: "CRP", prix: 3500 }
  ],
  echographie: [
    { id: "echo_gyneco", name: "Echo. Gynéco-Obstétrique", prix: 15000 },
    { id: "echo_abdominale", name: "Echo. Abdominale", prix: 12000 },
    { id: "echo_pelvienne", name: "Echo. Pelvienne", prix: 10000 },
    { id: "echo_prostatique", name: "Echo. Prostatique", prix: 12000 },
    { id: "echo_partie_molle", name: "Echo. de la partie molle", prix: 8000 },
    { id: "echo_renale", name: "Echo. Rénale", prix: 10000 },
    { id: "echo_voies_urinaires", name: "Echo. des voies urinaires", prix: 10000 },
    { id: "echo_thyroidienne", name: "Echo. Thyroidienne", prix: 9000 }
  ],
  hospitalisation: [
    { id: "hosp_jour", name: "Hospitalisation de Jour", prix: 20000 },
    { id: "hosp_nuit", name: "Hospitalisation Nuit", prix: 25000 },
    { id: "hosp_urgence", name: "Hospitalisation Urgence", prix: 30000 },
    { id: "hosp_chambre", name: "Chambre Privée", prix: 15000 },
    { id: "hosp_soins", name: "Soins Infirmiers", prix: 5000 }
  ],
  chirurgie: [
    { id: "chir_mineure", name: "Chirurgie Mineure", prix: 50000 },
    { id: "chir_majeure", name: "Chirurgie Majeure", prix: 150000 },
    { id: "chir_urgence", name: "Chirurgie d'Urgence", prix: 100000 },
    { id: "chir_ambulatoire", name: "Chirurgie Ambulatoire", prix: 40000 }
  ],
  kinesitherapie: [
    { id: "kine_seance", name: "Séance de Kinésithérapie", prix: 8000 },
    { id: "kine_reeducation", name: "Rééducation Fonctionnelle", prix: 10000 },
    { id: "kine_massage", name: "Massage Thérapeutique", prix: 7000 }
  ],
  fibroscopie: [
    { id: "fibro_gastrique", name: "Fibroscopie Gastrique", prix: 25000 },
    { id: "fibro_bronchique", name: "Fibroscopie Bronchique", prix: 30000 },
    { id: "fibro_colique", name: "Fibroscopie Colique", prix: 35000 }
  ]
};

const assureur = [
  { name: "Non", value: "Non" },
  { name: "ASCOMA", value: "ASCOMA" },
  { name: "STAR International", value: "STAR International" }
];

const errors = {
  uname: "Utilisateur Inconnu",
  pass: "Erreur sur Code d'accès",
  service: "Accès refusé : Cet utilisateur n'a pas les permissions Caisse",
  connection: "Erreur de connexion au serveur"
};

const MG_Caisse = ({ socket, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const componentRef = useRef();
  
  // États
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedExamens, setSelectedExamens] = useState([]);
  const [servicesSelectionnes, setServicesSelectionnes] = useState([]);
  const [modalServiceActif, setModalServiceActif] = useState(null);
  const [examensTemporaires, setExamensTemporaires] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [examensParService, setExamensParService] = useState(examensParServiceDefaut);
  const [lastClientNumber, setLastClientNumber] = useState(0);
  const [isLoadingClientNumber, setIsLoadingClientNumber] = useState(true);

  // Référence pour le debounce
  const searchTimeoutRef = useRef(null);

  // Fonctions utilitaires simples et rapides
  const makeid = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const autoGenJeton = () => makeid(40);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  }, []);

  // Fonction pour obtenir le prochain numéro client
  const getNextClientNumber = useCallback(() => lastClientNumber + 1, [lastClientNumber]);

  // Fonction pour générer le CSR ID
  const generateCSRID = useCallback((clientNumber) => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const clientNumStr = String(clientNumber).padStart(4, '0');
    return `CSR${year}${month}${clientNumStr}`;
  }, []);

  // État du formulaire
  const [formData, setFormData] = useState({
    numClient: 0,
    nomClient: '',
    numID_CSR: '',
    numAirTel: '',
    numTIGO: "",
    numMedecin: "",
    mode_Paie_OP: "",
    service: "aucun",
    assure: "Non",
    total_OP: "",
    remise_OP: "",
    dette_OP: "",
    jeton_OP: autoGenJeton(),
    isLaboratorized: "En attente",
    servicesDetails: [],
    examensDetails: []
  });

  // ========== FONCTIONS RAPIDES POUR LA MODALE ==========
  
  const handleServiceChange = (e) => {
    const serviceValue = e.target.value;
    
    if (serviceValue && serviceValue !== "aucun") {
      ouvrirModalService(serviceValue);
    }
    
    // Réinitialiser immédiatement le select
    e.target.value = "aucun";
  };

  const ouvrirModalService = (serviceValue) => {
    const service = services.find(s => s.value === serviceValue);
    if (!service) return;

    const examensExistants = selectedExamens.filter(e => e.service === serviceValue);
    setExamensTemporaires([...examensExistants]);
    setModalServiceActif(service);
  };

  const fermerModalService = () => {
    setModalServiceActif(null);
    setExamensTemporaires([]);
  };

  const handleExamenModalChange = (examen) => {
    setExamensTemporaires(prev => {
      const existeDeja = prev.some(e => e.id === examen.id);
      if (existeDeja) {
        return prev.filter(e => e.id !== examen.id);
      } else {
        return [...prev, { 
          ...examen, 
          service: modalServiceActif.value,
          serviceName: modalServiceActif.name
        }];
      }
    });
  };

  const terminerSelection = () => {
    if (!modalServiceActif) return;

    setSelectedExamens(prev => {
      const sansAnciensExamens = prev.filter(e => e.service !== modalServiceActif.value);
      return [...sansAnciensExamens, ...examensTemporaires];
    });

    if (!servicesSelectionnes.some(s => s.value === modalServiceActif.value)) {
      setServicesSelectionnes(prev => [...prev, {
        value: modalServiceActif.value,
        name: modalServiceActif.name
      }]);
    }

    fermerModalService();
    showNotification(`${examensTemporaires.length} examen(s) sélectionné(s) pour ${modalServiceActif.name}`, 'success');
  };

  const removeService = (serviceValue) => {
    setServicesSelectionnes(prev => prev.filter(s => s.value !== serviceValue));
    setSelectedExamens(prev => prev.filter(e => e.service !== serviceValue));
    showNotification("Service et examens supprimés", 'info');
  };

  const isExamenSelectedInModal = (examenId) => {
    return examensTemporaires.some(e => e.id === examenId);
  };

  const getExamensPourService = (serviceValue) => {
    return selectedExamens.filter(e => e.service === serviceValue);
  };

  // ========== RECHERCHE PATIENT RAPIDE ==========
  
  const handleCSRChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, numID_CSR: value }));
    
    // Recherche immédiate sans debounce
    if (value.length >= 3) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        socket.emit('get_patient_by_csr', value, (response) => {
          if (response && response.success && response.patient) {
            setSearchResults(response.patient);
            setFormData(prev => ({
              ...prev,
              nomClient: response.patient.nomClient || '',
              numAirTel: response.patient.numAirTel || '',
              numTIGO: response.patient.numTIGO || '',
              numMedecin: response.patient.numMedecin || '',
            }));
          } else {
            setSearchResults(null);
          }
        });
      }, 300); // Seulement 300ms de délai au lieu de 500ms
    } else {
      setSearchResults(null);
    }
  };

  // Nettoyer le timeout à la destruction
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ========== GESTION DU FORMULAIRE RAPIDE ==========
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearForm = () => {
    const nextClientNumber = getNextClientNumber();
    const nextCSRID = generateCSRID(nextClientNumber);
    
    setFormData({
      numClient: nextClientNumber,
      nomClient: '',
      numID_CSR: nextCSRID,
      numAirTel: '',
      numTIGO: "",
      numMedecin: "",
      mode_Paie_OP: "",
      service: "aucun",
      assure: "Non",
      total_OP: "",
      remise_OP: "",
      dette_OP: "",
      jeton_OP: autoGenJeton(),
      isLaboratorized: "En attente",
      servicesDetails: [],
      examensDetails: []
    });
    
    setSearchResults(null);
    setSelectedExamens([]);
    setServicesSelectionnes([]);
    setLastClientNumber(prev => prev + 1);
    
    showNotification('Formulaire réinitialisé', 'info');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nomClient || !formData.numID_CSR) {
      showNotification("Le nom du client et le numéro ID CSR sont obligatoires", "error");
      return;
    }

    if (servicesSelectionnes.length === 0) {
      showNotification("Veuillez sélectionner au moins un service", "error");
      return;
    }

    if (selectedExamens.length === 0) {
      showNotification("Veuillez sélectionner au moins un examen", "error");
      return;
    }
    
    const dataToSend = {
      ...formData,
      caisseUser: currentUser ? currentUser.username : 'Utilisateur inconnu',
      caisseService: 'Caisse',
      servicesSelectionnes: servicesSelectionnes,
      examensSelectionnes: selectedExamens
    };
    
    socket.emit("labo", dataToSend, (response) => {
      if (response && response.success) {
        showNotification("Patient enregistré avec succès!", "success");
        
        if (servicesSelectionnes.some(s => s.value === "laboratoire")) {
          socket.emit("labo_supplementaire", dataToSend);
        }
        
        clearForm();
      } else {
        showNotification("Erreur lors de l'enregistrement: " + (response?.message || "Erreur inconnue"), "error");
      }
    });
  };

  // ========== CONNEXION UTILISATEUR ==========
  
  const handleLogin = (event) => {
    event.preventDefault();
    const form = event.target;
    const uname = form.uname.value;
    const pass = form.pass.value;

    if (!socket) {
      setErrorMessages({ name: "connection", message: errors.connection });
      return;
    }

    socket.emit('verify_user_credentials', {
      username: uname,
      password: pass
    }, (response) => {
      if (response && response.success) {
        if (response.isValid && response.user) {
          if (response.user.service !== 'Caisse' && !response.user.permissions?.includes('caisse')) {
            setErrorMessages({ name: "service", message: errors.service });
            return;
          }

          setIsSubmitted(true);
          setCurrentUser({
            ...response.user,
            isIdentified: false
          });
          
          socket.emit('user_identification', {
            service: 'Caisse',
            username: response.user.username,
            fullName: response.user.fullName || response.user.username,
            userId: response.user.id,
            password: pass
          });
          
          showNotification(`Connexion réussie - ${response.user.username} (Caisse)`, 'success');
        } else {
          setErrorMessages({ name: "pass", message: "Nom d'utilisateur ou mot de passe incorrect" });
        }
      } else {
        setErrorMessages({ name: "connection", message: response?.message || errors.connection });
      }
    });
  };

  // ========== EFFETS ==========
  
  useEffect(() => {
    if (socket && isSubmitted) {
      socket.emit('get_last_client_number', (response) => {
        if (response && response.success) {
          setLastClientNumber(response.lastClientNumber || 0);
        } else {
          setLastClientNumber(0);
        }
        setIsLoadingClientNumber(false);
      });
    }
  }, [socket, isSubmitted]);

  useEffect(() => {
    if (!isLoadingClientNumber) {
      const nextClientNumber = getNextClientNumber();
      const nextCSRID = generateCSRID(nextClientNumber);
      
      setFormData(prev => ({
        ...prev,
        numClient: nextClientNumber,
        numID_CSR: nextCSRID
      }));
    }
  }, [lastClientNumber, isLoadingClientNumber, getNextClientNumber, generateCSRID]);

  useEffect(() => {
    const userFromProps = user || location.state?.user;
    if (userFromProps) {
      setCurrentUser(userFromProps);
      setIsSubmitted(true);
      
      if (socket && userFromProps.username) {
        socket.emit('user_identification', {
          service: 'Caisse',
          username: userFromProps.username,
          fullName: userFromProps.fullName || userFromProps.username,
          userId: userFromProps.id
        });
      }
    }
  }, [user, location.state, socket]);

  useEffect(() => {
    if (socket) {
      socket.emit('Ouverture_Session');
    }
  }, [socket]);

  useEffect(() => {
    const totalExamens = selectedExamens.reduce((total, examen) => total + examen.prix, 0);
    setFormData(prev => ({
      ...prev,
      total_OP: totalExamens.toString(),
      examensDetails: selectedExamens,
      servicesDetails: servicesSelectionnes
    }));
  }, [selectedExamens, servicesSelectionnes]);

  // ========== COMPOSANTS ==========
  
  const Notification = () => {
    if (!notification.show) return null;

    return (
      <div className={`notification notification-${notification.type}`}>
        <div className="notification-content">
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close"
            onClick={() => setNotification({ show: false, message: '', type: '' })}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const ReceiptComponent = () => (
    <div ref={componentRef} className="receipt-print" style={{ display: 'none' }}>
      <div className="receipt-header">
        <h2>CSR - N'Djamena - TCHAD</h2>
        <h3>REÇU DE PAIEMENT</h3>
      </div>
      <div className="receipt-body">
        <div className="receipt-section">
          <div className="receipt-row">
            <span className="receipt-label">Nom Client:</span>
            <span className="receipt-value">{formData.nomClient}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">ID CSR:</span>
            <span className="receipt-value">{formData.numID_CSR}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Numéro Client:</span>
            <span className="receipt-value">{formData.numClient}</span>
          </div>
        </div>
        {servicesSelectionnes.length > 0 && (
          <div className="receipt-section">
            <div className="receipt-row">
              <span className="receipt-label">Services:</span>
            </div>
            {servicesSelectionnes.map((service, index) => (
              <div key={index} className="receipt-row">
                <span className="receipt-value">{service.name}</span>
              </div>
            ))}
          </div>
        )}
        {selectedExamens.length > 0 && (
          <div className="receipt-section">
            <div className="receipt-row">
              <span className="receipt-label">Examens:</span>
            </div>
            {selectedExamens.map((examen, index) => (
              <div key={index} className="receipt-row receipt-examen">
                <span className="receipt-value">{examen.name}</span>
                <span className="receipt-price">{examen.prix} FCFA</span>
              </div>
            ))}
          </div>
        )}
        {formData.total_OP && formData.total_OP !== '' && (
          <div className="receipt-section receipt-amounts">
            <div className="receipt-row receipt-total">
              <span className="receipt-label">Total à Payer:</span>
              <span className="receipt-value">{formData.total_OP} FCFA</span>
            </div>
          </div>
        )}
        {formData.mode_Paie_OP && formData.mode_Paie_OP !== '' && (
          <div className="receipt-section">
            <div className="receipt-row">
              <span className="receipt-label">Mode Paiement:</span>
              <span className="receipt-value">
                {options.find(o => o.value === formData.mode_Paie_OP)?.name}
              </span>
            </div>
          </div>
        )}
        <div className="receipt-footer">
          <div className="receipt-row">
            <span className="receipt-label">Caissier:</span>
            <span className="receipt-value">{currentUser?.username}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Date:</span>
            <span className="receipt-value">{new Date().toLocaleString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const ModalSelectionExamens = () => {
    if (!modalServiceActif) return null;

    const examensDuService = examensParService[modalServiceActif.value] || [];
    const totalTemporaire = examensTemporaires.reduce((sum, e) => sum + e.prix, 0);

    return (
      <div className="modal-overlay" onClick={fermerModalService}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Sélection des Examens - {modalServiceActif.name}</h3>
            <button className="modal-close" onClick={fermerModalService}>×</button>
          </div>
          
          <div className="modal-body">
            {examensDuService.length > 0 ? (
              <>
                <div className="examens-list-modal">
                  {examensDuService.map((examen) => (
                    <div key={examen.id} className="examen-item-modal">
                      <label className="examen-label-modal">
                        <input
                          type="checkbox"
                          checked={isExamenSelectedInModal(examen.id)}
                          onChange={() => handleExamenModalChange(examen)}
                          className="examen-checkbox-modal"
                        />
                        <span className="examen-name-modal">{examen.name}</span>
                        <span className="examen-prix-modal">{examen.prix} FCFA</span>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="modal-resume">
                  <h4>Résumé de la sélection</h4>
                  {examensTemporaires.length === 0 ? (
                    <p className="no-selection">Aucun examen sélectionné</p>
                  ) : (
                    <div className="resume-list-modal">
                      {examensTemporaires.map((examen, index) => (
                        <div key={index} className="resume-item-modal">
                          <span>{examen.name}</span>
                          <span>{examen.prix} FCFA</span>
                        </div>
                      ))}
                      <div className="resume-total-modal">
                        <strong>Total: {totalTemporaire} FCFA</strong>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-examens-message">
                <p>📝 Aucun examen disponible pour le service "{modalServiceActif.name}".</p>
                <p>Veuillez contacter l'administration pour ajouter des examens.</p>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button className="btn-secondary" onClick={fermerModalService}>
              Annuler
            </button>
            <button 
              className="btn-primary" 
              onClick={terminerSelection}
              disabled={examensTemporaires.length === 0}
            >
              {examensTemporaires.length === 0 ? 'Aucun examen sélectionné' : `Valider (${examensTemporaires.length} examen${examensTemporaires.length > 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderForm = (
    <div className="form">
      <form className='form_margin BC' onSubmit={handleLogin}>
        <label className='sous_titre'>Utilisateur</label>
        <input className='utilisateur_interne' minLength={4} type="text" name="uname" required />
        {errorMessages.name === "uname" && <div className="message_erreur">{errorMessages.message}</div>}

        <label className='sous_titre'>Code d'accès</label>
        <input className='utilisateur_interne' minLength={4} type="password" name="pass" required />
        {errorMessages.name === "pass" && <div className="message_erreur">{errorMessages.message}</div>}
        {errorMessages.name === "service" && <div className="message_erreur">{errorMessages.message}</div>}
        {errorMessages.name === "connection" && <div className="message_erreur">{errorMessages.message}</div>}

        <div className='ftt__footer BC'>
          <button className='home__cta'>Connexion</button>
        </div>
      </form>
    </div>
  );

  // Navigation
  const sirAcceuil = () => navigate("/PageAcceuil", { state: { user: currentUser } });
  const sirApercu = () => navigate("/MgJournaux", { state: { user: currentUser } });
  const sirFiltre = () => navigate("/Filtre", { state: { user: currentUser } });

  return (
    <>
      <div className="entete TC marges_logo_5px">
        <div className="marges_logo_5px">
          <img className='logo_clinique marges_logo_5px' src={LogoCsr} alt="Tchad" id="logo" />
        </div>
        <div className='titre_entete'>
          <div className="titre-container">
            <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
            {currentUser && (
              <div className="user-info-header">
                <div className="user-status-indicator">
                  <span className={`status-dot ${currentUser.isIdentified ? 'online' : 'offline'}`}></span>
                  Connecté en tant que: <strong>{currentUser.username}</strong> (Caisse)
                </div>
              </div>
            )}
          </div>
          <h3 className='sous_titre_entete'>Gestion de Caisse</h3>
        </div>
      </div>

      <Notification />
      <ModalSelectionExamens />
      <ReceiptComponent />

      {!isSubmitted ? renderForm : (
        <div>
          <form className='form_margin' onSubmit={handleSubmit}>
            <div className='flex-row'>
              <div className='flex-column top_nom'>
                <label className='titre_input top_titre'>Nom du Client</label>
                <input 
                  className='nom_client__input color_vert_champ'
                  value={formData.nomClient}
                  onChange={handleChange}
                  minLength={4}
                  type="text"
                  name="nomClient"
                  required 
                />
              </div>

              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='titre_input top_titre'>N° ID Unique</label>
                <input 
                  className='userID_input color_vert_champ'
                  value={formData.numID_CSR}
                  onChange={handleCSRChange}
                  minLength={8}
                  maxLength={12}
                  type="text"
                  name="numID_CSR"
                  placeholder="ID CSR"
                  required 
                />
                {searchResults && <div className="search-result">Patient trouvé: {searchResults.nomClient}</div>}
              </div>
              
              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='titre_input largeur_etiq_caisse'>N° AirTel Client</label>
                <input 
                  className='usertel__input largeur_etiq_caisse color_vert_champ'
                  value={formData.numAirTel}
                  onChange={handleChange}
                  minLength={8}
                  type="tel"
                  name="numAirTel"
                  placeholder="Numéro Airtel"
                />
              </div>

              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='titre_input largeur_etiq_caisse'>Numéro Client</label>
                <input 
                  className='usertel__input largeur_etiq_caisse color_vert_champ'
                  value={formData.numClient}
                  readOnly
                  type="number"
                  name="numClient"
                  placeholder="Numéro client"
                />
              </div>
            </div>

            <div className='flex-row'>
              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='titre_input largeur_etiq_caisse'>N° TIGO Client</label>
                <input 
                  className='usertel__input largeur_etiq_caisse color_vert_champ'
                  value={formData.numTIGO}
                  onChange={handleChange}
                  minLength={8}
                  type="tel"
                  name="numTIGO"
                  placeholder="Numéro TIGO"
                />
              </div>
              
              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='titre_input largeur_etiq_caisse'>N° Médecin</label>
                <input 
                  className='usertel__input largeur_etiq_caisse color_vert_champ'
                  value={formData.numMedecin}
                  onChange={handleChange}
                  minLength={8}
                  type="tel"
                  name="numMedecin"
                  placeholder="Numéro Médecin"
                />
              </div>
              
              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='top_titre largeur_etiq_caisse'>Ajouter Service</label>
                <select
                  className="mode_paie color_vert_list"
                  onChange={handleServiceChange}
                  name="service"
                  style={{ cursor: 'pointer' }}
                >
                  {services.map((opt, key) => (
                    <option key={key} value={opt.value}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='top_titre largeur_etiq_caisse'>Assuré</label>
                <select
                  className="mode_paie color_vert_list"
                  onChange={handleChange}
                  value={formData.assure}
                  name="assure"
                >
                  {assureur.map((opt, key) => (
                    <option key={key} value={opt.value}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {servicesSelectionnes.length > 0 && (
              <div className='flex-column services-section'>
                <label className='titre_input'>Services Sélectionnés ({servicesSelectionnes.length})</label>
                <div className='services-list'>
                  {servicesSelectionnes.map((service, index) => {
                    const examensDuService = getExamensPourService(service.value);
                    const totalService = examensDuService.reduce((sum, e) => sum + e.prix, 0);
                    
                    return (
                      <div key={index} className='service-item'>
                        <div className='service-info'>
                          <span className='service-name'>{service.name}</span>
                          <span className='service-examens-count'>
                            {examensDuService.length} examen{examensDuService.length > 1 ? 's' : ''} - {totalService} FCFA
                          </span>
                        </div>
                        <div className='service-actions'>
                          <button 
                            type='button' 
                            className='btn-modifier'
                            onClick={() => ouvrirModalService(service.value)}
                          >
                            Modifier
                          </button>
                          <button 
                            type='button' 
                            className='remove-service-btn'
                            onClick={() => removeService(service.value)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className='flex-row'>
              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='top_titre largeur_etiq_caisse'>Total à Payer</label>
                <input 
                  className='userTotal__input largeur_etiq_caisse color_blue_drapeau'
                  value={formData.total_OP}
                  readOnly
                  type="number"
                  name="total_OP"
                  placeholder="Montant total"
                />
              </div>
              
              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='top_titre largeur_etiq_caisse'>Remise en %</label>
                <input 
                  className='usertel__input largeur_etiq_caisse color_jaune_drapeau'
                  value={formData.remise_OP}
                  onChange={handleChange}
                  type="number"
                  name="remise_OP"
                  placeholder="Pourcentage remise"
                />
              </div>
              
              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='top_titre largeur_etiq_caisse'>Dette</label>
                <input 
                  className='usertel__input largeur_etiq_caisse color_rouge_drapeau'
                  value={formData.dette_OP}
                  onChange={handleChange}
                  type="number"
                  name="dette_OP"
                  placeholder="Montant dette"
                />
              </div>
              
              <div className='largeur_div_tel separ_horizontal_5px top_titre'>
                <label className='top_titre largeur_etiq_caisse'>Mode Paiement</label>
                <select
                  className="mode_paie color_vert_list"
                  onChange={handleChange}
                  value={formData.mode_Paie_OP}
                  name="mode_Paie_OP"
                >
                  {options.map((opt, key) => (
                    <option key={key} value={opt.value}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedExamens.length > 0 && (
              <div className='resume-examens no-print'>
                <label className='titre_input'>Résumé des Examens Sélectionnés ({selectedExamens.length} examen{selectedExamens.length > 1 ? 's' : ''})</label>
                <div className='resume-list'>
                  {servicesSelectionnes.map((service) => {
                    const examensDuService = getExamensPourService(service.value);
                    if (examensDuService.length === 0) return null;
                    
                    const totalService = examensDuService.reduce((sum, e) => sum + e.prix, 0);
                    
                    return (
                      <div key={service.value} className='service-resume'>
                        <h4 className='service-resume-title'>
                          {service.name} ({examensDuService.length} examen{examensDuService.length > 1 ? 's' : ''})
                          <span className='service-total'>Total: {totalService} FCFA</span>
                        </h4>
                        {examensDuService.map((examen, index) => (
                          <div key={index} className='resume-item'>
                            <span className='resume-examen-name'>{examen.name}</span>
                            <span className='resume-examen-prix'>{examen.prix} FCFA</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <div className='resume-total'>
                    <strong>Total Général: {formData.total_OP} FCFA</strong>
                  </div>
                </div>
              </div>
            )}

            <div className='flex-column no-print'>
              <label className='titre_input'>Jeton Opération</label>
              <input 
                className='usertel__input color_vert_champ'
                value={formData.jeton_OP}
                readOnly
                type="text"
                name="jeton_OP"
              />
            </div>
          </form>
          
          <div className='ftt__footer BC sep no-print'>
            <button className="glow-on-hover MenuBtn" type="button" onClick={handleSubmit}>
              Enregistrer
            </button>
            <span> | </span>
            <button className="glow-on-hover MenuBtn" type="button" onClick={sirFiltre}>
              Filtre
            </button>
            <span> | </span>
            <button className="glow-on-hover MenuBtn" type="button" onClick={sirApercu}>
              Journaux
            </button>
            <span> | </span>
            <button className="glow-on-hover MenuBtn" type="button" onClick={() => window.print()}>
              Imprimer
            </button>
            <span> | </span>
            <button className="glow-on-hover MenuBtn" type="button" onClick={clearForm}>
              Nouveau
            </button>
            <span> | </span>
            <button className="glow-on-hover MenuBtn" type="button" onClick={sirAcceuil}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MG_Caisse;
