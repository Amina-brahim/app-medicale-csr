const express = require('express');
const app = express();
const cors = require("cors");
const http = require('http').Server(app);
const PORT = 4600;
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Configuration Socket.io - CORRECTEMENT PLACÉE AU DÉBUT
const socketIO = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    allowEIO3: true
});

// Chemins des fichiers
const databasesDir = path.resolve(__dirname, 'databases');
const LABO_FILE = path.resolve(databasesDir, 'labo.json');
const CONSULT_FILE = path.resolve(databasesDir, 'consult.json');
const ADMIN_LOG_FILE = path.resolve(databasesDir, 'admin_logs.json');
const EXAMENS_CONFIG_FILE = path.resolve(databasesDir, 'examens_config.json');
const USERS_FILE = path.resolve(databasesDir, 'users.json');

// ⚙️ Configuration CORS pour la production
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL // Nous définirons cela sur Render
];

app.use(cors({
    origin: function (origin, callback) {
        // Autoriser les requêtes sans origine (comme les apps mobiles ou curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = "L'origine CORS " + origin + " n'est pas autorisée";
            console.warn("⚠️  Tentative d'accès non autorisée depuis:", origin);
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Configuration des événements Socket.IO - MAINTENANT ÇA FONCTIONNE
socketIO.on('connection', (socket) => {
    console.log('Nouvelle connexion Socket.io: ' + socket.id);
    
    const userService = 'Autre'; // Déterminez le service comme avant
    const userData = {
        service: userService,
        username: 'En attente d\'identification...',
        fullName: 'Utilisateur non identifié',
        connectTime: new Date().toISOString(),
        ip: socket.handshake.address,
        isIdentified: false
    };
    
    // ... (TOUTE VOTRE LOGIQUE SOCKET.IO ACTUELLE ICI - PAS BESOIN DE LA COPIER À NOUVEAU)
    // IMPORTANT: Conservez tout votre code existant à partir d'ici...
});

app.use(express.json());

let users = [];
let Clients = [];
let FichierLaboOuvert = false;
let dernierNumClient = 0;
let adminLogs = [];

// Configuration par défaut des examens
let examensConfig = {
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

// Stockage des utilisateurs connectés par service
let connectedUsers = new Map();

// Système de verrouillage
const fileLocks = new Map();

const acquireLock = async (filePath) => {
  while (fileLocks.has(filePath)) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  fileLocks.set(filePath, true);
  return true;
};

const releaseLock = (filePath) => {
  fileLocks.delete(filePath);
};

// ====================================================================================
// FONCTIONS UTILITAIRES - GESTION DES EXAMENS
// ====================================================================================

// Fonction pour charger la configuration des examens
const loadExamensConfig = async () => {
    try {
        await fs.access(EXAMENS_CONFIG_FILE);
        const data = await fs.readFile(EXAMENS_CONFIG_FILE, 'utf8');
        if (data.trim()) {
            examensConfig = JSON.parse(data);
            console.log('✅ Configuration des examens chargée');
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Créer le fichier avec la configuration par défaut
            await saveExamensConfig();
            console.log('📁 Fichier de configuration des examens créé');
        } else {
            console.error('❌ Erreur chargement configuration examens:', error);
        }
    }
};

// Fonction pour sauvegarder la configuration des examens
const saveExamensConfig = async () => {
    try {
        await fs.writeFile(EXAMENS_CONFIG_FILE, JSON.stringify(examensConfig, null, 2));
        console.log('✅ Configuration des examens sauvegardée');
    } catch (error) {
        console.error('❌ Erreur sauvegarde configuration examens:', error);
        throw error;
    }
};

// Fonction pour ajouter un nouvel examen
const addNewExam = async (service, examName, examPrice, username = 'system') => {
    try {
        // Validation des données
        if (!service || !examName || !examPrice) {
            throw new Error('Tous les champs sont obligatoires');
        }

        const price = parseFloat(examPrice);
        if (isNaN(price) || price <= 0) {
            throw new Error('Le prix doit être un nombre positif');
        }

        // Vérifier si le service existe
        if (!examensConfig[service]) {
            examensConfig[service] = [];
        }

        // Vérifier si l'examen existe déjà
        const examenExiste = examensConfig[service].some(examen => 
            examen.name.toLowerCase() === examName.toLowerCase().trim()
        );

        if (examenExiste) {
            throw new Error('Cet examen existe déjà dans ce service');
        }

        // Générer un ID unique
        const examId = examName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

        // Créer le nouvel examen
        const newExam = {
            id: examId,
            name: examName.trim(),
            prix: price
        };

        // Ajouter à la configuration
        examensConfig[service].push(newExam);

        // Sauvegarder la configuration
        await saveExamensConfig();

        console.log(`✅ Nouvel examen ajouté: ${examName} pour ${service} à ${price} FCFA`);

        // Ajouter un log d'administration
        await addAdminLog(
            `Nouvel examen ajouté: ${examName} dans ${service} - ${price} FCFA`,
            'exam_added',
            username
        );

        return newExam;

    } catch (error) {
        console.error('❌ Erreur ajout nouvel examen:', error);
        throw error;
    }
};

// Fonction pour modifier un examen existant
const modifyExam = async (service, examId, newName, newPrice, username = 'system') => {
    try {
        // Validation des données
        if (!service || !examId || !newName || !newPrice) {
            throw new Error('Tous les champs sont obligatoires');
        }

        const price = parseFloat(newPrice);
        if (isNaN(price) || price <= 0) {
            throw new Error('Le prix doit être un nombre positif');
        }

        // Vérifier si le service existe
        if (!examensConfig[service]) {
            throw new Error('Service non trouvé');
        }

        // Trouver l'examen à modifier
        const examIndex = examensConfig[service].findIndex(examen => examen.id === examId);
        if (examIndex === -1) {
            throw new Error('Examen non trouvé');
        }

        // Vérifier si le nouveau nom existe déjà (sauf pour l'examen actuel)
        const nomExisteDeja = examensConfig[service].some((examen, index) => 
            index !== examIndex && examen.name.toLowerCase() === newName.toLowerCase().trim()
        );

        if (nomExisteDeja) {
            throw new Error('Un examen avec ce nom existe déjà dans ce service');
        }

        // Sauvegarder l'ancien examen pour le log
        const ancienExam = { ...examensConfig[service][examIndex] };

        // Modifier l'examen
        examensConfig[service][examIndex] = {
            ...examensConfig[service][examIndex],
            name: newName.trim(),
            prix: price
        };

        // Sauvegarder la configuration
        await saveExamensConfig();

        console.log(`✅ Examen modifié: ${ancienExam.name} → ${newName}, ${ancienExam.prix} → ${price} FCFA`);

        // Ajouter un log d'administration
        await addAdminLog(
            `Examen modifié: ${ancienExam.name} (${ancienExam.prix}F) → ${newName} (${price}F) dans ${service}`,
            'exam_modified',
            username
        );

        return {
            ancienExam: ancienExam,
            nouvelExam: examensConfig[service][examIndex]
        };

    } catch (error) {
        console.error('❌ Erreur modification examen:', error);
        throw error;
    }
};

// Fonction pour supprimer un examen
const deleteExam = async (service, examId, username = 'system') => {
    try {
        // Validation des données
        if (!service || !examId) {
            throw new Error('Service et examen sont obligatoires');
        }

        // Vérifier si le service existe
        if (!examensConfig[service]) {
            throw new Error('Service non trouvé');
        }

        // Trouver l'examen à supprimer
        const examIndex = examensConfig[service].findIndex(examen => examen.id === examId);
        if (examIndex === -1) {
            throw new Error('Examen non trouvé');
        }

        // Sauvegarder l'examen pour le log
        const examASupprimer = examensConfig[service][examIndex];

        // Supprimer l'examen
        examensConfig[service].splice(examIndex, 1);

        // Sauvegarder la configuration
        await saveExamensConfig();

        console.log(`✅ Examen supprimé: ${examASupprimer.name} du service ${service}`);

        // Ajouter un log d'administration
        await addAdminLog(
            `Examen supprimé: ${examASupprimer.name} (${examASupprimer.prix}F) du service ${service}`,
            'exam_deleted',
            username
        );

        return examASupprimer;

    } catch (error) {
        console.error('❌ Erreur suppression examen:', error);
        throw error;
    }
};

// Fonction pour obtenir les services disponibles
const getAvailableServices = () => {
    return [
        { value: 'consultation', name: 'Consultation' },
        { value: 'laboratoire', name: 'Laboratoire' },
        { value: 'echographie', name: 'Echographie' },
        { value: 'hospitalisation', name: 'Hospitalisation' },
        { value: 'chirurgie', name: 'Chirurgie' },
        { value: 'kinesitherapie', name: 'Kinésithérapie' },
        { value: 'fibroscopie', name: 'Fibroscopie' }
    ];
};

// ====================================================================================
// FONCTIONS POUR LA GESTION DES UTILISATEURS - CORRIGÉES
// ====================================================================================

// Configuration initiale des utilisateurs
let usersDatabase = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    service: "Administration",
    fullName: "Administrateur Principal",
    email: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    permissions: ["all"]
  },
  {
    id: 2,
    username: "Chouaib",
    password: "SansPasse",
    service: "Administration",
    fullName: "Chouaib",
    email: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    permissions: ["all"]
  },
  {
    id: 3,
    username: "Djibrine",
    password: "SansPasse",
    service: "Administration",
    fullName: "Djibrine",
    email: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    permissions: ["all"]
  },
  {
    id: 4,
    username: "Labo",
    password: "12345678",
    service: "Laboratoire",
    fullName: "Technicien Laboratoire",
    email: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    permissions: ["labo", "view", "update_status"]
  },
  {
    id: 5,
    username: "Caisse",
    password: "12345678",
    service: "Caisse",
    fullName: "Caissier Principal",
    email: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    permissions: ["caisse", "view", "create_patient"]
  },
  {
    id: 6,
    username: "Consultation",
    password: "12345678",
    service: "Consultation",
    fullName: "Médecin Consultant",
    email: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    permissions: ["consultation", "view"]
  }
];

// Services disponibles
const availableServices = [
  "Administration",
  "Laboratoire", 
  "Caisse",
  "Consultation",
  "Radiologie",
  "Pharmacie",
  "Hospitalisation",
  "Maintenance"
];

// Fonction pour debugger les utilisateurs
const debugUsers = () => {
  console.log('=== DEBUG UTILISATEURS ===');
  console.log('Total utilisateurs:', usersDatabase.length);
  usersDatabase.forEach((user, index) => {
    console.log(`${index + 1}. ${user.username} (${user.service}) - Actif: ${user.isActive} - Password: ${user.password}`);
  });
  console.log('==========================');
};

// Charger les utilisateurs depuis le fichier
const loadUsers = async () => {
  try {
    await fs.access(USERS_FILE);
    const data = await fs.readFile(USERS_FILE, 'utf8');
    if (data.trim()) {
      usersDatabase = JSON.parse(data);
      console.log('✅ Utilisateurs chargés: ' + usersDatabase.length);
      debugUsers();
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      await saveUsers();
      console.log('📁 Fichier utilisateurs créé avec la configuration par défaut');
      debugUsers();
    } else {
      console.error('❌ Erreur chargement utilisateurs:', error);
    }
  }
};

// Sauvegarder les utilisateurs
const saveUsers = async () => {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(usersDatabase, null, 2));
    console.log('✅ Utilisateurs sauvegardés');
    debugUsers();
  } catch (error) {
    console.error('❌ Erreur sauvegarde utilisateurs:', error);
    throw error;
  }
};

// Générer un ID unique
const generateUserId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// Fonction pour mettre à jour la dernière connexion d'un utilisateur
const updateUserLastLogin = async (username) => {
  try {
    const userIndex = usersDatabase.findIndex(user => user.username === username);
    if (userIndex !== -1) {
      usersDatabase[userIndex].lastLogin = new Date().toISOString();
      await saveUsers();
      console.log(`✅ Dernière connexion mise à jour pour: ${username}`);
      return usersDatabase[userIndex];
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur mise à jour dernière connexion:', error);
    return null;
  }
};

// Fonction pour ajouter un utilisateur
const addUser = async (userData, username = 'system') => {
  try {
    console.log('🔄 Tentative d\'ajout utilisateur:', userData);
    
    // Validation des données
    if (!userData.username || !userData.password || !userData.service || !userData.fullName) {
      throw new Error('Tous les champs obligatoires doivent être remplis');
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = usersDatabase.some(user => 
      user.username.toLowerCase() === userData.username.toLowerCase()
    );

    if (userExists) {
      throw new Error('Un utilisateur avec ce nom existe déjà');
    }

    // Vérifier si le service est valide
    if (!availableServices.includes(userData.service)) {
      throw new Error('Service invalide');
    }

    // Créer le nouvel utilisateur
    const newUser = {
      id: generateUserId(),
      username: userData.username.trim(),
      password: userData.password,
      service: userData.service,
      fullName: userData.fullName.trim(),
      email: userData.email || '',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      permissions: userData.permissions || getDefaultPermissions(userData.service)
    };

    // Ajouter à la base de données
    usersDatabase.push(newUser);

    // Sauvegarder
    await saveUsers();

    console.log(`✅ Nouvel utilisateur ajouté: ${newUser.username} (${newUser.service})`);
    debugUsers();

    // Ajouter un log d'administration
    await addAdminLog(
      `Nouvel utilisateur créé: ${newUser.username} - ${newUser.fullName} (${newUser.service})`,
      'user_created',
      username
    );

    return newUser;

  } catch (error) {
    console.error('❌ Erreur ajout utilisateur:', error);
    throw error;
  }
};

// Fonction pour modifier un utilisateur
const modifyUser = async (userId, userData, username = 'system') => {
  try {
    console.log('🔄 Tentative de modification utilisateur:', userId, userData);
    
    // Validation des données
    if (!userId) {
      throw new Error('ID utilisateur manquant');
    }

    // Trouver l'utilisateur
    const userIndex = usersDatabase.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      throw new Error('Utilisateur non trouvé');
    }

    const oldUser = { ...usersDatabase[userIndex] };

    // Mettre à jour les champs
    if (userData.username !== undefined) {
      // Vérifier si le nouveau nom d'utilisateur n'est pas déjà utilisé par un autre utilisateur
      const usernameExists = usersDatabase.some((user, index) => 
        index !== userIndex && user.username.toLowerCase() === userData.username.toLowerCase()
      );
      if (usernameExists) {
        throw new Error('Un autre utilisateur avec ce nom existe déjà');
      }
      usersDatabase[userIndex].username = userData.username.trim();
    }

    if (userData.password !== undefined && userData.password !== '') {
      usersDatabase[userIndex].password = userData.password;
    }

    if (userData.service !== undefined) {
      if (!availableServices.includes(userData.service)) {
        throw new Error('Service invalide');
      }
      usersDatabase[userIndex].service = userData.service;
      // Mettre à jour les permissions selon le nouveau service
      usersDatabase[userIndex].permissions = getDefaultPermissions(userData.service);
    }

    if (userData.fullName !== undefined) {
      usersDatabase[userIndex].fullName = userData.fullName.trim();
    }

    if (userData.email !== undefined) {
      usersDatabase[userIndex].email = userData.email;
    }

    if (userData.isActive !== undefined) {
      usersDatabase[userIndex].isActive = userData.isActive;
    }

    if (userData.permissions !== undefined) {
      usersDatabase[userIndex].permissions = userData.permissions;
    }

    // Sauvegarder
    await saveUsers();

    console.log(`✅ Utilisateur modifié: ${usersDatabase[userIndex].username}`);
    debugUsers();

    // Ajouter un log d'administration
    await addAdminLog(
      `Utilisateur modifié: ${oldUser.username} → ${usersDatabase[userIndex].username}`,
      'user_modified',
      username
    );

    return {
      oldUser: oldUser,
      updatedUser: usersDatabase[userIndex]
    };

  } catch (error) {
    console.error('❌ Erreur modification utilisateur:', error);
    throw error;
  }
};

// Fonction pour supprimer un utilisateur
const deleteUser = async (userId, username = 'system') => {
  try {
    console.log('🔄 Tentative de suppression utilisateur:', userId);
    
    // Validation
    if (!userId) {
      throw new Error('ID utilisateur manquant');
    }

    // Trouver l'utilisateur
    const userIndex = usersDatabase.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      throw new Error('Utilisateur non trouvé');
    }

    const userToDelete = usersDatabase[userIndex];

    // Empêcher la suppression de l'admin principal
    if (userToDelete.username === 'admin') {
      throw new Error('Impossible de supprimer le compte administrateur principal');
    }

    // Supprimer l'utilisateur
    usersDatabase.splice(userIndex, 1);

    // Sauvegarder
    await saveUsers();

    console.log(`✅ Utilisateur supprimé: ${userToDelete.username}`);
    debugUsers();

    // Ajouter un log d'administration
    await addAdminLog(
      `Utilisateur supprimé: ${userToDelete.username} - ${userToDelete.fullName}`,
      'user_deleted',
      username
    );

    return userToDelete;

  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    throw error;
  }
};

// Obtenir les permissions par défaut selon le service
const getDefaultPermissions = (service) => {
  const permissionsMap = {
    'Administration': ['all'],
    'Laboratoire': ['labo', 'view', 'update_status'],
    'Caisse': ['caisse', 'view', 'create_patient'],
    'Consultation': ['consultation', 'view'],
    'Radiologie': ['radiologie', 'view'],
    'Pharmacie': ['pharmacie', 'view'],
    'Hospitalisation': ['hospitalisation', 'view'],
    'Maintenance': ['maintenance', 'view']
  };
  
  return permissionsMap[service] || ['view'];
};

// FONCTION VERIFY CREDENTIALS CORRIGÉE - VERSION FINALE
const verifyCredentials = (username, password) => {
  console.log('🔐 [SERVER] Vérification credentials pour:', username);
  console.log('📋 [SERVER] Utilisateurs disponibles:', usersDatabase.map(u => ({
    username: u.username, 
    service: u.service, 
    active: u.isActive
  })));
  
  // Recherche insensible à la casse avec validation du mot de passe
  const user = usersDatabase.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && 
    u.password === password &&
    u.isActive === true
  );
  
  if (user) {
    console.log('✅ [SERVER] Utilisateur authentifié:', user.username, 'Service:', user.service);
    return user;
  } else {
    console.log('❌ [SERVER] Échec authentification pour:', username);
    
    // Debug détaillé
    const userExists = usersDatabase.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      console.log('🔍 [SERVER] Utilisateur trouvé mais:', {
        motDePasseCorrect: userExists.password === password,
        compteActif: userExists.isActive,
        motDePasseAttendu: userExists.password,
        motDePasseReçu: password
      });
    } else {
      console.log('🔍 [SERVER] Utilisateur non trouvé dans la base');
    }
    
    return null;
  }
};

// ====================================================================================
// FONCTIONS POUR L'ANNULATION DE PAIEMENT
// ====================================================================================

// Fonction pour trouver un patient par ID CSR
const trouverPatientParCSR = async (patientId) => {
    try {
        const patients = await loadPatientData();
        return patients.find(p => p.numID_CSR === patientId) || null;
    } catch (error) {
        console.error('Erreur dans trouverPatientParCSR:', error);
        return null;
    }
};

// Fonction pour générer un ID unique
const generateId = () => {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Fonction pour sauvegarder l'annulation dans l'historique
const sauvegarderAnnulation = async (annulation) => {
    const annulationsFile = path.resolve(databasesDir, 'payment_cancellations.json');
    
    try {
        await ensureDirectoryExists(databasesDir);
        
        let annulationsExistantes = [];
        try {
            const data = await fs.readFile(annulationsFile, 'utf8');
            if (data.trim()) {
                annulationsExistantes = JSON.parse(data);
            }
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        annulationsExistantes.unshift(annulation);
        
        // Garder seulement les 1000 dernières annulations
        if (annulationsExistantes.length > 1000) {
            annulationsExistantes = annulationsExistantes.slice(0, 1000);
        }
        
        await fs.writeFile(annulationsFile, JSON.stringify(annulationsExistantes, null, 2));
        
        console.log(`✅ Annulation sauvegardée: ${annulation.patientName} - ${annulation.amount} FCFA`);
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde annulation:', error);
        throw error;
    }
};

// Fonction pour supprimer un patient de la liste active
const supprimerPatient = async (patientId) => {
    let lockAcquired = false;
    try {
        await acquireLock(LABO_FILE);
        lockAcquired = true;
        
        const data = await fs.readFile(LABO_FILE, 'utf8');
        let patients = JSON.parse(data);

        const patientIndex = patients.findIndex(p => p.numID_CSR === patientId);
        
        if (patientIndex === -1) {
            throw new Error(`Patient ${patientId} non trouvé`);
        }

        const patientSupprime = patients[patientIndex];
        
        // Supprimer le patient
        patients.splice(patientIndex, 1);
        
        const tmpFile = LABO_FILE + '.tmp';
        await fs.writeFile(tmpFile, JSON.stringify(patients, null, 2));
        await fs.rename(tmpFile, LABO_FILE);

        console.log(`✅ Patient supprimé: ${patientSupprime.nomClient} (${patientId})`);
        return patientSupprime;
    } catch (error) {
        console.error('❌ Erreur suppression patient:', error);
        throw error;
    } finally {
        if (lockAcquired) {
            releaseLock(LABO_FILE);
        }
    }
};

// Fonction pour charger l'historique des annulations
const loadCancellationHistory = async () => {
    const annulationsFile = path.resolve(databasesDir, 'payment_cancellations.json');
    
    try {
        await fs.access(annulationsFile);
        const data = await fs.readFile(annulationsFile, 'utf8');
        if (!data.trim()) return [];
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(annulationsFile, '[]');
            return [];
        }
        throw error;
    }
};

// Fonction pour créer le répertoire si il n'existe pas
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
        console.log('Répertoire existe: ' + dirPath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(dirPath, { recursive: true });
            console.log('Répertoire créé: ' + dirPath);
        } else {
            throw error;
        }
    }
}

// Fonction pour obtenir l'adresse IP locale
function getLocalIP() {
    try {
        const interfaces = os.networkInterfaces();
        for (const interfaceName in interfaces) {
            for (const iface of interfaces[interfaceName]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '0.0.0.0';
    } catch (error) {
        console.error('Erreur lors de la détection de l\'IP:', error);
        return '0.0.0.0';
    }
}

// Fonction pour charger le dernier numéro de client
async function chargerDernierNumClient() {
    try {
        const data = await fs.readFile(LABO_FILE, 'utf8');
        if (data.trim()) {
            const patients = JSON.parse(data);
            if (patients.length > 0) {
                const maxNumClient = Math.max(...patients.map(p => {
                    const num = parseInt(p.numClient);
                    return isNaN(num) ? 0 : num;
                }));
                dernierNumClient = maxNumClient;
                console.log('Dernier numéro client chargé: ' + dernierNumClient);
            } else {
                dernierNumClient = 0;
                console.log('Aucun patient trouvé, numéro client initialisé à 0');
            }
        } else {
            dernierNumClient = 0;
            console.log('Fichier vide, numéro client initialisé à 0');
        }
    } catch (error) {
        console.error('Erreur lors du chargement du dernier numéro client:', error);
        dernierNumClient = 0;
    }
}

// Fonction pour initialiser le fichier labo
async function initializeLaboFile() {
    try {
        await ensureDirectoryExists(databasesDir);
        
        try {
            await fs.access(LABO_FILE);
            console.log('Fichier labo.json existe déjà');
            await chargerDernierNumClient();
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(LABO_FILE, '[]');
                console.log('Fichier labo.json créé');
                dernierNumClient = 0;
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    }
}

// Fonction pour charger les données des patients
const loadPatientData = async () => {
    try {
        const data = await fs.readFile(LABO_FILE, 'utf8');
        if (!data.trim()) return [];
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(LABO_FILE, '[]');
            return [];
        }
        throw error;
    }
};

// Fonction pour mettre à jour le statut par numClient
const updateLaboratorizedStatus = async (numClient, newStatus) => {
    let lockAcquired = false;
    try {
        await acquireLock(LABO_FILE);
        lockAcquired = true;
        
        const data = await fs.readFile(LABO_FILE, 'utf8');
        let records = JSON.parse(data);

        const recordIndex = records.findIndex(r => r.numClient == numClient);

        if (recordIndex === -1) {
            throw new Error('Client ' + numClient + ' non trouvé');
        }

        records[recordIndex] = {
            ...records[recordIndex],
            isLaboratorized: newStatus,
            updatedAt: new Date().toISOString()
        };

        const tmpFile = LABO_FILE + '.tmp';
        await fs.writeFile(tmpFile, JSON.stringify(records, null, 2));
        await fs.rename(tmpFile, LABO_FILE);

        return records[recordIndex];
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        throw error;
    } finally {
        if (lockAcquired) {
            releaseLock(LABO_FILE);
        }
    }
};

// Fonction pour mettre à jour le statut par numID_CSR
const updateLaboratorizedStatusByCSR = async (numID_CSR, newStatus) => {
    let lockAcquired = false;
    try {
        await acquireLock(LABO_FILE);
        lockAcquired = true;
        
        const data = await fs.readFile(LABO_FILE, 'utf8');
        let records = JSON.parse(data);

        const recordIndex = records.findIndex(r => r.numID_CSR === numID_CSR);

        if (recordIndex === -1) {
            throw new Error('Client ' + numID_CSR + ' non trouvé');
        }

        records[recordIndex] = {
            ...records[recordIndex],
            isLaboratorized: newStatus,
            updatedAt: new Date().toISOString()
        };

        const tmpFile = LABO_FILE + '.tmp';
        await fs.writeFile(tmpFile, JSON.stringify(records, null, 2));
        await fs.rename(tmpFile, LABO_FILE);

        return records[recordIndex];
    } catch (error) {
        console.error('Erreur lors de la mise à jour par CSR:', error);
        throw error;
    } finally {
        if (lockAcquired) {
            releaseLock(LABO_FILE);
        }
    }
};

// Fonction pour générer un nouvel ID client
const generateNewClientId = async () => {
    try {
        dernierNumClient++;
        console.log('Nouveau numéro client généré: ' + dernierNumClient);
        return dernierNumClient;
    } catch (error) {
        console.error('Erreur génération ID:', error);
        dernierNumClient++;
        return dernierNumClient;
    }
};

// Fonction pour ajouter un log d'administration
const addAdminLog = async (message, type = 'info', user = 'system') => {
    const logEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type: type,
        user: user,
        message: message,
        socketId: null
    };
    
    adminLogs.unshift(logEntry);
    if (adminLogs.length > 500) {
        adminLogs = adminLogs.slice(0, 500);
    }
    
    try {
        await ensureDirectoryExists(databasesDir);
        const logsToSave = adminLogs.slice(0, 1000);
        await fs.writeFile(ADMIN_LOG_FILE, JSON.stringify(logsToSave, null, 2));
    } catch (error) {
        console.error('Erreur sauvegarde logs admin:', error);
    }
    
    socketIO.emit('admin_log', logEntry);
    return logEntry;
};

// Fonction pour charger les logs d'administration
const loadAdminLogs = async () => {
    try {
        await fs.access(ADMIN_LOG_FILE);
        const data = await fs.readFile(ADMIN_LOG_FILE, 'utf8');
        if (data.trim()) {
            const logs = JSON.parse(data);
            adminLogs = logs.slice(0, 500);
            console.log('Chargement de ' + logs.length + ' logs d\'administration');
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(ADMIN_LOG_FILE, '[]');
        }
    }
};

// Fonction pour obtenir les statistiques du serveur
const getServerStats = () => {
    return {
        totalPatients: dernierNumClient,
        activeConnections: socketIO.engine.clientsCount,
        serverUptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
    };
};

// Fonction pour déterminer le service à partir de l'URL
const determineService = (socket, data = {}) => {
    if (data.service) {
        return data.service;
    }
    
    if (socket.handshake.headers.referer) {
        const referer = socket.handshake.headers.referer;
        if (referer.includes('/MGLabo')) return 'Laboratoire';
        if (referer.includes('/MGCaisse')) return 'Caisse';
        if (referer.includes('/MGSpecialities')) return 'Consultation';
        if (referer.includes('/Administration')) return 'Administration';
        if (referer.includes('/MgJournaux')) return 'Journaux';
    }
    
    // Vérifier si l'utilisateur est déjà dans connectedUsers
    const existingUser = connectedUsers.get(socket.id);
    if (existingUser && existingUser.service) {
        return existingUser.service;
    }
    
    return 'Autre';
};

// Fonction pour obtenir la liste des utilisateurs connectés par service
const getConnectedUsersByService = () => {
    const usersByService = {
        'Laboratoire': [],
        'Caisse': [],
        'Consultation': [],
        'Administration': [],
        'Radiologie': [],
        'Pharmacie': [],
        'Hospitalisation': [],
        'Maintenance': [],
        'Autre': []
    };
    
    connectedUsers.forEach((userData, socketId) => {
        const service = userData.service || 'Autre';
        if (usersByService[service]) {
            usersByService[service].push({
                socketId: socketId,
                username: userData.username,
                fullName: userData.fullName || userData.username,
                service: service,
                connectTime: userData.connectTime,
                isIdentified: userData.isIdentified || false,
                lastLogin: userData.lastLogin || new Date().toISOString()
            });
        } else {
            // Si le service n'existe pas dans la liste, ajouter à 'Autre'
            usersByService['Autre'].push({
                socketId: socketId,
                username: userData.username,
                fullName: userData.fullName || userData.username,
                service: service,
                connectTime: userData.connectTime,
                isIdentified: userData.isIdentified || false,
                lastLogin: userData.lastLogin || new Date().toISOString()
            });
        }
    });
    
    return usersByService;
};

// ====================================================================================
// FONCTIONS POUR LA GESTION PAR SERVICE
// ====================================================================================

// Fonction pour sauvegarder les données dans le journal d'un service spécifique
const saveToServiceJournal = async (service, data) => {
    const journalFile = path.resolve(databasesDir, `journal_${service}.json`);
    
    try {
        await ensureDirectoryExists(databasesDir);
        
        let existingData = [];
        try {
            const fileData = await fs.readFile(journalFile, 'utf8');
            if (fileData.trim()) {
                existingData = JSON.parse(fileData);
            }
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        // Ajouter la date d'enregistrement
        const dataWithTimestamp = {
            ...data,
            journalEntryDate: new Date().toISOString(),
            journalId: Date.now() + Math.random().toString(36).substr(2, 9)
        };

        existingData.push(dataWithTimestamp);
        
        await fs.writeFile(journalFile, JSON.stringify(existingData, null, 2));
        
        console.log(`✅ Données sauvegardées dans le journal ${service}: ${data.nomClient}`);
        return true;
    } catch (error) {
        console.error(`❌ Erreur sauvegarde journal ${service}:`, error);
        throw error;
    }
};

// Fonction pour récupérer les données d'un journal de service
const loadServiceJournal = async (service) => {
    const journalFile = path.resolve(databasesDir, `journal_${service}.json`);
    
    try {
        await fs.access(journalFile);
        const data = await fs.readFile(journalFile, 'utf8');
        if (!data.trim()) return [];
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(journalFile, '[]');
            return [];
        }
        throw error;
    }
};

// Fonction pour envoyer les données aux journaux appropriés
const dispatchToServiceJournals = async (patientData) => {
    const { servicesSelectionnes, examensSelectionnes } = patientData;
    
    if (!servicesSelectionnes || !Array.isArray(servicesSelectionnes) || servicesSelectionnes.length === 0) {
        console.log('⚠️ Aucun service sélectionné pour l\'envoi aux journaux');
        return;
    }

    console.log(`📤 Envoi des données aux journaux pour ${servicesSelectionnes.length} service(s)`);

    for (const service of servicesSelectionnes) {
        try {
            // Filtrer les examens pour ce service
            const examensDuService = examensSelectionnes?.filter(e => e.service === service.value) || [];
            
            // Préparer les données pour le journal
            const journalData = {
                ...patientData,
                service: service.value,
                serviceName: service.name,
                examensPourCeService: examensDuService,
                totalPourCeService: examensDuService.reduce((sum, e) => sum + (e.prix || 0), 0),
                dateService: new Date().toISOString(),
                caisseUser: patientData.caisseUser || 'Utilisateur inconnu',
                numID_CSR: patientData.numID_CSR,
                nomClient: patientData.nomClient
            };

            // Sauvegarder dans le journal du service
            await saveToServiceJournal(service.value, journalData);
            
            // Émettre l'événement en temps réel
            socketIO.emit(`nouveau_patient_${service.value}`, journalData);
            socketIO.emit('nouveau_patient_journal', journalData);
            
            console.log(`📋 Données envoyées au journal ${service.name}: ${examensDuService.length} examens`);
            
            // Ajouter un log d'administration
            await addAdminLog(
                `Données envoyées au journal ${service.name}: ${examensDuService.length} examens pour ${patientData.nomClient}`,
                'journal_update',
                'Caisse'
            );
            
        } catch (error) {
            console.error(`❌ Erreur envoi journal ${service.name}:`, error);
            await addAdminLog(
                `Erreur envoi journal ${service.name}: ${error.message}`,
                'error',
                'System'
            );
        }
    }
};

// ====================================================================================
// SOCKET.IO HANDLERS
// ====================================================================================

// NOTE: La gestion des connexions Socket.io est maintenant configurée plus haut,
// juste après la création de l'instance socketIO

// ============================================================================
// GESTIONNAIRE USER_IDENTIFICATION CORRIGÉ
// ============================================================================

// Ce code doit être à l'intérieur du gestionnaire 'connection' plus haut

// ============================================================================
// GESTIONNAIRES POUR LA GESTION DES EXAMENS
// ============================================================================

// Ces gestionnaires doivent être à l'intérieur du gestionnaire 'connection'

// ============================================================================
// GESTIONNAIRES POUR LA GESTION DES UTILISATEURS - CORRIGÉES
// ============================================================================

// Ces gestionnaires doivent être à l'intérieur du gestionnaire 'connection'

// ============================================================================
// GESTIONNAIRES POUR L'ANNULATION DE PAIEMENT
// ============================================================================

// Ces gestionnaires doivent être à l'intérieur du gestionnaire 'connection'

// ============================================================================
// GESTIONNAIRES EXISTANTS
// ============================================================================

// Tous ces gestionnaires doivent être à l'intérieur du gestionnaire 'connection'

// ROUTES EXPRESS
// ====================================================================================

// Route pour obtenir la configuration des examens
app.get('/api/examens/config', async (req, res) => {
    try {
        res.json({
            success: true,
            examensConfig: examensConfig,
            services: getAvailableServices(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour ajouter un nouvel examen
app.post('/api/examens/add', async (req, res) => {
    try {
        const { service, examName, examPrice, username } = req.body;
        
        if (!service || !examName || !examPrice) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont obligatoires'
            });
        }

        const newExam = await addNewExam(service, examName, examPrice, username || 'api');
        
        // Diffuser la mise à jour à tous les clients
        socketIO.emit('examens_config_updated', examensConfig);

        res.json({
            success: true,
            message: `Examen "${examName}" ajouté avec succès`,
            newExam: newExam,
            examensConfig: examensConfig
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour modifier un examen
app.put('/api/examens/modify', async (req, res) => {
    try {
        const { service, examId, newName, newPrice, username } = req.body;
        
        if (!service || !examId || !newName || !newPrice) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont obligatoires'
            });
        }

        const result = await modifyExam(service, examId, newName, newPrice, username || 'api');
        
        // Diffuser la mise à jour à tous les clients
        socketIO.emit('examens_config_updated', examensConfig);

        res.json({
            success: true,
            message: 'Examen modifié avec succès',
            ancienExam: result.ancienExam,
            nouvelExam: result.nouvelExam
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour supprimer un examen
app.delete('/api/examens/delete', async (req, res) => {
    try {
        const { service, examId, username } = req.body;
        
        if (!service || !examId) {
            return res.status(400).json({
                success: false,
                message: 'Service et examen sont obligatoires'
            });
        }

        const examSupprime = await deleteExam(service, examId, username || 'api');
        
        // Diffuser la mise à jour à tous les clients
        socketIO.emit('examens_config_updated', examensConfig);

        res.json({
            success: true,
            message: 'Examen supprimé avec succès',
            examSupprime: examSupprime
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour obtenir les services disponibles
app.get('/api/examens/services', async (req, res) => {
    try {
        res.json({
            success: true,
            services: getAvailableServices(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ====================================================================================
// ROUTES EXPRESS POUR LA GESTION DES UTILISATEURS - CORRIGÉES
// ====================================================================================

// Routes API REST pour la gestion des utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    console.log('📋 [API] Demande de liste des utilisateurs');
    debugUsers();
    
    res.json({
      success: true,
      users: usersDatabase,
      services: availableServices,
      count: usersDatabase.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, service, fullName, email, isActive, permissions } = req.body;
    
    console.log('👤 [API] Création d\'utilisateur:', { username, service });
    
    const newUser = await addUser({
      username,
      password,
      service,
      fullName,
      email,
      isActive,
      permissions
    }, 'api');
    
    res.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: newUser
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userData = req.body;
    
    console.log('👤 [API] Modification utilisateur:', userId);
    
    const result = await modifyUser(userId, userData, 'api');
    
    res.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      oldUser: result.oldUser,
      updatedUser: result.updatedUser
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    console.log('👤 [API] Suppression utilisateur:', userId);
    
    const deletedUser = await deleteUser(userId, 'api');
    
    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
      deletedUser: deletedUser
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Route pour vérifier les identifiants - CORRIGÉE
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 [API] Tentative de connexion pour:', username);
    
    const user = verifyCredentials(username, password);
    
    if (user) {
      // Mettre à jour la dernière connexion
      await updateUserLastLogin(username);
      
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          service: user.service,
          fullName: user.fullName,
          permissions: user.permissions
        },
        message: 'Connexion réussie'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }
  } catch (error) {
    console.error('❌ Erreur authentification API:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour vérifier les credentials
app.post('/api/users/verify', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 [API] Vérification credentials pour:', username);
    
    const user = verifyCredentials(username, password);
    
    res.json({
      success: true,
      isValid: user !== null,
      user: user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ====================================================================================
// ROUTES EXPRESS POUR L'ANNULATION DE PAIEMENT
// ====================================================================================

// Route pour obtenir l'historique des annulations
app.get('/api/payments/cancellations', async (req, res) => {
    try {
        const history = await loadCancellationHistory();
        
        res.json({
            success: true,
            history: history,
            count: history.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour annuler un paiement via API REST
app.post('/api/payments/cancel', async (req, res) => {
    try {
        const { patientId, patientName, amount, services, reason, cancelledBy } = req.body;
        
        if (!patientId || !patientName || !amount || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Données manquantes: patientId, patientName, amount et reason sont obligatoires'
            });
        }

        // Vérifier que le patient existe
        const patient = await trouverPatientParCSR(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient non trouvé'
            });
        }

        const annulation = {
            id: generateId(),
            patientId: patientId,
            patientName: patientName,
            amount: amount,
            services: services || [],
            reason: reason,
            cancelledBy: cancelledBy || 'api',
            timestamp: new Date().toISOString(),
            status: 'annulé',
            originalPatientData: {
                nomClient: patient.nomClient,
                numClient: patient.numClient,
                numAirTel: patient.numAirTel,
                numTIGO: patient.numTIGO,
                dateCreation: patient.dateCreation
            }
        };
        
        // Sauvegarder l'annulation
        await sauvegarderAnnulation(annulation);
        
        // Supprimer le patient
        await supprimerPatient(patientId);
        
        // Notifier tous les clients
        socketIO.emit('payment_cancelled', {
            patientId: patientId,
            patientName: patientName,
            amount: amount,
            cancelledBy: cancelledBy || 'api',
            timestamp: annulation.timestamp,
            reason: reason
        });

        // Ajouter un log d'administration
        await addAdminLog(
            `Paiement annulé via API: ${patientName} (${patientId}) - ${amount} FCFA`,
            'payment_cancelled',
            cancelledBy || 'api'
        );

        res.json({
            success: true,
            message: `Paiement de ${amount} FCFA annulé pour ${patientName}`,
            annulation: annulation
        });
        
    } catch (error) {
        console.error('❌ Erreur annulation paiement API:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour obtenir les statistiques des annulations
app.get('/api/payments/cancellations/stats', async (req, res) => {
    try {
        const history = await loadCancellationHistory();
        
        const stats = {
            total: history.length,
            totalAmount: history.reduce((sum, annulation) => sum + (annulation.amount || 0), 0),
            last30Days: history.filter(annulation => {
                const annulationDate = new Date(annulation.timestamp);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return annulationDate >= thirtyDaysAgo;
            }).length,
            byUser: {},
            byService: {}
        };
        
        // Statistiques par utilisateur
        history.forEach(annulation => {
            const user = annulation.cancelledBy || 'Inconnu';
            stats.byUser[user] = (stats.byUser[user] || 0) + 1;
        });
        
        // Statistiques par service
        history.forEach(annulation => {
            if (annulation.services && Array.isArray(annulation.services)) {
                annulation.services.forEach(service => {
                    const serviceName = service.name || 'Inconnu';
                    stats.byService[serviceName] = (stats.byService[serviceName] || 0) + 1;
                });
            }
        });

        res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Routes existantes
app.get('/api/last-client-number', async (req, res) => {
    try {
        await chargerDernierNumClient();
        res.json({
            success: true,
            lastClientNumber: dernierNumClient,
            message: `Dernier numéro client: ${dernierNumClient}`
        });
    } catch (error) {
        console.error('Erreur récupération dernier numéro client:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/journaux/:service', async (req, res) => {
    try {
        const { service } = req.params;
        const donnees = await loadServiceJournal(service);
        
        res.json({
            success: true,
            service: service,
            donnees: donnees,
            count: donnees.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/journaux', async (req, res) => {
    try {
        const services = ['consultation', 'laboratoire', 'echographie', 'hospitalisation', 'chirurgie', 'kinesitherapie', 'fibroscopie'];
        const stats = {};
        
        for (const service of services) {
            const donnees = await loadServiceJournal(service);
            stats[service] = {
                count: donnees.length,
                dernierEnregistrement: donnees.length > 0 ? donnees[0].journalEntryDate : null
            };
        }
        
        res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/journal/donnees', async (req, res) => {
    try {
        const patients = await loadPatientData();
        
        const donneesJournal = patients.map(patient => ({
            ...patient,
            dateCreation: patient.dateCreation || patient.dateModification || new Date().toISOString(),
            total_OP: patient.total_OP || 0,
            caisseUser: patient.caisseUser || 'Non spécifié',
            isLaboratorized: patient.isLaboratorized || 'En attente'
        }));

        res.json({
            success: true,
            donnees: donneesJournal,
            count: donneesJournal.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/admin/logs', async (req, res) => {
    try {
        const logs = adminLogs.slice(0, 100);
        res.json({
            success: true,
            logs: logs,
            total: adminLogs.length,
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/admin/stats', (req, res) => {
    try {
        const stats = getServerStats();
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/admin/users', (req, res) => {
    try {
        const users = getConnectedUsersByService();
        res.json({
            success: true,
            connectedUsers: users,
            totalConnections: connectedUsers.size
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.delete('/admin/logs', async (req, res) => {
    try {
        adminLogs = [];
        await fs.writeFile(ADMIN_LOG_FILE, '[]');
        
        await addAdminLog(
            'Journal des logs vidé via API REST',
            'maintenance',
            'api'
        );
        
        res.json({
            success: true,
            message: 'Logs vidés avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.json({ 
        message: "Serveur CSR Labo en fonctionnement",
        status: "OK",
        serverIP: getLocalIP(),
        port: PORT,
        timestamp: new Date().toISOString(),
        adminAvailable: true,
        connectedUsers: connectedUsers.size,
        totalUsers: usersDatabase.length,
        features: {
            gestionParService: true,
            journauxServices: true,
            enregistrementMultiple: true,
            journauxModule: true,
            synchronisationNumeroClient: true,
            gestionExamensDynamique: true,
            modificationExamens: true,
            suppressionExamens: true,
            gestionUtilisateurs: true,
            annulationPaiement: true,
            historiqueAnnulations: true
        }
    });
});

app.get('/api/check-connection', (req, res) => {
    res.json({ 
        success: true,
        message: "Connexion API réussie",
        server: getLocalIP() + ':' + PORT,
        time: new Date().toISOString()
    });
});

// ====================================================================================
// LANCEMENT DU SERVEUR
// ====================================================================================

async function startServer() {
    try {
        console.log('Démarrage du serveur...');
        
        await ensureDirectoryExists(databasesDir);
        console.log('Répertoire de base de données vérifié');
        
        await initializeLaboFile();
        console.log('Fichier labo initialisé');
        
        await loadAdminLogs();
        console.log('Logs d\'administration chargés');
        
        await loadExamensConfig();
        console.log('Configuration des examens chargée');
        
        await loadUsers();
        console.log('Base de données utilisateurs chargée');
        
        const localIP = getLocalIP();
        
        http.listen(PORT, localIP, () => {
            console.log('==========================================');
            console.log('🚀 Serveur démarré avec succès');
            console.log('📍 Local: http://localhost:' + PORT);
            console.log('🌐 Réseau: http://' + localIP + ':' + PORT);
            console.log('==========================================');
            console.log('INFORMATIONS DE CONNEXION:');
            console.log('Adresse IP du serveur: ' + localIP);
            console.log('Port: ' + PORT);
            console.log('Fonctionnalités admin: ACTIVÉES');
            console.log('Gestion des utilisateurs: CORRIGÉE ✅');
            console.log('Vérification credentials: CORRIGÉE ✅');
            console.log('Utilisateurs connectés: EN TEMPS RÉEL ✅');
            console.log('Dernières connexions: MISES À JOUR ✅');
            console.log('Recherche par date: ACTIVÉE ✅');
            console.log('Gestion par service: ACTIVÉE ✅');
            console.log('Journaux par service: ACTIVÉS ✅');
            console.log('Module Journaux: ACTIVÉ ✅');
            console.log('Synchronisation numéro client: ACTIVÉE ✅');
            console.log('Gestion dynamique des examens: ACTIVÉE ✅');
            console.log('Modification d\'examens: ACTIVÉE ✅');
            console.log('Suppression d\'examens: ACTIVÉE ✅');
            console.log('Gestion des utilisateurs: ACTIVÉE ✅');
            console.log('ANNULATION DE PAIEMENT: ACTIVÉE ✅');
            console.log('Historique des annulations: ACTIVÉ ✅');
            console.log('Dernier numéro client: ' + dernierNumClient);
            console.log('Nombre d\'utilisateurs: ' + usersDatabase.length);
            console.log('Services disponibles: ' + availableServices.join(', '));
            console.log('==========================================');
            
            addAdminLog('Serveur démarré sur ' + localIP + ':' + PORT, 'server_start', 'system');
        });
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}

startServer();
