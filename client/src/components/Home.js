import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom"
import LogoCsr from './images/logo_csr.png';

const Acceuil = ({ socket }) => {
  const navigate = useNavigate()
  const [errorMessages, setErrorMessages] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showDelayedText, setShowDelayedText] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const errors = {
    uname: "Utilisateur Inconnu",
    pass: "Erreur sur Code d'accès",
    connection: "Erreur de connexion au serveur"
  };

  // FONCTION DE CONNEXION CORRIGÉE
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.target);
    const username = formData.get('uname');
    const password = formData.get('pass');

    try {
      if (!socket) {
        setErrorMessages({ name: "connection", message: errors.connection });
        setIsLoading(false);
        return;
      }

      console.log('🔐 [CLIENT] Tentative de connexion pour:', username);

      // Utiliser la vérification via le serveur
      socket.emit('verify_user_credentials', {
        username: username,
        password: password
      }, (response) => {
        setIsLoading(false);
        
        if (response && response.success) {
          if (response.isValid && response.user) {
            // Connexion réussie
            setIsSubmitted(true);
            setLoggedInUser(response.user);
            
            // Envoyer l'identification au serveur
            socket.emit('user_identification', {
              service: response.user.service,
              username: response.user.username
            });
            
            console.log('✅ [CLIENT] Connexion réussie:', response.user.username, response.user.service);
          } else {
            // Identifiants invalides
            setErrorMessages({ 
              name: "pass", 
              message: "Nom d'utilisateur ou mot de passe incorrect" 
            });
          }
        } else {
          // Erreur serveur
          setErrorMessages({ 
            name: "connection", 
            message: response?.message || errors.connection 
          });
        }
      });

    } catch (error) {
      setIsLoading(false);
      console.error('❌ [CLIENT] Erreur connexion:', error);
      setErrorMessages({ name: "connection", message: errors.connection });
    }
  };

  const renderErrorMessage = (name) =>
    name === errorMessages.name && (
      <div className="message_erreur">{errorMessages.message}</div>
    );

  function GoAcceuil() {
    if (showDelayedText && loggedInUser) {
      navigate("/PageAcceuil", { state: { user: loggedInUser } });
    }
  }

  // Afficher le texte retardé après connexion
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        setShowDelayedText(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  const renderForm = (
    <div className="form">
      <form className='form_margin BC' onSubmit={handleSubmit}>
        <br />
        <br />

        <label className='sous_titre'>Utilisateur</label>
        <input 
          className='username__input' 
          minLength={3} 
          type="text" 
          name="uname" 
          required 
          disabled={isLoading}
        />
        {renderErrorMessage("uname")}

        <label className='sous_titre'>Code d'accès</label>
        <input 
          className='username__input' 
          minLength={4} 
          type="password" 
          name="pass" 
          required 
          disabled={isLoading}
        />
        {renderErrorMessage("pass")}
        
        {renderErrorMessage("connection")}

        <label className='message_flash'>
          Rappel sur la LOI N°09-PR-2015 portant sur la cybersécurité et cybercriminalité
        </label>

        <div className='ftt__footer BC'>
          <button className='home__cta' type="submit" disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Connexion'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <div className="entete TC">
        <div className="marges_logo_5px">
          <img className='logo_clinique marges_logo_5px' src={LogoCsr} alt="Tchad" id="logo" />
        </div>
        <div className='titre_entete'>
          <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
          <h3 className='sous_titre_entete'>GesCAB V1.0 (c) 2025</h3>
        </div>
      </div>

      <div className='ftt__footer BC'>
        {isSubmitted ? (
          <div>
            <br />
            <label className='texte_connexion'>
              Connexion à la plate-forme Clinique Spécialisée la Référence
            </label>
            <br />
            <label className='message_alerte'>
              Veuillez rester vigilant quand vous manipulez des ressources à distance
            </label>
            <br />
            {loggedInUser && (
              <div className="user-info-confirmation">
                <label className='user-welcome'>
                  ✅ Bienvenue, <strong>{loggedInUser.username}</strong> 
                  <br />
                  Service: <strong>{loggedInUser.service}</strong>
                </label>
              </div>
            )}
            <br />
            <br />
            <button className='home__cta' onClick={GoAcceuil}>
              {showDelayedText ? 'Accéder à la plateforme' : 'Vérification...'}
            </button>
            <br />
            <br />
            <label className='message_flash'>
              Rappel sur la LOI N°09-PR-2015 portant sur la cybersécurité et cybercriminalité
            </label>
          </div>
        ) : renderForm}
      </div>
    </>
  )
}

export default Acceuil;
