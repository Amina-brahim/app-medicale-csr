import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from "react-router-dom"
import LogoCsr from './images/logo_csr.png';

const Administration = ({ socket }) => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [activePatients, setActivePatients] = useState([])
  const [connectedUsers, setConnectedUsers] = useState({})
  
  // États pour la recherche et l'affichage tableau
  const [searchDate, setSearchDate] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  
  // États pour la gestion du tableau
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // États pour la gestion des examens
  const [showAddExamModal, setShowAddExamModal] = useState(false)
  const [showManageExamModal, setShowManageExamModal] = useState(false)
  const [newExam, setNewExam] = useState({
    service: '',
    examName: '',
    examPrice: ''
  })
  const [examMessage, setExamMessage] = useState('')

  // États pour la gestion des examens (modification/suppression)
  const [manageExamAction, setManageExamAction] = useState('') // 'modify' ou 'delete'
  const [selectedService, setSelectedService] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [examensParService, setExamensParService] = useState({})
  const [modifiedExam, setModifiedExam] = useState({
    name: '',
    prix: ''
  })

  // États pour l'annulation de paiement
  const [showCancelPaymentModal, setShowCancelPaymentModal] = useState(false)
  const [cancelPaymentData, setCancelPaymentData] = useState({
    patientId: '',
    patientName: '',
    amount: 0,
    services: [],
    paymentDate: '',
    reason: ''
  })
  const [cancelPaymentMessage, setCancelPaymentMessage] = useState('')

  // ÉTATS POUR LA GESTION DES UTILISATEURS
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [usersList, setUsersList] = useState([])
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userMessage, setUserMessage] = useState('')
  const [availableServicesForUsers, setAvailableServicesForUsers] = useState([])
  
  // NOUVEL ÉTAT POUR LES UTILISATEURS CONNECTÉS DÉTAILLÉS
  const [connectedUsersDetailed, setConnectedUsersDetailed] = useState({})
  
  // État pour le nouvel utilisateur - SIMPLIFIÉ
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    service: ''
  })

  // État pour l'utilisateur en cours d'édition - SIMPLIFIÉ
  const [editingUser, setEditingUser] = useState({
    id: '',
    username: '',
    password: '',
    confirmPassword: '',
    service: ''
  })

  // Services disponibles pour les examens
  const servicesConfiguration = {
    consultation: "Consultation",
    laboratoire: "Laboratoire", 
    echographie: "Echographie",
    hospitalisation: "Hospitalisation",
    chirurgie: "Chirurgie",
    kinesitherapie: "Kinésithérapie",
    fibroscopie: "Fibroscopie"
  }

  // Identifiants d'administration
  const adminCredentials = {
    username: 'admin',
    password: 'admin123'
  }

  // AJOUT: Écouteur pour les mises à jour des utilisateurs connectés
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // Écouter les mises à jour des utilisateurs connectés
    const handleUsersListUpdated = (data) => {
      console.log('👥 Liste utilisateurs mise à jour:', data);
      setUsersList(data.users || []);
      setConnectedUsersDetailed(data.connectedUsers || {});
    };

    const handleUserConnected = (data) => {
      console.log('✅ Utilisateur connecté:', data);
      setConnectedUsersDetailed(data.connectedUsers || {});
    };

    const handleUserDisconnected = (data) => {
      console.log('❌ Utilisateur déconnecté:', data);
      setConnectedUsersDetailed(data.connectedUsers || {});
    };

    socket.on('users_list_updated', handleUsersListUpdated);
    socket.on('user_connected', handleUserConnected);
    socket.on('user_disconnected', handleUserDisconnected);

    // Charger les utilisateurs connectés au démarrage
    socket.emit('get_connected_users_detailed', (response) => {
      if (response && response.success) {
        setConnectedUsersDetailed(response.connectedUsers || {});
      }
    });

    return () => {
      socket.off('users_list_updated', handleUsersListUpdated);
      socket.off('user_connected', handleUserConnected);
      socket.off('user_disconnected', handleUserDisconnected);
    };
  }, [socket, isAuthenticated]);

  // AJOUT: Écouteur pour les annulations de paiement en temps réel
  useEffect(() => {
    if (!socket) return;

    // Écouter les annulations de paiement effectuées par d'autres administrateurs
    const handlePaymentCancelled = (data) => {
      console.log('💰 [CLIENT] Annulation de paiement reçue:', data);
      
      // Mettre à jour la liste des patients en supprimant le patient annulé
      setActivePatients(prev => 
        prev.filter(p => p.numID_CSR !== data.patientId)
      );
      setSearchResults(prev => 
        prev.filter(p => p.numID_CSR !== data.patientId)
      );
      
      // Afficher une notification
      alert(`✅ Paiement annulé: ${data.patientName} - ${data.amount} FCFA\nMotif: ${data.reason}`);
    };

    // Écouter les suppressions de patients
    const handlePatientDeleted = (data) => {
      console.log('🗑️ [CLIENT] Patient supprimé reçu:', data);
      
      // Mettre à jour les listes
      setActivePatients(prev => 
        prev.filter(p => p.numID_CSR !== data.patientId)
      );
      setSearchResults(prev => 
        prev.filter(p => p.numID_CSR !== data.patientId)
      );
    };

    socket.on('payment_cancelled', handlePaymentCancelled);
    socket.on('patient_deleted', handlePatientDeleted);

    return () => {
      socket.off('payment_cancelled', handlePaymentCancelled);
      socket.off('patient_deleted', handlePatientDeleted);
    };
  }, [socket]);

  // AJOUT: Écouteur pour les résultats d'annulation de paiement
  useEffect(() => {
    if (!socket) return;

    const handleCancelPaymentResult = (data) => {
      console.log('💰 [CLIENT] Résultat annulation paiement:', data);
      
      if (data.success) {
        // La mise à jour des listes est déjà gérée par l'écouteur ci-dessus
        console.log('✅ Annulation traitée avec succès');
      } else {
        console.error('❌ Erreur lors de l\'annulation:', data.message);
      }
    };

    socket.on('cancel_payment_result', handleCancelPaymentResult);

    return () => {
      socket.off('cancel_payment_result', handleCancelPaymentResult);
    };
  }, [socket]);

  // CORRECTION: Initialiser les services disponibles depuis le serveur
  useEffect(() => {
    if (isAuthenticated && socket) {
      // Charger les services disponibles depuis le serveur
      socket.emit('get_users_list', (response) => {
        if (response && response.success) {
          console.log('✅ Services disponibles chargés:', response.services);
          setAvailableServicesForUsers(response.services || []);
        }
      });
      
      // Charger la configuration des examens
      loadExamensConfig();
    }
  }, [isAuthenticated, socket]);

  // Charger la configuration des examens
  const loadExamensConfig = () => {
    if (!socket) return;
    
    socket.emit('get_examens_config', (response) => {
      if (response && response.success) {
        console.log('✅ Configuration des examens chargée:', response.examensConfig);
        setExamensParService(response.examensConfig);
      } else {
        console.error('❌ Erreur chargement configuration examens:', response?.message);
      }
    });
  };

  // Écouteur pour les mises à jour de la configuration des examens
  useEffect(() => {
    if (!socket) return;

    const handleExamensConfigUpdated = (newConfig) => {
      console.log('🔄 Configuration des examens mise à jour reçue:', newConfig);
      setExamensParService(newConfig);
    };

    socket.on('examens_config_updated', handleExamensConfigUpdated);

    return () => {
      socket.off('examens_config_updated', handleExamensConfigUpdated);
    };
  }, [socket]);

  // Écouteur pour les résultats d'ajout d'examen
  useEffect(() => {
    if (!socket) return;

    const handleAddExamResult = (data) => {
      console.log('🔧 [CLIENT] Résultat ajout examen:', data);
      setExamMessage(data.message || 'Opération terminée');
      
      if (data.success) {
        setNewExam({ service: '', examName: '', examPrice: '' });
        // Fermer la modale après un délai
        setTimeout(() => {
          setShowAddExamModal(false);
          setExamMessage('');
        }, 2000);
      }
    };

    socket.on('add_exam_result', handleAddExamResult);

    return () => {
      socket.off('add_exam_result', handleAddExamResult);
    };
  }, [socket]);

  // FONCTIONS POUR LA GESTION DES UTILISATEURS - SIMPLIFIÉES

  // Charger la liste des utilisateurs
  const loadUsersList = useCallback(() => {
    if (!socket) return;
    
    console.log('🔄 Chargement de la liste des utilisateurs...');
    
    socket.emit('get_users_list', (response) => {
      if (response && response.success) {
        console.log('✅ Liste des utilisateurs chargée:', response.users);
        console.log('📋 Services disponibles:', response.services);
        
        setUsersList(response.users);
        setAvailableServicesForUsers(response.services || []);
        
        // Debug: afficher tous les utilisateurs
        response.users.forEach(user => {
          console.log(`👤 ${user.username} - ${user.service} - Actif: ${user.isActive}`);
        });
      } else {
        console.error('❌ Erreur chargement utilisateurs:', response?.message);
        setUserMessage('❌ Erreur lors du chargement des utilisateurs: ' + (response?.message || 'Erreur inconnue'));
      }
    });

    // Charger aussi les utilisateurs connectés détaillés
    socket.emit('get_connected_users_detailed', (response) => {
      if (response && response.success) {
        setConnectedUsersDetailed(response.connectedUsers || {});
      }
    });
  }, [socket]);

  // Fonction pour compter le nombre total d'utilisateurs connectés
  const getTotalConnectedUsers = () => {
    let total = 0;
    Object.values(connectedUsersDetailed).forEach(users => {
      total += users.length;
    });
    return total;
  };

  // Fonction pour formater la date de dernière connexion
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin || lastLogin === 'N/A' || lastLogin === 'null') return 'Jamais connecté';
    
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffMs = now - loginDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return loginDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour obtenir le statut de connexion d'un utilisateur
  const getUserConnectionStatus = (user) => {
    const isConnected = Object.values(connectedUsersDetailed).some(serviceUsers => 
      serviceUsers.some(connectedUser => connectedUser.username === user.username)
    );
    
    return isConnected ? '🟢 En ligne' : '⚫ Hors ligne';
  };

  // Ouvrir la modale d'ajout d'utilisateur
  const openAddUserModal = () => {
    setNewUser({
      username: '',
      password: '',
      confirmPassword: '',
      service: ''
    });
    setShowAddUserModal(true);
    setUserMessage('');
  };

  // Ouvrir la modale de modification d'utilisateur
  const openEditUserModal = (user) => {
    setEditingUser({
      id: user.id,
      username: user.username,
      password: '',
      confirmPassword: '',
      service: user.service
    });
    setShowEditUserModal(true);
    setUserMessage('');
  };

  // Ouvrir la modale de suppression d'utilisateur
  const openDeleteUserModal = (user) => {
    setSelectedUser(user);
    setShowDeleteUserModal(true);
    setUserMessage('');
  };

  // CORRECTION: Fonction pour tester la connexion avec un nouvel utilisateur
  const testUserConnection = (username, password) => {
    if (!socket) return;
    
    console.log('🧪 Test de connexion pour:', username);
    
    socket.emit('verify_user_credentials', {
      username: username,
      password: password
    }, (response) => {
      if (response && response.success) {
        if (response.isValid) {
          console.log('✅ Test réussi: utilisateur peut se connecter');
          alert(`✅ Test réussi! L'utilisateur "${username}" peut se connecter.`);
        } else {
          console.log('❌ Test échoué: utilisateur non reconnu');
          alert(`❌ Échec du test! L'utilisateur "${username}" n'est pas reconnu.`);
        }
      } else {
        console.log('❌ Erreur lors du test:', response?.message);
      }
    });
  };

  // CORRECTION: Ajouter un nouvel utilisateur - SIMPLIFIÉ
  const handleAddUser = (e) => {
    e.preventDefault();
    
    console.log('🔄 Tentative d\'ajout utilisateur:', newUser);
    
    // Validation des données
    if (!newUser.username || !newUser.password || !newUser.service) {
      setUserMessage('❌ Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setUserMessage('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (newUser.password.length < 4) {
      setUserMessage('❌ Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    setUserMessage('⏳ Création de l\'utilisateur en cours...');
    
    if (socket) {
      const userData = {
        username: newUser.username.trim(),
        password: newUser.password,
        service: newUser.service,
        adminUsername: 'admin'
      };

      console.log('📤 Envoi des données utilisateur:', userData);

      socket.emit('add_new_user', userData, (response) => {
        console.log('📥 Réponse ajout utilisateur:', response);
        
        if (response && response.success) {
          setUserMessage('✅ Utilisateur créé avec succès!');
          
          // Recharger la liste des utilisateurs
          loadUsersList();
          
          // Tester immédiatement la connexion
          setTimeout(() => {
            testUserConnection(newUser.username, newUser.password);
          }, 1000);
          
          // Réinitialiser le formulaire
          setNewUser({
            username: '',
            password: '',
            confirmPassword: '',
            service: ''
          });
          
          // Fermer la modale après un délai
          setTimeout(() => {
            setShowAddUserModal(false);
            setUserMessage('');
          }, 2000);
        } else {
          setUserMessage(`❌ Erreur: ${response?.message || 'Erreur inconnue'}`);
        }
      });
    } else {
      setUserMessage('❌ Connexion au serveur non disponible');
    }
  };

  // Modifier un utilisateur - SIMPLIFIÉ
  const handleEditUser = (e) => {
    e.preventDefault();
    
    // Validation des données
    if (!editingUser.username || !editingUser.service) {
      setUserMessage('❌ Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (editingUser.password && editingUser.password !== editingUser.confirmPassword) {
      setUserMessage('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (editingUser.password && editingUser.password.length < 4) {
      setUserMessage('❌ Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    setUserMessage('⏳ Modification de l\'utilisateur en cours...');
    
    if (socket) {
      const userData = {
        userId: editingUser.id,
        username: editingUser.username.trim(),
        service: editingUser.service,
        adminUsername: 'admin'
      };

      // Incluer le mot de passe seulement s'il a été modifié
      if (editingUser.password) {
        userData.password = editingUser.password;
      }

      socket.emit('modify_user', userData, (response) => {
        if (response && response.success) {
          setUserMessage('✅ Utilisateur modifié avec succès!');
          loadUsersList();
          setTimeout(() => {
            setShowEditUserModal(false);
            setUserMessage('');
          }, 2000);
        } else {
          setUserMessage(`❌ Erreur: ${response?.message || 'Erreur inconnue'}`);
        }
      });
    } else {
      setUserMessage('❌ Connexion au serveur non disponible');
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = () => {
    if (!selectedUser) return;

    setUserMessage('⏳ Suppression de l\'utilisateur en cours...');
    
    if (socket) {
      socket.emit('delete_user', {
        userId: selectedUser.id,
        adminUsername: 'admin'
      }, (response) => {
        if (response && response.success) {
          setUserMessage('✅ Utilisateur supprimé avec succès!');
          loadUsersList();
          setTimeout(() => {
            setShowDeleteUserModal(false);
            setUserMessage('');
            setSelectedUser(null);
          }, 2000);
        } else {
          setUserMessage(`❌ Erreur: ${response?.message || 'Erreur inconnue'}`);
        }
      });
    } else {
      setUserMessage('❌ Connexion au serveur non disponible');
    }
  };

  // Gérer le changement de service
  const handleServiceChange = (service, isNewUser = true) => {
    if (isNewUser) {
      setNewUser(prev => ({
        ...prev,
        service: service
      }));
    } else {
      setEditingUser(prev => ({
        ...prev,
        service: service
      }));
    }
  };

  // Basculer l'affichage de la gestion des utilisateurs
  const toggleUserManagement = () => {
    setShowUserManagement(!showUserManagement);
    if (!showUserManagement) {
      loadUsersList();
    }
  };

  // Formater la date pour les utilisateurs
  const formatUserDate = (dateString) => {
    if (!dateString || dateString === 'null') return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir le statut de l'utilisateur
  const getUserStatus = (user) => {
    return user.isActive ? '🟢 Actif' : '🔴 Inactif';
  };

  // Fonction pour ouvrir la modale d'annulation de paiement
  const openCancelPaymentModal = (patient) => {
    if (!patient || !patient.numID_CSR) {
      setCancelPaymentMessage('❌ Patient invalide');
      return;
    }

    setCancelPaymentData({
      patientId: patient.numID_CSR,
      patientName: patient.nomClient || 'Nom non disponible',
      amount: patient.total_OP || 0,
      services: patient.servicesDetails || [],
      paymentDate: patient.dateCreation || new Date().toISOString(),
      reason: ''
    });
    setShowCancelPaymentModal(true);
    setCancelPaymentMessage('');
  };

  // Fonction pour annuler le paiement
  const handleCancelPayment = (e) => {
    e.preventDefault();
    
    if (!cancelPaymentData.patientId || !cancelPaymentData.reason.trim()) {
      setCancelPaymentMessage('❌ Veuillez saisir un motif d\'annulation');
      return;
    }

    setCancelPaymentMessage('⏳ Annulation du paiement en cours...');
    
    if (socket) {
      socket.emit('cancel_patient_payment', {
        patientId: cancelPaymentData.patientId,
        patientName: cancelPaymentData.patientName,
        amount: cancelPaymentData.amount,
        services: cancelPaymentData.services,
        paymentDate: cancelPaymentData.paymentDate,
        reason: cancelPaymentData.reason.trim(),
        cancelledBy: 'admin',
        timestamp: new Date().toISOString()
      }, (response) => {
        if (response && response.success) {
          setCancelPaymentMessage('✅ Paiement annulé avec succès!');
          
          // Mettre à jour la liste des patients
          setActivePatients(prev => 
            prev.filter(p => p.numID_CSR !== cancelPaymentData.patientId)
          );
          setSearchResults(prev => 
            prev.filter(p => p.numID_CSR !== cancelPaymentData.patientId)
          );
          
          // Fermer la modale après un délai
          setTimeout(() => {
            setShowCancelPaymentModal(false);
            setCancelPaymentMessage('');
            setCancelPaymentData({
              patientId: '',
              patientName: '',
              amount: 0,
              services: [],
              paymentDate: '',
              reason: ''
            });
          }, 2000);
        } else {
          setCancelPaymentMessage(`❌ Erreur: ${response?.message || 'Erreur lors de l\'annulation'}`);
        }
      });
    } else {
      setCancelPaymentMessage('❌ Connexion au serveur non disponible');
    }
  };

  // Fonction pour rechercher un patient par ID CSR pour annulation
  const searchPatientForCancellation = () => {
    const patientId = prompt('Entrez l\'ID CSR du patient dont vous voulez annuler le paiement:');
    if (!patientId) return;

    if (socket) {
      socket.emit('get_patient_by_csr', patientId, (response) => {
        if (response && response.success && response.patient) {
          openCancelPaymentModal(response.patient);
        } else {
          alert('❌ Patient non trouvé. Vérifiez l\'ID CSR.');
        }
      });
    } else {
      alert('❌ Connexion au serveur non disponible');
    }
  };

  // AJOUT: Fonction pour voir l'historique des annulations
  const viewCancellationHistory = () => {
    if (socket) {
      socket.emit('get_cancellation_history', (response) => {
        if (response && response.success) {
          const history = response.history || [];
          if (history.length === 0) {
            alert('📊 Aucune annulation enregistrée dans l\'historique.');
            return;
          }
          
          // Afficher l'historique dans une alerte formatée
          const historyText = history.slice(0, 10).map((annulation, index) => 
            `\n${index + 1}. ${annulation.patientName} (${annulation.patientId})\n   Montant: ${annulation.amount} FCFA\n   Motif: ${annulation.reason}\n   Date: ${formatDate(annulation.timestamp)}\n   ─────────────────────`
          ).join('');
          
          alert(`📊 HISTORIQUE DES ANNULATIONS (10 dernières):${historyText}\n\nTotal: ${history.length} annulation(s)`);
        } else {
          alert('❌ Erreur lors du chargement de l\'historique.');
        }
      });
    } else {
      alert('❌ Connexion au serveur non disponible');
    }
  };

  // Fonction pour ajouter un nouvel examen
  const handleAddExam = (e) => {
    e.preventDefault();
    
    // Validation des données
    if (!newExam.service || !newExam.examName || !newExam.examPrice) {
      setExamMessage('❌ Tous les champs sont obligatoires');
      return;
    }

    const price = parseFloat(newExam.examPrice);
    if (isNaN(price) || price <= 0) {
      setExamMessage('❌ Le prix doit être un nombre positif');
      return;
    }

    setExamMessage('⏳ Ajout de l\'examen en cours...');
    
    // Émettre l'événement au serveur
    if (socket) {
      console.log('🔧 [CLIENT] Emission add_new_exam:', newExam);
      socket.emit('add_new_exam', {
        service: newExam.service,
        examName: newExam.examName.trim(),
        examPrice: price,
        username: 'admin',
        timestamp: new Date().toISOString()
      }, (response) => {
        console.log('🔧 [CLIENT] Réponse add_new_exam:', response);
        if (response && response.success) {
          setExamMessage('✅ Examen ajouté avec succès!');
          setNewExam({ service: '', examName: '', examPrice: '' });
          
          // Fermer la modale après un délai
          setTimeout(() => {
            setShowAddExamModal(false);
            setExamMessage('');
          }, 2000);
        } else {
          setExamMessage(`❌ Erreur: ${response?.message || 'Erreur inconnue'}`);
        }
      });
    } else {
      setExamMessage('❌ Connexion au serveur non disponible');
    }
  };

  // Fonction pour modifier un examen
  const handleModifyExam = (e) => {
    e.preventDefault();
    
    if (!selectedService || !selectedExam) {
      setExamMessage('❌ Veuillez sélectionner un service et un examen');
      return;
    }

    if (!modifiedExam.name || !modifiedExam.prix) {
      setExamMessage('❌ Le nom et le prix sont obligatoires');
      return;
    }

    const price = parseFloat(modifiedExam.prix);
    if (isNaN(price) || price <= 0) {
      setExamMessage('❌ Le prix doit être un nombre positif');
      return;
    }

    setExamMessage('⏳ Modification de l\'examen en cours...');
    
    if (socket) {
      socket.emit('modify_exam', {
        service: selectedService,
        examId: selectedExam,
        newName: modifiedExam.name.trim(),
        newPrice: price,
        username: 'admin',
        timestamp: new Date().toISOString()
      }, (response) => {
        if (response && response.success) {
          setExamMessage('✅ Examen modifié avec succès!');
          resetManageExamModal();
          setTimeout(() => {
            setShowManageExamModal(false);
            setExamMessage('');
          }, 2000);
        } else {
          setExamMessage(`❌ Erreur: ${response?.message || 'Erreur inconnue'}`);
        }
      });
    } else {
      setExamMessage('❌ Connexion au serveur non disponible');
    }
  };

  // Fonction pour supprimer un examen
  const handleDeleteExam = () => {
    if (!selectedService || !selectedExam) {
      setExamMessage('❌ Veuillez sélectionner un service et un examen');
      return;
    }

    const exam = examensParService[selectedService]?.find(e => e.id === selectedExam);
    if (!exam) {
      setExamMessage('❌ Examen non trouvé');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'examen "${exam.name}" ? Cette action est irréversible.`)) {
      return;
    }

    setExamMessage('⏳ Suppression de l\'examen en cours...');
    
    if (socket) {
      socket.emit('delete_exam', {
        service: selectedService,
        examId: selectedExam,
        username: 'admin',
        timestamp: new Date().toISOString()
      }, (response) => {
        if (response && response.success) {
          setExamMessage('✅ Examen supprimé avec succès!');
          resetManageExamModal();
          setTimeout(() => {
            setShowManageExamModal(false);
            setExamMessage('');
          }, 2000);
        } else {
          setExamMessage(`❌ Erreur: ${response?.message || 'Erreur inconnue'}`);
        }
      });
    } else {
      setExamMessage('❌ Connexion au serveur non disponible');
    }
  };

  // Réinitialiser la modale de gestion des examens
  const resetManageExamModal = () => {
    setSelectedService('');
    setSelectedExam('');
    setModifiedExam({ name: '', prix: '' });
    setManageExamAction('');
  };

  // Ouvrir la modale de gestion des examens
  const openManageExamModal = (action) => {
    setManageExamAction(action);
    setShowManageExamModal(true);
    setExamMessage('');
    loadExamensConfig();
  };

  // Quand un service est sélectionné dans la modale de gestion
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedExam('');
    setModifiedExam({ name: '', prix: '' });
  };

  // Quand un examen est sélectionné dans la modale de gestion
  const handleExamSelect = (examId) => {
    setSelectedExam(examId);
    const exam = examensParService[selectedService]?.find(e => e.id === examId);
    if (exam && manageExamAction === 'modify') {
      setModifiedExam({
        name: exam.name,
        prix: exam.prix.toString()
      });
    }
  };

  // Obtenir les examens du service sélectionné
  const getExamensForSelectedService = () => {
    return examensParService[selectedService] || [];
  };

  // Obtenir l'examen sélectionné
  const getSelectedExam = () => {
    return examensParService[selectedService]?.find(e => e.id === selectedExam);
  };

  // Fonction de connexion
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === adminCredentials.username && password === adminCredentials.password) {
      setError('');
      if (socket) {
        socket.emit('admin_login', { 
          username: username, 
          password: password,
          timestamp: new Date().toISOString() 
        }, (response) => {
          console.log('🔑 [CLIENT] Réponse login:', response);
          if (response && response.success) {
            setIsAuthenticated(true);
          } else {
            setError(response?.message || 'Erreur de connexion au serveur');
          }
        });
      } else {
        setError('Connexion au serveur non disponible');
      }
    } else {
      setError('Nom d\'utilisateur ou mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setSearchDate('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchMessage('');
    setSearchTerm('');
    setCurrentPage(1);
    if (socket) {
      socket.emit('admin_logout', { username: 'admin', timestamp: new Date().toISOString() });
    }
  };

  const goBack = () => {
    navigate("/");
  };

  // Écouteur pour les résultats de recherche
  useEffect(() => {
    if (!socket) return;

    const handleSearchResult = (data) => {
      console.log('🔍 [CLIENT] Résultat recherche reçu:', data);
      setIsSearching(false);
      
      if (data.success) {
        setSearchResults(data.patients || []);
        setSearchMessage(data.message || `${data.patients?.length || 0} patient(s) trouvé(s)`);
      } else {
        setSearchResults([]);
        setSearchMessage('Erreur: ' + (data.message || 'Recherche échouée'));
      }
    };

    socket.on('search_patients_result', handleSearchResult);

    return () => {
      socket.off('search_patients_result', handleSearchResult);
    };
  }, [socket]);

  // Écouteur pour les données des patients
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // Écouter les nouveaux patients
    socket.on('nouveau_patient', (patientData) => {
      setActivePatients(prev => {
        const existingIndex = prev.findIndex(p => p.numID_CSR === patientData.numID_CSR);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = { ...patientData, lastUpdate: new Date().toISOString() };
          return updated;
        } else {
          return [...prev, { ...patientData, lastUpdate: new Date().toISOString() }];
        }
      });
    });

    // Écouter les mises à jour de statut
    socket.on('Etat Analyses Mis à Jour', (patientData) => {
      setActivePatients(prev => {
        const existingIndex = prev.findIndex(p => p.numID_CSR === patientData.numID_CSR);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = { 
            ...patientData, 
            lastUpdate: new Date().toISOString() 
          };
          return updated;
        }
        return prev;
      });
    });

    // Récupérer les données initiales
    socket.emit('recuperer_donnees', (response) => {
      if (response && response.success) {
        setActivePatients(response.donnees.map(patient => ({
          ...patient,
          lastUpdate: patient.dateModification || patient.dateCreation
        })));
      }
    });

    // Récupérer les utilisateurs connectés
    socket.emit('get_connected_users', (response) => {
      if (response && response.success) {
        setConnectedUsers(response.connectedUsers);
      }
    });

    return () => {
      socket.off('nouveau_patient');
      socket.off('Etat Analyses Mis à Jour');
    };
  }, [socket, isAuthenticated]);

  // Données à afficher (patients normaux ou résultats de recherche)
  const displayData = useMemo(() => {
    return searchResults.length > 0 ? searchResults : activePatients;
  }, [searchResults, activePatients]);

  // Données filtrées et triées
  const filteredAndSortedData = useMemo(() => {
    let filtered = displayData;
    
    // Filtrage par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.nomClient?.toLowerCase().includes(term) ||
        patient.numID_CSR?.toLowerCase().includes(term) ||
        patient.numClient?.toString().includes(term) ||
        patient.isLaboratorized?.toLowerCase().includes(term)
      );
    }
    
    // Tri
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'dateCreation' || sortConfig.key === 'lastUpdate') {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [displayData, searchTerm, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  // Gestion du tri
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  // Gestion de la recherche par date
  const searchPatientsByDate = () => {
    if (!searchDate) {
      alert('Veuillez sélectionner une date');
      return;
    }

    setIsSearching(true);
    setSearchMessage('Recherche en cours...');
    setCurrentPage(1);
    
    if (socket) {
      socket.emit('search_patients_by_date', { 
        date: searchDate,
        username: 'admin'
      }, (response) => {
        setIsSearching(false);
        if (response && response.success) {
          setSearchResults(response.patients || []);
          setSearchMessage(response.message || `${response.patients?.length || 0} patient(s) trouvé(s)`);
        } else {
          setSearchResults([]);
          setSearchMessage(response?.message || 'Erreur lors de la recherche');
        }
      });
    }
  };

  const resetSearch = () => {
    setSearchDate('');
    setSearchResults([]);
    setIsSearching(false);
    setSearchMessage('');
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-badge status-en-attente';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('attente')) return 'status-badge status-en-attente';
    if (statusLower.includes('cours')) return 'status-badge status-en-cours';
    if (statusLower.includes('termine') || statusLower.includes('terminé')) return 'status-badge status-termine';
    if (statusLower.includes('annule') || statusLower.includes('annulé')) return 'status-badge status-annule';
    return 'status-badge status-en-attente';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Affichage de la page de connexion
  if (!isAuthenticated) {
    return (
      <>
        <div className="entete TC">
          <div className="marges_logo_5px">
            <img className='logo_clinique marges_logo_5px' src={LogoCsr} alt="Tchad" id="logoIred" />
          </div>
          <div className='titre_entete'>
            <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
            <h3 className='sous_titre_entete'>Administration - Connexion</h3>
          </div>
        </div>

        <div className="form_margin">
          <div className="login-container">
            <h3 className="titre_noir">Connexion Administration</h3>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Nom d'utilisateur:</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="form-input"
                  placeholder="admin"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Mot de passe:</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="admin123"
                />
              </div>
              {error && <div className="error-message">{error}</div>}
             
              <div className="form-buttons">
                <button type="submit" className="glow-on-hover_MGAcceuil MenuBtn">
                  Se connecter
                </button>
                <button type="button" onClick={goBack} className="glow-on-hover_MGAcceuil MenuBtn secondary">
                  Retour
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Affichage du tableau de bord administrateur
  return (
    <>
      <div className="entete TC">
        <div className="marges_logo_5px">
          <img className='logo_clinique marges_logo_5px' src={LogoCsr} alt="Tchad" id="logoIred" />
        </div>
        <div className='titre_entete'>
          <h2 className='titre_entete'>CSR - N'Djamena - TCHAD</h2>
          <h3 className='sous_titre_entete'>Tableau de Bord Administration</h3>
        </div>
        <div className="admin-header-actions">
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        </div>
      </div>

      {/* Modale d'ajout d'examen */}
      {showAddExamModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>➕ Ajouter un Nouvel Examen</h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowAddExamModal(false);
                  setNewExam({ service: '', examName: '', examPrice: '' });
                  setExamMessage('');
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddExam}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="titre_input">Service:</label>
                  <select
                    className="form-input"
                    value={newExam.service}
                    onChange={(e) => setNewExam(prev => ({ ...prev, service: e.target.value }))}
                    required
                  >
                    <option value="">Sélectionner un service</option>
                    {Object.keys(servicesConfiguration).map(key => (
                      <option key={key} value={key}>
                        {servicesConfiguration[key]}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="titre_input">Nom de l'examen:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newExam.examName}
                    onChange={(e) => setNewExam(prev => ({ ...prev, examName: e.target.value }))}
                    placeholder="Ex: Radiographie pulmonaire"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="titre_input">Prix (FCFA):</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newExam.examPrice}
                    onChange={(e) => setNewExam(prev => ({ ...prev, examPrice: e.target.value }))}
                    placeholder="Ex: 15000"
                    min="0"
                    step="100"
                    required
                  />
                </div>

                {examMessage && (
                  <div className={`exam-message ${
                    examMessage.includes('❌') ? 'error' : 
                    examMessage.includes('✅') ? 'success' : 'info'
                  }`}>
                    {examMessage}
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddExamModal(false);
                    setNewExam({ service: '', examName: '', examPrice: '' });
                    setExamMessage('');
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  ✅ Ajouter l'Examen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de gestion des examens (modification/suppression) */}
      {showManageExamModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {manageExamAction === 'modify' ? '✏️ Modifier un Examen' : '🗑️ Supprimer un Examen'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowManageExamModal(false);
                  resetManageExamModal();
                  setExamMessage('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {/* Sélection du service */}
              <div className="form-group">
                <label className="titre_input">Service:</label>
                <select
                  className="form-input"
                  value={selectedService}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un service</option>
                  {Object.keys(servicesConfiguration).map(key => (
                    <option key={key} value={key}>
                      {servicesConfiguration[key]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection de l'examen */}
              {selectedService && (
                <div className="form-group">
                  <label className="titre_input">Examen:</label>
                  <select
                    className="form-input"
                    value={selectedExam}
                    onChange={(e) => handleExamSelect(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner un examen</option>
                    {getExamensForSelectedService().map(examen => (
                      <option key={examen.id} value={examen.id}>
                        {examen.name} - {examen.prix} FCFA
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Formulaire de modification */}
              {manageExamAction === 'modify' && selectedExam && (
                <div className="modify-form">
                  <div className="form-group">
                    <label className="titre_input">Nouveau nom:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={modifiedExam.name}
                      onChange={(e) => setModifiedExam(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nouveau nom de l'examen"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="titre_input">Nouveau prix (FCFA):</label>
                    <input
                      type="number"
                      className="form-input"
                      value={modifiedExam.prix}
                      onChange={(e) => setModifiedExam(prev => ({ ...prev, prix: e.target.value }))}
                      placeholder="Nouveau prix"
                      min="0"
                      step="100"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Confirmation de suppression */}
              {manageExamAction === 'delete' && selectedExam && (
                <div className="delete-confirmation">
                  <div className="warning-message">
                    ⚠️ Vous êtes sur le point de supprimer l'examen :
                  </div>
                  <div className="exam-to-delete">
                    <strong>{getSelectedExam()?.name}</strong> - {getSelectedExam()?.prix} FCFA
                  </div>
                  <div className="warning-text">
                    Cette action est irréversible. Voulez-vous vraiment continuer ?
                  </div>
                </div>
              )}

              {examMessage && (
                <div className={`exam-message ${
                  examMessage.includes('❌') ? 'error' : 
                  examMessage.includes('✅') ? 'success' : 'info'
                }`}>
                  {examMessage}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setShowManageExamModal(false);
                  resetManageExamModal();
                  setExamMessage('');
                }}
              >
                Annuler
              </button>
              
              {manageExamAction === 'modify' && selectedExam ? (
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleModifyExam}
                  disabled={!modifiedExam.name || !modifiedExam.prix}
                >
                  ✅ Modifier l'Examen
                </button>
              ) : manageExamAction === 'delete' && selectedExam ? (
                <button 
                  type="button" 
                  className="btn-danger"
                  onClick={handleDeleteExam}
                >
                  🗑️ Supprimer l'Examen
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Modale d'annulation de paiement */}
      {showCancelPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>💰 Annulation de Paiement</h3>
              <button 
                className="modal-close" 
                onClick={() => {
                  setShowCancelPaymentModal(false);
                  setCancelPaymentData({
                    patientId: '',
                    patientName: '',
                    amount: 0,
                    services: [],
                    paymentDate: '',
                    reason: ''
                  });
                  setCancelPaymentMessage('');
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCancelPayment}>
              <div className="modal-body">
                <div className="patient-cancellation-info">
                  <h4>Informations du Patient</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>ID CSR:</label>
                      <span>{cancelPaymentData.patientId}</span>
                    </div>
                    <div className="info-item">
                      <label>Nom:</label>
                      <span>{cancelPaymentData.patientName}</span>
                    </div>
                    <div className="info-item">
                      <label>Montant payé:</label>
                      <span>{cancelPaymentData.amount} FCFA</span>
                    </div>
                    <div className="info-item">
                      <label>Date paiement:</label>
                      <span>{formatDate(cancelPaymentData.paymentDate)}</span>
                    </div>
                  </div>
                </div>

                {cancelPaymentData.services.length > 0 && (
                  <div className="services-cancellation-info">
                    <h4>Services payés</h4>
                    <div className="services-list">
                      {cancelPaymentData.services.map((service, index) => (
                        <div key={index} className="service-item-cancellation">
                          <span className="service-name">{service.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="titre_input">Motif d'annulation:</label>
                  <textarea
                    className="form-input"
                    value={cancelPaymentData.reason}
                    onChange={(e) => setCancelPaymentData(prev => ({ 
                      ...prev, 
                      reason: e.target.value 
                    }))}
                    placeholder="Veuillez saisir le motif de l'annulation du paiement..."
                    rows="4"
                    required
                  />
                </div>

                {cancelPaymentMessage && (
                  <div className={`exam-message ${
                    cancelPaymentMessage.includes('❌') ? 'error' : 
                    cancelPaymentMessage.includes('✅') ? 'success' : 'info'
                  }`}>
                    {cancelPaymentMessage}
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowCancelPaymentModal(false);
                    setCancelPaymentData({
                      patientId: '',
                      patientName: '',
                      amount: 0,
                      services: [],
                      paymentDate: '',
                      reason: ''
                    });
                    setCancelPaymentMessage('');
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-danger"
                  disabled={!cancelPaymentData.reason.trim()}
                >
                  💰 Annuler le Paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE D'AJOUT D'UTILISATEUR - SIMPLIFIÉE */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>👤 Ajouter un Nouvel Utilisateur</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowAddUserModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="titre_input">Nom d'utilisateur *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="ex: john.doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="titre_input">Mot de passe *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 4 caractères"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="titre_input">Confirmer le mot de passe *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Retapez le mot de passe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="titre_input">Service *</label>
                  <select
                    className="form-input"
                    value={newUser.service}
                    onChange={(e) => handleServiceChange(e.target.value, true)}
                    required
                  >
                    <option value="">Sélectionner un service</option>
                    {availableServicesForUsers.map(service => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                {userMessage && (
                  <div className={`user-message ${
                    userMessage.includes('❌') ? 'error' : 
                    userMessage.includes('✅') ? 'success' : 'info'
                  }`}>
                    {userMessage}
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  ✅ Créer l'Utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE MODIFICATION D'UTILISATEUR - SIMPLIFIÉE */}
      {showEditUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>✏️ Modifier l'Utilisateur</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowEditUserModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEditUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="titre_input">Nom d'utilisateur *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="titre_input">Nouveau mot de passe</label>
                  <input
                    type="password"
                    className="form-input"
                    value={editingUser.password}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Laisser vide pour ne pas changer"
                  />
                  <small>Laisser vide pour conserver l'actuel</small>
                </div>
                
                <div className="form-group">
                  <label className="titre_input">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    className="form-input"
                    value={editingUser.confirmPassword}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Retapez le nouveau mot de passe"
                  />
                </div>

                <div className="form-group">
                  <label className="titre_input">Service *</label>
                  <select
                    className="form-input"
                    value={editingUser.service}
                    onChange={(e) => handleServiceChange(e.target.value, false)}
                    required
                  >
                    <option value="">Sélectionner un service</option>
                    {availableServicesForUsers.map(service => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                {userMessage && (
                  <div className={`user-message ${
                    userMessage.includes('❌') ? 'error' : 
                    userMessage.includes('✅') ? 'success' : 'info'
                  }`}>
                    {userMessage}
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowEditUserModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  ✅ Modifier l'Utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION D'UTILISATEUR */}
      {showDeleteUserModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🗑️ Supprimer l'Utilisateur</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowDeleteUserModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="warning-message">
                  ⚠️ Vous êtes sur le point de supprimer l'utilisateur :
                </div>
                <div className="user-to-delete">
                  <div className="user-info">
                    <strong>{selectedUser.username}</strong>
                    <span className="user-service">{selectedUser.service}</span>
                  </div>
                </div>
                <div className="warning-text">
                  Cette action est irréversible. Voulez-vous vraiment continuer ?
                </div>
              </div>

              {userMessage && (
                <div className={`user-message ${
                  userMessage.includes('❌') ? 'error' : 
                  userMessage.includes('✅') ? 'success' : 'info'
                }`}>
                  {userMessage}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowDeleteUserModal(false)}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={handleDeleteUser}
              >
                🗑️ Supprimer l'Utilisateur
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-dashboard">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h4>Patients Actifs</h4>
            <span className="stat-number">{activePatients.length}</span>
          </div>
          <div className="stat-card">
            <h4>Utilisateurs Connectés</h4>
            <span className="stat-number">{getTotalConnectedUsers()}</span>
            <div className="stat-detail">
              {Object.entries(connectedUsersDetailed).map(([service, users]) => 
                users.length > 0 ? (
                  <div key={service} className="service-connection">
                    {service}: {users.length}
                  </div>
                ) : null
              )}
            </div>
          </div>
          <div className="stat-card">
            <h4>Statut Serveur</h4>
            <span className="stat-status">En ligne</span>
          </div>
          
          {/* Carte pour ajouter un examen */}
          <div className="stat-card clickable" onClick={() => setShowAddExamModal(true)}>
            <h4>➕ Ajouter Examen</h4>
            <span className="stat-number">Nouveau</span>
          </div>
          
          {/* Carte pour gérer les examens */}
          <div className="stat-card clickable" onClick={() => openManageExamModal('modify')}>
            <h4>✏️ Modifier Examen</h4>
            <span className="stat-number">Édition</span>
          </div>
          
          {/* Carte pour supprimer les examens */}
          <div className="stat-card clickable" onClick={() => openManageExamModal('delete')}>
            <h4>🗑️ Supprimer Examen</h4>
            <span className="stat-number">Suppression</span>
          </div>

          {/* Carte pour annuler un paiement */}
          <div className="stat-card clickable" onClick={searchPatientForCancellation}>
            <h4>💰 Annuler Paiement</h4>
            <span className="stat-number">Remboursement</span>
          </div>

          {/* AJOUT: Carte pour voir l'historique des annulations */}
          <div className="stat-card clickable" onClick={viewCancellationHistory}>
            <h4>📊 Historique Annulations</h4>
            <span className="stat-number">Consultation</span>
          </div>

          {/* NOUVELLE CARTE POUR LA GESTION DES UTILISATEURS */}
          <div className="stat-card clickable" onClick={toggleUserManagement}>
            <h4>👥 Gestion Utilisateurs</h4>
            <span className="stat-number">Comptes</span>
          </div>
        </div>

        {/* SECTION GESTION DES UTILISATEURS */}
        {showUserManagement && (
          <div className="user-management-section">
            <div className="section-header">
              <h3>👥 Gestion des Comptes Utilisateurs</h3>
              <div className="header-actions">
                <button className="btn-primary" onClick={openAddUserModal}>
                  ➕ Ajouter Utilisateur
                </button>
                <button className="btn-secondary" onClick={loadUsersList}>
                  🔄 Actualiser
                </button>
              </div>
            </div>

            <div className="users-table-container">
              {usersList.length > 0 ? (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Service</th>
                      <th>Statut Compte</th>
                      <th>Statut Connexion</th>
                      <th>Création</th>
                      <th>Dernière Connexion</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => (
                      <tr key={user.id} className={user.isActive ? '' : 'user-inactive'}>
                        <td className="user-username">
                          <strong>{user.username}</strong>
                          {user.username === 'admin' && <span className="admin-badge">ADMIN</span>}
                        </td>
                        <td className="user-service">
                          <span className="service-badge">{user.service}</span>
                        </td>
                        <td className="user-status">
                          <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                            {getUserStatus(user)}
                          </span>
                        </td>
                        <td className="user-connection">
                          <span className={`connection-status ${getUserConnectionStatus(user).includes('En ligne') ? 'online' : 'offline'}`}>
                            {getUserConnectionStatus(user)}
                          </span>
                        </td>
                        <td className="user-date">{formatUserDate(user.createdAt)}</td>
                        <td className="user-date">
                          {user.lastLogin ? formatLastLogin(user.lastLogin) : 'Jamais connecté'}
                        </td>
                        <td className="user-actions">
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => openEditUserModal(user)}
                            title="Modifier l'utilisateur"
                            disabled={user.username === 'admin'}
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => openDeleteUserModal(user)}
                            title="Supprimer l'utilisateur"
                            disabled={user.username === 'admin'}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-table">
                  <div className="empty-table-icon">👥</div>
                  <h4>Aucun utilisateur trouvé</h4>
                  <p>Commencez par ajouter un nouvel utilisateur</p>
                </div>
              )}
            </div>

            <div className="users-stats">
              <div className="stat-item">
                <span className="stat-label">Total Utilisateurs:</span>
                <span className="stat-value">{usersList.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Utilisateurs Actifs:</span>
                <span className="stat-value">
                  {usersList.filter(u => u.isActive).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Utilisateurs Connectés:</span>
                <span className="stat-value">{getTotalConnectedUsers()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Services:</span>
                <span className="stat-value">{availableServicesForUsers.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section de recherche par date */}
        <div className="search-section">
          <h3>🔍 Recherche de Patients par Date</h3>
          <div className="search-form">
            <div className="form-group">
              <label htmlFor="searchDate">Date de recherche:</label>
              <input
                type="date"
                id="searchDate"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="search-buttons">
              <button 
                onClick={searchPatientsByDate} 
                className="glow-on-hover_MGAcceuil MenuBtn"
                disabled={isSearching}
              >
                {isSearching ? '⏳ Recherche...' : '🔍 Rechercher'}
              </button>
              <button 
                onClick={resetSearch} 
                className="glow-on-hover_MGAcceuil MenuBtn secondary"
              >
                🗑️ Réinitialiser
              </button>
            </div>
          </div>

          {searchMessage && (
            <div className={`search-message ${isSearching ? 'searching' : searchResults.length > 0 ? 'success' : 'info'}`}>
              {searchMessage}
            </div>
          )}
        </div>

        {/* Tableau des patients */}
        <div className="patients-table-container">
          <div className="patients-table-header">
            <h3>
              {searchResults.length > 0 ? '📋 Résultats de la Recherche' : '👥 Patients Enregistrés'}
            </h3>
            <div className="patients-count">
              {filteredAndSortedData.length} patient(s)
              {searchTerm && ` (filtrés)`}
            </div>
          </div>

          <div className="table-toolbar">
            <div className="table-search">
              <span>🔎</span>
              <input
                type="text"
                placeholder="Rechercher par nom, CSR, ID, statut..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="table-actions">
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="table-btn"
              >
                <option value={10}>10 lignes</option>
                <option value={20}>20 lignes</option>
                <option value={50}>50 lignes</option>
                <option value={100}>100 lignes</option>
              </select>
              
              <button 
                className="table-btn add-exam" 
                onClick={() => setShowAddExamModal(true)}
              >
                ➕ Ajouter Examen
              </button>
              
              <button 
                className="table-btn modify-exam" 
                onClick={() => openManageExamModal('modify')}
              >
                ✏️ Modifier Examen
              </button>
              
              <button 
                className="table-btn delete-exam" 
                onClick={() => openManageExamModal('delete')}
              >
                🗑️ Supprimer Examen
              </button>

              <button 
                className="table-btn cancel-payment" 
                onClick={searchPatientForCancellation}
              >
                💰 Annuler Paiement
              </button>

              {/* AJOUT: Bouton pour l'historique des annulations */}
              <button 
                className="table-btn history" 
                onClick={viewCancellationHistory}
              >
                📊 Historique
              </button>

              {/* NOUVEAU: Bouton pour la gestion des utilisateurs */}
              <button 
                className="table-btn users" 
                onClick={toggleUserManagement}
              >
                👥 Utilisateurs
              </button>
              
              <button className="table-btn export" onClick={() => alert('Fonctionnalité d\'export à implémenter')}>
                📊 Exporter
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            {filteredAndSortedData.length > 0 ? (
              <table className="patients-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('nomClient')} style={{ cursor: 'pointer', minWidth: '200px' }}>
                      Nom du Patient {getSortIndicator('nomClient')}
                    </th>
                    <th onClick={() => handleSort('numID_CSR')} style={{ cursor: 'pointer', minWidth: '150px' }}>
                      ID CSR {getSortIndicator('numID_CSR')}
                    </th>
                    <th onClick={() => handleSort('numClient')} style={{ cursor: 'pointer', minWidth: '120px' }}>
                      # Client {getSortIndicator('numClient')}
                    </th>
                    <th onClick={() => handleSort('isLaboratorized')} style={{ cursor: 'pointer', minWidth: '150px' }}>
                      Statut {getSortIndicator('isLaboratorized')}
                    </th>
                    <th onClick={() => handleSort('dateCreation')} style={{ cursor: 'pointer', minWidth: '200px' }}>
                      Date Création {getSortIndicator('dateCreation')}
                    </th>
                    <th onClick={() => handleSort('lastUpdate')} style={{ cursor: 'pointer', minWidth: '200px' }}>
                      Dernière Modif {getSortIndicator('lastUpdate')}
                    </th>
                    <th style={{ minWidth: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((patient, index) => (
                    <tr key={patient.numID_CSR || index}>
                      <td className="patient-name">👤 {patient.nomClient || 'Non renseigné'}</td>
                      <td className="patient-csr">🔢 {patient.numID_CSR || 'N/A'}</td>
                      <td className="patient-id">#{patient.numClient || 'N/A'}</td>
                      <td className="patient-status">
                        <span className={getStatusBadgeClass(patient.isLaboratorized)}>
                          {patient.isLaboratorized || 'Non défini'}
                        </span>
                      </td>
                      <td className="patient-date">{formatDate(patient.dateCreation)}</td>
                      <td className="patient-date">{formatDate(patient.lastUpdate || patient.dateModification)}</td>
                      <td className="patient-actions">
                        <button 
                          className="action-btn cancel-btn"
                          onClick={() => openCancelPaymentModal(patient)}
                          title="Annuler le paiement"
                        >
                          💰
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-table">
                <div className="empty-table-icon">📊</div>
                <h4>Aucun patient à afficher</h4>
                <p>
                  {searchResults.length > 0 
                    ? 'Aucun patient trouvé avec les critères actuels' 
                    : 'Aucun patient enregistré pour le moment'
                  }
                </p>
              </div>
            )}
          </div>

          {filteredAndSortedData.length > 0 && (
            <div className="table-pagination">
              <div className="pagination-info">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} 
                sur {filteredAndSortedData.length} patient(s)
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  ⏮️ Premier
                </button>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ◀️ Précédent
                </button>
                
                <div className="pagination-pages">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        className={`page-number ${pageNum === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant ▶️
                </button>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Dernier ⏭️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Administration;
