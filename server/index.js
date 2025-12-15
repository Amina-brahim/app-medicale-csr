const express = require('express');
const app = express();
const cors = require("cors");
const http = require('http').Server(app);
const PORT = 4600;
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

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

// Mettre à jour la configuration Socket.IO également
socketIO.on('connection', (socket) => {
    // VOTRE LOGIQUE EXISTANTE (tout ce qui vient après)
    // ...
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

// Configuration Socket.io
const socketIO = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
        credentials: true,
        transports: ['websocket', 'polling']
    },
    allowEIO3: true
});

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

socketIO.on('connection', (socket) => {
    console.log('Nouvelle connexion Socket.io: ' + socket.id);
    
    const userService = determineService(socket);
    const userData = {
        service: userService,
        username: 'En attente d\'identification...',
        fullName: 'Utilisateur non identifié',
        connectTime: new Date().toISOString(),
        ip: socket.handshake.address,
        isIdentified: false
    };
    
    connectedUsers.set(socket.id, userData);
    
    addAdminLog('Nouvelle connexion détectée: ' + socket.id, 'connection', 'system');
    
    // Notifier de la nouvelle connexion
    socketIO.emit('user_connected', {
        socketId: socket.id,
        service: userService,
        username: userData.username,
        fullName: userData.fullName,
        connectTime: userData.connectTime,
        connectedUsers: getConnectedUsersByService()
    });
    
    socket.emit('server_info', {
        serverIP: getLocalIP(),
        serverPort: PORT,
        connectionType: 'socket.io'
    });

    initializeLaboFile().catch(console.error);

    // ============================================================================
    // GESTIONNAIRE USER_IDENTIFICATION CORRIGÉ
    // ============================================================================

    socket.on('user_identification', async (userInfo) => {
      try {
        console.log('🔐 Identification utilisateur:', userInfo);
        
        // Vérifier les credentials si fournis
        let user = null;
        if (userInfo.username && userInfo.password) {
          user = verifyCredentials(userInfo.username, userInfo.password);
        } else {
          // Chercher l'utilisateur dans la base
          user = usersDatabase.find(u => 
            u.username.toLowerCase() === userInfo.username.toLowerCase() && 
            u.isActive === true
          );
        }

        if (!user) {
          console.log('❌ Identification échouée pour:', userInfo.username);
          socket.emit('identification_failed', { message: 'Identifiants invalides ou utilisateur inactif' });
          return;
        }

        // Mettre à jour la dernière connexion
        await updateUserLastLogin(userInfo.username);

        const userData = {
          service: user.service,
          username: user.username,
          fullName: user.fullName || user.username,
          connectTime: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isIdentified: true,
          userId: user.id,
          permissions: user.permissions || []
        };
        
        connectedUsers.set(socket.id, userData);
        
        console.log(`✅ Utilisateur identifié: ${user.username} (${user.service})`);

        // Envoyer la confirmation au client
        socket.emit('identification_confirmed', {
          success: true,
          user: userData,
          message: `Identifié avec succès comme ${user.username} (${user.service})`
        });

        // Notifier tous les clients de la mise à jour
        socketIO.emit('user_connected', {
          socketId: socket.id,
          service: userData.service,
          username: userData.username,
          fullName: userData.fullName,
          connectTime: userData.connectTime,
          connectedUsers: getConnectedUsersByService()
        });

        // Mettre à jour la liste des utilisateurs pour l'administration
        socketIO.emit('users_list_updated', {
          users: usersDatabase,
          connectedUsers: getConnectedUsersByService()
        });
        
        await addAdminLog(
          `Utilisateur connecté: ${user.username} (${user.service})`,
          'user_connection',
          user.username
        );
        
      } catch (error) {
        console.error('❌ Erreur identification:', error);
        socket.emit('identification_failed', { message: 'Erreur lors de l\'identification' });
      }
    });

    // ============================================================================
    // GESTIONNAIRES POUR LA GESTION DES EXAMENS
    // ============================================================================

    socket.on('add_new_exam', async (examData, callback) => {
        console.log('🔧 [SERVER] Demande d\'ajout nouvel examen:', examData);
        
        try {
            const { service, examName, examPrice, username } = examData;
            
            const newExam = await addNewExam(service, examName, examPrice, username);
            
            // Diffuser la mise à jour à tous les clients
            socketIO.emit('examens_config_updated', examensConfig);
            
            console.log('🔧 [SERVER] Configuration diffusée à tous les clients');
            
            if (callback) {
                callback({
                    success: true,
                    message: `✅ Examen "${examName}" ajouté avec succès au service ${service} pour ${examPrice} FCFA`,
                    newExam: newExam
                });
            }
            
        } catch (error) {
            console.error('❌ [SERVER] Erreur ajout nouvel examen:', error);
            
            if (callback) {
                callback({
                    success: false,
                    message: '❌ Erreur lors de l\'ajout: ' + error.message
                });
            }
            
            await addAdminLog(
                'Erreur ajout examen: ' + error.message,
                'error',
                examData.username || 'admin'
            );
        }
    });

    // Gestionnaire pour modifier un examen
    socket.on('modify_exam', async (examData, callback) => {
        console.log('🔧 [SERVER] Demande de modification d\'examen:', examData);
        
        try {
            const { service, examId, newName, newPrice, username } = examData;
            
            const result = await modifyExam(service, examId, newName, newPrice, username);
            
            // Diffuser la mise à jour à tous les clients
            socketIO.emit('examens_config_updated', examensConfig);
            
            console.log('🔧 [SERVER] Configuration modifiée diffusée à tous les clients');
            
            if (callback) {
                callback({
                    success: true,
                    message: `✅ Examen "${result.ancienExam.name}" modifié avec succès`,
                    ancienExam: result.ancienExam,
                    nouvelExam: result.nouvelExam
                });
            }
            
        } catch (error) {
            console.error('❌ [SERVER] Erreur modification examen:', error);
            
            if (callback) {
                callback({
                    success: false,
                    message: '❌ Erreur lors de la modification: ' + error.message
                });
            }
            
            await addAdminLog(
                'Erreur modification examen: ' + error.message,
                'error',
                examData.username || 'admin'
            );
        }
    });

    // Gestionnaire pour supprimer un examen
    socket.on('delete_exam', async (examData, callback) => {
        console.log('🔧 [SERVER] Demande de suppression d\'examen:', examData);
        
        try {
            const { service, examId, username } = examData;
            
            const examSupprime = await deleteExam(service, examId, username);
            
            // Diffuser la mise à jour à tous les clients
            socketIO.emit('examens_config_updated', examensConfig);
            
            console.log('🔧 [SERVER] Configuration mise à jour diffusée à tous les clients après suppression');
            
            if (callback) {
                callback({
                    success: true,
                    message: `✅ Examen "${examSupprime.name}" supprimé avec succès`,
                    examSupprime: examSupprime
                });
            }
            
        } catch (error) {
            console.error('❌ [SERVER] Erreur suppression examen:', error);
            
            if (callback) {
                callback({
                    success: false,
                    message: '❌ Erreur lors de la suppression: ' + error.message
                });
            }
            
            await addAdminLog(
                'Erreur suppression examen: ' + error.message,
                'error',
                examData.username || 'admin'
            );
        }
    });

    socket.on('get_examens_config', async (callback) => {
        try {
            if (callback) {
                callback({
                    success: true,
                    examensConfig: examensConfig,
                    services: getAvailableServices()
                });
            }
        } catch (error) {
            console.error('❌ Erreur récupération configuration examens:', error);
            if (callback) {
                callback({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    socket.on('get_available_services', async (callback) => {
        try {
            if (callback) {
                callback({
                    success: true,
                    services: getAvailableServices()
                });
            }
        } catch (error) {
            console.error('❌ Erreur récupération services:', error);
            if (callback) {
                callback({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    // ============================================================================
    // GESTIONNAIRES POUR LA GESTION DES UTILISATEURS - CORRIGÉS
    // ============================================================================

    socket.on('get_users_list', async (callback) => {
      try {
        console.log('📋 [SERVER] Demande de liste des utilisateurs');
        debugUsers();
        
        if (callback) {
          callback({
            success: true,
            users: usersDatabase,
            services: availableServices,
            count: usersDatabase.length
          });
        }
      } catch (error) {
        console.error('❌ Erreur récupération liste utilisateurs:', error);
        if (callback) {
          callback({
            success: false,
            message: error.message
          });
        }
      }
    });

    socket.on('add_new_user', async (userData, callback) => {
      console.log('👤 [SERVER] Demande d\'ajout nouvel utilisateur:', userData);
      
      try {
        const newUser = await addUser(userData, userData.adminUsername);
        
        if (callback) {
          callback({
            success: true,
            message: `✅ Utilisateur "${newUser.username}" créé avec succès`,
            newUser: newUser
          });
        }
        
      } catch (error) {
        console.error('❌ [SERVER] Erreur ajout utilisateur:', error);
        
        if (callback) {
          callback({
            success: false,
            message: '❌ Erreur lors de la création: ' + error.message
          });
        }
      }
    });

    socket.on('modify_user', async (userData, callback) => {
      console.log('👤 [SERVER] Demande de modification utilisateur:', userData);
      
      try {
        const result = await modifyUser(userData.userId, userData, userData.adminUsername);
        
        if (callback) {
          callback({
            success: true,
            message: `✅ Utilisateur "${result.updatedUser.username}" modifié avec succès`,
            oldUser: result.oldUser,
            updatedUser: result.updatedUser
          });
        }
        
      } catch (error) {
        console.error('❌ [SERVER] Erreur modification utilisateur:', error);
        
        if (callback) {
          callback({
            success: false,
            message: '❌ Erreur lors de la modification: ' + error.message
          });
        }
      }
    });

    socket.on('delete_user', async (userData, callback) => {
      console.log('👤 [SERVER] Demande de suppression utilisateur:', userData);
      
      try {
        const deletedUser = await deleteUser(userData.userId, userData.adminUsername);
        
        if (callback) {
          callback({
            success: true,
            message: `✅ Utilisateur "${deletedUser.username}" supprimé avec succès`,
            deletedUser: deletedUser
          });
        }
        
      } catch (error) {
        console.error('❌ [SERVER] Erreur suppression utilisateur:', error);
        
        if (callback) {
          callback({
            success: false,
            message: '❌ Erreur lors de la suppression: ' + error.message
          });
        }
      }
    });

    // GESTIONNAIRE VERIFY CREDENTIALS CORRIGÉ
    socket.on('verify_user_credentials', async (credentials, callback) => {
      try {
        console.log('🔐 [SERVER] Vérification des identifiants pour:', credentials.username);
        const user = verifyCredentials(credentials.username, credentials.password);
        
        if (callback) {
          callback({
            success: true,
            isValid: user !== null,
            user: user
          });
        }
      } catch (error) {
        console.error('❌ Erreur vérification credentials:', error);
        if (callback) {
          callback({
            success: false,
            message: error.message
          });
        }
      }
    });

    // Gestionnaire pour obtenir les utilisateurs connectés détaillés
    socket.on('get_connected_users_detailed', (callback) => {
      try {
        const connectedUsersDetailed = getConnectedUsersByService();
        const totalConnected = Array.from(connectedUsers.values()).filter(user => user.isIdentified).length;
        
        if (callback) {
          callback({
            success: true,
            connectedUsers: connectedUsersDetailed,
            totalConnected: totalConnected,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Erreur get_connected_users_detailed:', error);
        if (callback) {
          callback({
            success: false,
            message: error.message
          });
        }
      }
    });

    // ============================================================================
    // GESTIONNAIRES POUR L'ANNULATION DE PAIEMENT
    // ============================================================================

    socket.on('cancel_patient_payment', async (data, callback) => {
        try {
            console.log('🔔 [SERVER] Annulation de paiement demandée:', data);
            
            // 1. Vérifier que le patient existe
            const patient = await trouverPatientParCSR(data.patientId);
            if (!patient) {
                console.log('❌ [SERVER] Patient non trouvé:', data.patientId);
                if (callback) {
                    callback({ 
                        success: false, 
                        message: 'Patient non trouvé' 
                    });
                }
                return;
            }

            console.log(`✅ [SERVER] Patient trouvé: ${patient.nomClient} - ${data.amount} FCFA`);

            // 2. Enregistrer l'annulation dans l'historique
            const annulation = {
                id: generateId(),
                patientId: data.patientId,
                patientName: data.patientName,
                amount: data.amount,
                services: data.services,
                reason: data.reason,
                cancelledBy: data.cancelledBy,
                timestamp: data.timestamp,
                status: 'annulé',
                originalPatientData: {
                    nomClient: patient.nomClient,
                    numClient: patient.numClient,
                    numAirTel: patient.numAirTel,
                    numTIGO: patient.numTIGO,
                    dateCreation: patient.dateCreation
                }
            };
            
            // 3. Sauvegarder dans la base de données
            await sauvegarderAnnulation(annulation);
            
            // 4. Supprimer le patient de la liste active
            const patientSupprime = await supprimerPatient(data.patientId);
            
            // 5. Notifier tous les clients
            socketIO.emit('payment_cancelled', {
                patientId: data.patientId,
                patientName: data.patientName,
                amount: data.amount,
                cancelledBy: data.cancelledBy,
                timestamp: data.timestamp,
                reason: data.reason
            });

            // 6. Émettre également l'événement de mise à jour générale
            socketIO.emit('patient_deleted', {
                patientId: data.patientId,
                deletedBy: data.cancelledBy,
                timestamp: data.timestamp
            });

            // 7. Ajouter un log d'administration
            await addAdminLog(
                `Paiement annulé: ${data.patientName} (${data.patientId}) - ${data.amount} FCFA - Motif: ${data.reason}`,
                'payment_cancelled',
                data.cancelledBy
            );

            console.log(`✅ [SERVER] Paiement annulé avec succès pour ${data.patientName}`);

            if (callback) {
                callback({ 
                    success: true, 
                    message: `Paiement de ${data.amount} FCFA annulé pour ${data.patientName}`,
                    annulation: annulation
                });
            }
            
        } catch (error) {
            console.error('❌ [SERVER] Erreur lors de l\'annulation:', error);
            
            await addAdminLog(
                `Erreur annulation paiement: ${error.message}`,
                'error',
                data.cancelledBy || 'system'
            );

            if (callback) {
                callback({ 
                    success: false, 
                    message: 'Erreur interne du serveur: ' + error.message 
                });
            }
        }
    });

    // Gestionnaire pour récupérer l'historique des annulations
    socket.on('get_cancellation_history', async (callback) => {
        try {
            const history = await loadCancellationHistory();
            
            if (callback) {
                callback({
                    success: true,
                    history: history,
                    count: history.length,
                    message: `${history.length} annulation(s) trouvée(s)`
                });
            }
        } catch (error) {
            console.error('❌ Erreur récupération historique annulations:', error);
            if (callback) {
                callback({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    // Gestionnaire pour rechercher un patient pour annulation
    socket.on('search_patient_for_cancellation', async (patientId, callback) => {
        try {
            const patient = await trouverPatientParCSR(patientId);
            
            if (callback) {
                callback({
                    success: true,
                    patient: patient,
                    found: patient !== null
                });
            }
        } catch (error) {
            console.error('❌ Erreur recherche patient annulation:', error);
            if (callback) {
                callback({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    // ============================================================================
    // GESTIONNAIRES EXISTANTS
    // ============================================================================

    socket.on('get_last_client_number', async (callback) => {
        try {
            await chargerDernierNumClient();
            if (callback) {
                callback({
                    success: true,
                    lastClientNumber: dernierNumClient
                });
            }
            console.log(`📊 Dernier numéro client envoyé: ${dernierNumClient}`);
        } catch (error) {
            console.error('Erreur get_last_client_number:', error);
            if (callback) {
                callback({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    socket.on('recuperer_donnees_journal', async (callback) => {
        try {
            console.log('📥 Demande de récupération des données du journal');
            
            // Charger toutes les données des patients
            const patients = await loadPatientData();
            
            // Formater les données pour l'affichage dans le journal
            const donneesJournal = patients.map(patient => ({
                ...patient,
                dateCreation: patient.dateCreation || patient.dateModification || new Date().toISOString(),
                total_OP: patient.total_OP || 0,
                caisseUser: patient.caisseUser || 'Non spécifié',
                isLaboratorized: patient.isLaboratorized || 'En attente'
            }));

            console.log(`✅ ${donneesJournal.length} patients chargés pour le journal`);

            if (callback) {
                callback({
                    success: true,
                    donnees: donneesJournal,
                    count: donneesJournal.length,
                    message: `${donneesJournal.length} patients chargés`
                });
            }
        } catch (error) {
            console.error('❌ Erreur récupération données journal:', error);
            if (callback) {
                callback({
                    success: false,
                    message: 'Erreur lors du chargement: ' + error.message
                });
            }
        }
    });

    socket.on('recuperer_donnees_service', async (service, callback) => {
        try {
            console.log(`📥 Demande de récupération des données pour le service: ${service}`);
            const donnees = await loadServiceJournal(service);
            
            if (callback) {
                callback({ 
                    success: true, 
                    donnees,
                    count: donnees.length,
                    service: service
                });
            }
        } catch (error) {
            console.error("Erreur récupération données service:", error);
            if (callback) callback({ 
                success: false, 
                error: error.message 
            });
        }
    });

    socket.on('sauvegarder_journal', async ({ service, donnees }, callback) => {
        try {
            const journalFile = path.resolve(databasesDir, `journal_${service}.json`);
            
            // Ajouter des timestamps aux données
            const donneesAvecTimestamps = donnees.map(item => ({
                ...item,
                journalEntryDate: item.journalEntryDate || new Date().toISOString(),
                journalId: item.journalId || Date.now() + Math.random().toString(36).substr(2, 9)
            }));
            
            await fs.writeFile(journalFile, JSON.stringify(donneesAvecTimestamps, null, 2));
            
            await addAdminLog(
                `Journal ${service} sauvegardé: ${donnees.length} entrées`,
                'journal_save',
                'System'
            );

            if (callback) {
                callback({ 
                    success: true, 
                    message: `Journal ${service} sauvegardé avec succès` 
                });
            }
        } catch (error) {
            console.error('Erreur sauvegarde journal:', error);
            if (callback) {
                callback({ 
                    success: false, 
                    error: error.message 
                });
            }
        }
    });

    socket.on('admin_login', async (adminData, callback) => {
        try {
            const isValid = adminData.username === 'admin' && adminData.password === 'admin123';
            
            if (isValid) {
                // Mettre à jour la dernière connexion
                await updateUserLastLogin(adminData.username);

                const userData = {
                    service: 'Administration',
                    username: adminData.username,
                    fullName: 'Administrateur Principal',
                    connectTime: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    isIdentified: true,
                    userId: 1
                };
                
                connectedUsers.set(socket.id, userData);
                
                await addAdminLog('Connexion administrateur: ' + adminData.username, 'admin_login', adminData.username);
                
                // Envoyer les données mises à jour
                socket.emit('examens_config_updated', examensConfig);
                socket.emit('admin_logs_history', adminLogs.slice(0, 100));
                socket.emit('server_stats', getServerStats());
                socket.emit('connected_users', getConnectedUsersByService());
                socket.emit('users_list_updated', {
                    users: usersDatabase,
                    connectedUsers: getConnectedUsersByService()
                });
                
                if (callback) {
                    callback({ success: true, message: 'Connexion réussie' });
                }
            } else {
                await addAdminLog('Tentative de connexion admin échouée: ' + adminData.username, 'security', adminData.username);
                if (callback) callback({ success: false, message: 'Identifiants incorrects' });
            }
        } catch (error) {
            console.error('Erreur admin_login:', error);
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('admin_logout', (adminData) => {
        addAdminLog(
            'Déconnexion administrateur: ' + adminData.username,
            'admin_logout',
            adminData.username
        );
    });

    socket.on('get_admin_logs', async (callback) => {
        try {
            if (callback) {
                callback({
                    success: true,
                    logs: adminLogs.slice(0, 200),
                    total: adminLogs.length
                });
            }
        } catch (error) {
            console.error('Erreur get_admin_logs:', error);
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('get_server_stats', (callback) => {
        try {
            const stats = getServerStats();
            if (callback) {
                callback({ success: true, stats: stats });
            }
        } catch (error) {
            console.error('Erreur get_server_stats:', error);
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('get_connected_users', (callback) => {
        try {
            const users = getConnectedUsersByService();
            if (callback) {
                callback({ success: true, connectedUsers: users });
            }
        } catch (error) {
            console.error('Erreur get_connected_users:', error);
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('clear_admin_logs', async (adminData, callback) => {
        try {
            adminLogs = [];
            await fs.writeFile(ADMIN_LOG_FILE, '[]');
            
            await addAdminLog(
                'Journal des logs vidé par l\'administrateur',
                'maintenance',
                adminData.username
            );
            
            if (callback) {
                callback({ success: true, message: 'Logs vidés avec succès' });
            }
        } catch (error) {
            console.error('Erreur clear_admin_logs:', error);
            if (callback) callback({ success: false, message: error.message });
        }
    });

    socket.on('search_patients_by_date', async (data, callback) => {
        console.log('🔍 [SERVER] Recherche de patients par date reçue:', data);
        
        try {
            if (!data || !data.date) {
                console.log('❌ [SERVER] Date manquante dans la requête');
                if (callback) {
                    callback({
                        success: false,
                        message: 'Date manquante'
                    });
                }
                return;
            }

            await addAdminLog(
                'Recherche patients par date: ' + data.date,
                'search',
                data.username || 'admin'
            );

            // Charger tous les patients
            const patients = await loadPatientData();
            console.log(`📊 [SERVER] ${patients.length} patients chargés`);

            // Convertir la date de recherche
            const searchDate = new Date(data.date);
            if (isNaN(searchDate.getTime())) {
                console.log('❌ [SERVER] Format de date invalide:', data.date);
                if (callback) {
                    callback({
                        success: false,
                        message: 'Format de date invalide'
                    });
                }
                return;
            }

            // Normaliser la date (toute la journée)
            const searchDateStart = new Date(searchDate);
            searchDateStart.setHours(0, 0, 0, 0);
            
            const searchDateEnd = new Date(searchDate);
            searchDateEnd.setHours(23, 59, 59, 999);

            console.log('📅 [SERVER] Recherche entre:', searchDateStart.toISOString(), 'et', searchDateEnd.toISOString());

            // Filtrer les patients
            const results = patients.filter(patient => {
                try {
                    // Chercher une date valide dans le patient
                    const patientDateStr = patient.dateCreation || patient.dateModification || patient.lastUpdate;
                    
                    if (!patientDateStr) {
                        return false;
                    }

                    const patientDate = new Date(patientDateStr);
                    if (isNaN(patientDate.getTime())) {
                        return false;
                    }

                    const isInRange = patientDate >= searchDateStart && patientDate <= searchDateEnd;
                    
                    if (isInRange) {
                        console.log(`✅ [SERVER] Patient trouvé: ${patient.nomClient} - ${patientDateStr}`);
                    }
                    
                    return isInRange;
                } catch (error) {
                    console.error('❌ [SERVER] Erreur traitement patient:', error);
                    return false;
                }
            });

            console.log(`🎯 [SERVER] Recherche terminée: ${results.length} patients trouvés`);

            // Formater les résultats pour l'affichage
            const formattedResults = results.map(patient => ({
                numID_CSR: patient.numID_CSR,
                nomClient: patient.nomClient || 'Nom non disponible',
                numClient: patient.numClient,
                isLaboratorized: patient.isLaboratorized || 'Non défini',
                dateCreation: patient.dateCreation,
                dateModification: patient.dateModification,
                lastUpdate: patient.lastUpdate || patient.dateCreation || patient.dateModification
            }));

            // Émettre également un événement pour le suivi
            socket.emit('search_patients_result', {
                success: true,
                patients: formattedResults,
                count: results.length,
                searchDate: data.date
            });

            // Répondre via le callback
            if (callback) {
                callback({
                    success: true,
                    patients: formattedResults,
                    count: results.length,
                    searchDate: data.date,
                    message: `${results.length} patient(s) trouvé(s)`
                });
            }

            await addAdminLog(
                `Résultat recherche: ${results.length} patient(s) pour ${data.date}`,
                'search_result',
                data.username || 'admin'
            );

        } catch (error) {
            console.error('❌ [SERVER] Erreur recherche patients:', error);
            
            // Émettre l'erreur via événement
            socket.emit('search_patients_result', {
                success: false,
                message: error.message
            });

            if (callback) {
                callback({
                    success: false,
                    message: 'Erreur lors de la recherche: ' + error.message
                });
            }

            await addAdminLog(
                'Erreur recherche: ' + error.message,
                'error',
                data.username || 'admin'
            );
        }
    });

    socket.on('rechercher_par_csr', async (csrId, callback) => {
        console.log('Recherche par CSR ID: ' + csrId);
        
        await addAdminLog('Recherche patient CSR ID: ' + csrId, 'search', 'user');
        
        try {
            const data = await fs.readFile(LABO_FILE, 'utf8');
            let donnees = data.trim() ? JSON.parse(data) : [];
            
            const resultats = donnees.filter(item => 
                item.numID_CSR && item.numID_CSR.toString() === csrId.toString()
            );
            
            if (callback) {
                callback({
                    success: true,
                    donnees: resultats,
                    count: resultats.length
                });
            }
        } catch (error) {
            console.error('Erreur recherche CSR:', error);
            if (callback) {
                callback({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    socket.on('Ouverture_Session', async (callback) => {
        try {
            if (!FichierLaboOuvert) {
                await initializeLaboFile();
                FichierLaboOuvert = true;
            }
            if (callback) callback({ success: true });
        } catch (error) {
            console.error("Erreur Ouverture_Session:", error.message);
            if (callback) callback({ success: false, message: error.message });
        }
    });
    
    socket.on("labo", async (srData, callback) => {
        console.log("Tentative d'enregistrement pour: " + srData.nomClient + ', ' + srData.numID_CSR);
        console.log("Services sélectionnés:", srData.servicesSelectionnes);
        console.log("Examens sélectionnés:", srData.examensSelectionnes);
        
        try {
            await ensureDirectoryExists(databasesDir);
            let patientsData = await loadPatientData();

            const patientExistantIndex = patientsData.findIndex(patient => 
                patient.numID_CSR === srData.numID_CSR
            );

            let numClientFinal = srData.numClient;

            if (patientExistantIndex !== -1) {
                numClientFinal = patientsData[patientExistantIndex].numClient;
                patientsData[patientExistantIndex] = {
                    ...patientsData[patientExistantIndex],
                    ...srData,
                    numClient: numClientFinal,
                    dateModification: new Date().toISOString()
                };
                
                await addAdminLog(
                    'Patient mis à jour: ' + srData.nomClient + ' (CSR: ' + srData.numID_CSR + ')',
                    'patient_update',
                    'Caisse'
                );
            } else {
                numClientFinal = await generateNewClientId();
                patientsData.push({
                    ...srData,
                    numClient: numClientFinal,
                    dateCreation: new Date().toISOString()
                });
                
                await addAdminLog(
                    'Nouveau patient: ' + srData.nomClient + ' (CSR: ' + srData.numID_CSR + ')',
                    'patient_create',
                    'Caisse'
                );
            }

            await fs.writeFile(LABO_FILE, JSON.stringify(patientsData, null, 2), 'utf8');
            
            // Mettre à jour le dernier numéro client
            if (numClientFinal > dernierNumClient) {
                dernierNumClient = numClientFinal;
                console.log('🔄 Dernier numéro client mis à jour: ' + dernierNumClient);
            }
            
            // ENVOYER LES DONNÉES AUX JOURNAUX DES SERVICES
            await dispatchToServiceJournals({
                ...srData,
                numClient: numClientFinal
            });

            // Émettre également l'événement général
            socketIO.emit("nouveau_patient", {
                ...srData,
                numClient: numClientFinal,
                isLaboratorized: srData.isLaboratorized || "En attente"
            });

            if (callback) {
                callback({
                    success: true, 
                    message: "Patient enregistré avec succès",
                    numClient: numClientFinal
                });
            }
        } catch (error) {
            console.error('Erreur écriture Fichier Base de Données', error);
            
            await addAdminLog(
                'Erreur enregistrement patient: ' + error.message,
                'error',
                'Caisse'
            );
            
            if (callback) {
                callback({
                    success: false, 
                    message: "Erreur lors de l'enregistrement: " + error.message
                });
            }
        }
    });

    socket.on('recuperer_donnees', async (callback) => {
        try {
            const donnees = await loadPatientData();
            if (callback) callback({ success: true, donnees });
        } catch (error) {
            console.error("Erreur récupération données:", error);
            if (callback) callback({ success: false, error: error.message });
        }
    });
    
    socket.on('get_next_client_id', async (callback) => {
        try {
            const nextId = await generateNewClientId();
            if (callback) callback({ success: true, nextId });
        } catch (error) {
            if (callback) callback({ success: false, message: error.message });
        }
    });
    
    socket.on('get_patient_by_csr', async (numID_CSR, callback) => {
        try {
            const patient = await trouverPatientParCSR(numID_CSR);
            if (callback) {
                callback({
                    success: true,
                    patient: patient,
                    existe: patient !== null
                });
            }
        } catch (error) {
            console.error('Erreur recherche:', error.message);
            if (callback) {
                callback({
                    success: false,
                    message: error.message
                });
            }
        }
    });
    
    socket.on("maj", () => {
        socketIO.emit("update");
    });
    
    socket.on('update_status', async ({ numClient, numID_CSR, isLaboratorized }) => {
        console.log('Tentative de mise à jour: CSR=' + numID_CSR + ', Client=' + numClient + ', Statut=' + isLaboratorized);
        
        try {
            const statusMap = {
                0: "En attente",
                1: "En cours",
                2: "Terminé",
                3: "Annulé"
            };
            const isLaboratorizedText = statusMap[isLaboratorized] || "En attente";
            
            let updatedRecord;
            
            if (numID_CSR) {
                updatedRecord = await updateLaboratorizedStatusByCSR(numID_CSR, isLaboratorizedText);
                console.log('Statut mis à jour pour ' + numID_CSR + ': ' + isLaboratorizedText);
            } else if (numClient) {
                updatedRecord = await updateLaboratorizedStatus(numClient, isLaboratorizedText);
                console.log('Statut mis à jour pour ' + numClient + ': ' + isLaboratorizedText);
            } else {
                throw new Error('Identifiant client manquant (numClient ou numID_CSR requis)');
            }

            await addAdminLog(
                'Statut patient mis à jour: ' + updatedRecord.nomClient + ' - ' + isLaboratorizedText,
                'status_update',
                'Laboratoire'
            );

            socket.emit('Mise à jour réussie', updatedRecord);
            socketIO.emit('Etat Analyses Mis à Jour', updatedRecord);

        } catch (error) {
            console.error('Erreur:', error.message);
            socket.emit('update_error', {
                numClient: numClient || numID_CSR,
                message: error.message
            });
        }
    });

    socket.on('request_sync', async (lastUpdateTime, callback) => {
        try {
            const data = await fs.readFile(LABO_FILE, 'utf8');
            const records = JSON.parse(data);
            
            const updatedRecords = records.filter(record => 
                new Date(record.updatedAt || record.dateCreation) > new Date(lastUpdateTime)
            );
            
            if (callback) {
                callback({ success: true, updates: updatedRecords });
            }
        } catch (error) {
            console.error('Erreur lors de la synchronisation:', error);
            if (callback) {
                callback({ success: false, message: error.message });
            }
        }
    });

    socket.on("consult", async (srConsult) => {
        try {
            await ensureDirectoryExists(databasesDir);
            Clients.push(srConsult);
            await fs.writeFile(CONSULT_FILE, JSON.stringify(Clients, null, 2));
            
            let tmpConsult = JSON.stringify(srConsult);
            tmpConsult = tmpConsult.split(',')[0];
            tmpConsult = tmpConsult.split(':')[1];
            socketIO.emit("tache_Consult", tmpConsult);
            
            await addAdminLog(
                'Nouvelle consultation: ' + tmpConsult,
                'consultation',
                'Consultation'
            );
        } catch (error) {
            console.error('Error writing to consult file', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté: ' + socket.id);
        
        const disconnectedUser = connectedUsers.get(socket.id);
        connectedUsers.delete(socket.id);
        
        if (disconnectedUser) {
            socketIO.emit('user_disconnected', {
                socketId: socket.id,
                service: disconnectedUser.service,
                username: disconnectedUser.username,
                fullName: disconnectedUser.fullName,
                connectedUsers: getConnectedUsersByService()
            });

            // Mettre à jour la liste des utilisateurs
            socketIO.emit('users_list_updated', {
                users: usersDatabase,
                connectedUsers: getConnectedUsersByService()
            });
            
            addAdminLog(
                `Déconnexion: ${disconnectedUser.username} (${disconnectedUser.service})`,
                'disconnection',
                disconnectedUser.username
            );
        }
    });
});

// ====================================================================================
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
