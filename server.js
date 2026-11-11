const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { obtenirTousLesArticles, db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================================
// CONFIGURATION DE LA SESSION
// ===========================================
app.use(session({
    secret: 'secret-temporaire-actu-2026', // Secret pour signer les sessions (à changer en prod)
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 heures
        httpOnly: true
    }
}));

// ===========================================
// UTILISATEUR ADMIN (stocké en mémoire pour l'instant)
// ===========================================
let adminUser = null;

// Créer l'utilisateur admin au démarrage si non existant
async function creerUtilisateurAdmin() {
    const email = 'admin@actu.com';
    const motDePasse = 'admin123';
    const motDePasseHache = await bcrypt.hash(motDePasse, 10);

    adminUser = {
        email: email,
        motDePasseHache: motDePasseHache
    };
    console.log(`Utilisateur admin créé: ${email}`);
}

// Appeler la création de l'utilisateur admin au démarrage
creerUtilisateurAdmin();

// ===========================================
// MIDDLEWARE : Vérification de connexion
// ===========================================
function verifierConnexion(req, res, next) {
    if (req.session && req.session.user) {
        next(); // Utilisateur connecté, continuer
    } else {
        res.status(401).json({ erreur: 'Non authentifié' });
    }
}

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour parser le JSON dans les requêtes
app.use(express.json());

// ===========================================
// ROUTES API
// ===========================================

// Route API : GET /api/articles
app.get('/api/articles', (req, res) => {
    try {
        const articles = obtenirTousLesArticles();

        const articlesFormattes = articles.map(article => ({
            id: article.id,
            title: article.titre,
            content: article.contenu,
            image: article.image_url,
            date: article.date_publication
        }));

        res.json(articlesFormattes);
    } catch (erreur) {
        console.error('Erreur lors de la récupération des articles :', erreur);
        res.status(500).json({ erreur: 'Erreur interne du serveur' });
    }
});

// Route : POST /api/login
app.post('/api/login', async (req, res) => {
    const { email, motDePasse } = req.body;

    // Vérifier les identifiants
    if (adminUser && email === adminUser.email) {
        const motDePasseCorrect = await bcrypt.compare(motDePasse, adminUser.motDePasseHache);

        if (motDePasseCorrect) {
            // Stocker l'utilisateur dans la session
            req.session.user = { email: email };
            res.json({ succès: true, message: 'Connexion réussie' });
            return;
        }
    }

    res.status(401).json({ succès: false, message: 'Email ou mot de passe incorrect' });
});

// Route : POST /api/logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((erreur) => {
        if (erreur) {
            console.error('Erreur lors de la déconnexion:', erreur);
            res.status(500).json({ erreur: 'Erreur lors de la déconnexion' });
            return;
        }
        res.json({ succès: true, message: 'Déconnexion réussie' });
    });
});

// ===========================================
// ROUTES STATIQUES : Pages admin (protégées)
// ===========================================
app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

app.get('/admin/dashboard.html', verifierConnexion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/dashboard.html'));
});

// ===========================================
// ROUTE PAR DÉFAUT (pour les pages racines des dossiers)
// ===========================================
app.get('/admin/', (req, res) => {
    res.redirect('/admin/login.html');
});

// ===========================================
// FERMETURE PROPRE DE LA BASE DE DONNÉES
// ===========================================
process.on('SIGINT', () => {
    db.close();
    console.log('\nBase de données fermée.');
    process.exit(0);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});