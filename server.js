const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const { obtenirTousLesArticles, obtenirArticleParId, db } = require('./db');

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
// CONFIGURATION DE MULTTER (upload de fichiers)
// ===========================================
const dossierUploads = path.join(__dirname, 'public/uploads');

// Créer le dossier uploads s'il n'existe pas
if (!fs.existsSync(dossierUploads)) {
    fs.mkdirSync(dossierUploads, { recursive: true });
    console.log('Dossier uploads créé.');
}

// Configuration du stockage de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dossierUploads);
    },
    filename: (req, file, cb) => {
        // Nom du fichier unique : timestamp + nom d'origine
        const nomUnique = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
        cb(null, nomUnique);
    }
});

// Configurer Multer (seulement accepter les images)
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB max
    }
});

// ===========================================
// UTILISATEUR ADMIN (stocké en mémoire)
// ===========================================
let adminUser = null;

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

creerUtilisateurAdmin();

// ===========================================
// MIDDLEWARE : Vérification de connexion
// ===========================================
function verifierConnexion(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ erreur: 'Non authentifié' });
    }
}

// ===========================================
// SERVER STATIC & MIDDLEWARES
// ===========================================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ===========================================
// ROUTES API - ARTICLES
// ===========================================

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

// Route : GET /api/articles/:id - Récupérer un article précis
app.get('/api/articles/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erreur: 'ID invalide' });
    }

    const article = obtenirArticleParId(id);

    if (!article) {
        return res.status(404).json({ erreur: 'Article non trouvé' });
    }

    res.json({
        id: article.id,
        title: article.titre,
        content: article.contenu,
        image: article.image_url,
        date: article.date_publication
    });
});

// ===========================================
// ROUTES API - AUTHENTIFICATION
// ===========================================

app.post('/api/login', async (req, res) => {
    const { email, motDePasse } = req.body;

    if (adminUser && email === adminUser.email) {
        const motDePasseCorrect = await bcrypt.compare(motDePasse, adminUser.motDePasseHache);

        if (motDePasseCorrect) {
            req.session.user = { email: email };
            res.json({ succès: true, message: 'Connexion réussie' });
            return;
        }
    }

    res.status(401).json({ succès: false, message: 'Email ou mot de passe incorrect' });
});

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
// ROUTE : PUBLICATION D'UN NOUVEAU ARTICLE (PROTEGEE)
// ===========================================

app.post('/api/admin/articles', verifierConnexion, upload.single('image'), (req, res) => {
    const { titre, contenu } = req.body;

    if (!titre || !contenu) {
        return res.status(400).json({ succès: false, message: 'Titre et contenu sont requis' });
    }

    // Chemin de l'image dans le serveur
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const datepublication = new Date().toISOString().split('T')[0];

    try {
        const insertStmt = db.prepare(`
            INSERT INTO articles (titre, contenu, image_url, date_publication)
            VALUES (?, ?, ?, ?)
        `);

        insertStmt.run(titre, contenu, imagePath, datepublication);

        res.json({
            succès: true,
            message: 'Article publié avec succès',
            article: {
                titre: titre,
                contenu: contenu,
                image: imagePath,
                date: datepublication
            }
        });
    } catch (erreur) {
        console.error('Erreur lors de l\'insertion de l\'article:', erreur);
        res.status(500).json({ succès: false, message: 'Erreur interne du serveur' });
    }
});

// ===========================================
// ROUTES STATIQUES : Pages admin
// ===========================================

app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

app.get('/admin/dashboard.html', verifierConnexion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/dashboard.html'));
});

app.get('/admin/nouveau.html', verifierConnexion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/nouveau.html'));
});

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