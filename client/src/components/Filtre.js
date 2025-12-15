import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import LogoCsr from './images/logo_csr.png';
import '../caisse.css';
import FiltreTable from './FiltreTable';

const Filtre = ({ socket }) => {
  const [data, setData] = useState([]);
  const [clientInfo, setClientInfo] = useState({});
  const [filterText, setFilterText] = useState('');
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Navigation
  const goToHome = () => navigate("/PageAcceuil");
  const goToPrint = () => navigate("/MgPrint");

  useEffect(() => {
    if (filterText && isSubmitted) {
      setLoading(true);
      
      // Utiliser socket pour rechercher par CSR ID
      socket.emit('rechercher_par_csr', filterText, (response) => {
        setLoading(false);
        
        if (response.success) {
          setData(response.donnees);
          
          if (response.donnees.length > 0) {
            setClientInfo(response.donnees[0]);
            setErrorMessages({});
          } else {
            setClientInfo({});
            setErrorMessages({ 
              name: "search", 
              message: `Aucun enregistrement trouvé pour le CSR ID: ${filterText}` 
            });
          }
        } else {
          setErrorMessages({ 
            name: "search", 
            message: response.message || "Erreur lors de la recherche" 
          });
        }
      });
    } else {
      setData([]);
      setClientInfo({});
      setErrorMessages({});
    }
  }, [filterText, isSubmitted, socket]);

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setFilterText(value);
    setErrorMessages({});
  };

  // Gestion de la connexion
  const handleLogin = (event) => {
    event.preventDefault();
    const { uname, pass } = event.target.elements;

    const database = [
      { username: "Chouaib", password: "SansPasse" },
      { username: "Djibrine", password: "SansPasse" },
      { username: "Labo", password: "1234" }
    ];

    const userData = database.find((user) => user.username === uname.value);

    if (userData) {
      if (userData.password !== pass.value) {
        setErrorMessages({ name: "pass", message: "Erreur sur Code d'accès" });
      } else {
        setIsSubmitted(true);
      }
    } else {
      setErrorMessages({ name: "uname", message: "Utilisateur Inconnu" });
    }
  };

  // Fonction pour générer les données à imprimer
  const handlePrint = () => {
    if (data.length === 0) {
      setErrorMessages({ 
        name: "print", 
        message: "Aucune donnée à imprimer" 
      });
      return;
    }

    // Préparer les données pour l'impression
    const printData = {
      filter: filterText,
      results: data,
      clientInfo: clientInfo,
      date: new Date().toLocaleDateString()
    };
    
    // Stocker les données dans sessionStorage pour la page d'impression
    sessionStorage.setItem('printData', JSON.stringify(printData));
    goToPrint();
  };

  const renderErrorMessage = (name) =>
    name === errorMessages.name && (
      <div className="message_erreur">{errorMessages.message}</div>
    );

  return (
    <div className="app-container">
      <div className="entete TC">
        <div className="marges_logo_5px">
          <img className='logo_clinique marges_logo_5px' src={LogoCsr} alt="Logo CSR" />
        </div>
        <div className='titre_entete'>
          <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
          <h3 className='sous_titre_entete'>Gestion de Caisse</h3>
          <h3 className='sous_titre_entete'>Filtrage des opérations par Client</h3>
        </div>
      </div>

      {!isSubmitted ? (
        <div className="form">
          <form className='form_margin BC' onSubmit={handleLogin}>
            <br />
            <br />
            <label className='sous_titre'>Utilisateur</label>
            <input 
              className='utilisateur_interne' 
              minLength={4} 
              type="text" 
              name="uname" 
              required 
            />
            {renderErrorMessage("uname")}

            <label className='sous_titre'>Code d'accès</label>
            <input 
              className='utilisateur_interne' 
              minLength={4} 
              type="password" 
              name="pass" 
              required 
            />
            {renderErrorMessage("pass")}

            <div className='ftt__footer BC'>
              <button className='home__cta'>Connexion</button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <div className='form_margin'>
            <div className='flex-row'>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label className='titre_input top_titre'>N° ID Unique</label>
                <input
                  className='userID_input color_vert_champ separ_horizontal_5px'
                  value={filterText}
                  onChange={handleFilterChange}
                  minLength={8}
                  maxLength={12}
                  type="text"
                  name="numID_CSR"
                  placeholder="ID CSR"
                  required
                  style={{ textAlign: 'center' }}
                />
                {renderErrorMessage("search")}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label className='titre_input top_titre separ_horizontal_5px'>Nom Client</label>
                <input
                  className='userID_input color_vert_champ separ_horizontal_5px'
                  value={clientInfo.nomClient || ''}
                  type="text"
                  name="nom_Client"
                  placeholder="Nom Client"
                  readOnly
                  style={{ textAlign: 'center' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label className='titre_input top_titre separ_horizontal_5px'>Num AirTel</label>
                <input
                  className='userID_input color_vert_champ separ_horizontal_5px'
                  value={clientInfo.numAirTel || ''}
                  type="text"
                  name="num_AirTel"
                  placeholder="Num AirTel"
                  readOnly
                  style={{ textAlign: 'center' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label className='titre_input top_titre separ_horizontal_5px'>Num TIGO</label>
                <input
                  className='userID_input color_vert_champ separ_horizontal_5px'
                  value={clientInfo.numTIGO || ''}
                  type="text"
                  name="Num_TIGO"
                  placeholder="Num TIGO"
                  readOnly
                  style={{ textAlign: 'center' }}
                />
              </div>
            </div>

            {loading && <div className="loading-indicator">Recherche en cours...</div>}

            {/* Afficher FiltreTable seulement s'il y a des données */}
            {!loading && data.length > 0 && (
              <FiltreTable data={data} searchTerm={filterText} />
            )}

            {/* Message si aucune donnée après recherche */}
            {!loading && filterText && data.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                Aucun résultat trouvé pour le CSR ID: {filterText}
              </div>
            )}
          </div>

          <div className='ftt__footer BC sep'>
            <button className="glow-on-hover MenuBtn" onClick={handlePrint}>
              Imprimer
            </button>
            <span> | </span>
            <button className="glow-on-hover MenuBtn" onClick={goToHome}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Filtre;