const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const { obtenirTousLesArticles, obtenirArticlesPublies, obtenirArticleParId, obtenirCommentairesParArticleId, ajouterCommentaire, ajouterMessageContact, db } = require('./db');

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
// CONFIGURATION DE MULTER (upload de fichiers)
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

// Route publique : GET /api/articles - Récupérer seulement les articles publiés
app.get('/api/articles', (req, res) => {
    try {
        const articles = obtenirArticlesPublies();

        const articlesFormattes = articles.map(article => ({
            id: article.id,
            title: article.titre,
            content: article.contenu,
            image: article.image_url,
            date: article.date_publication,
            statut: article.statut,
            nombre_commentaires: article.nombre_commentaires || 0
        }));

        res.json(articlesFormattes);
    } catch (erreur) {
        console.error('Erreur lors de la récupération des articles :', erreur);
        res.status(500).json({ erreur: 'Erreur interne du serveur' });
    }
});

// Route admin (protégée) : GET /api/admin/articles - Récupérer TOUS les articles (publiés et brouillons)
app.get('/api/admin/articles', verifierConnexion, (req, res) => {
    try {
        // Pour l'admin, on doit aussi compter les commentaires
        const articles = db.prepare(`
            SELECT a.*,
                   COUNT(c.id) as nombre_commentaires
            FROM articles a
            LEFT JOIN commentaires c ON c.article_id = a.id
            GROUP BY a.id
            ORDER BY a.id DESC
        `).all();

        const articlesFormattes = articles.map(article => ({
            id: article.id,
            title: article.titre,
            content: article.contenu,
            image: article.image_url,
            date: article.date_publication,
            statut: article.statut,
            nombre_commentaires: article.nombre_commentaires || 0
        }));

        res.json(articlesFormattes);
    } catch (erreur) {
        console.error('Erreur lors de la récupération des articles admin :', erreur);
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
        image_url: article.image_url,
        date_publication: article.date_publication
    });
});

// Route : GET /api/articles/:id/commentaires - Récupérer les commentaires
app.get('/api/articles/:id/commentaires', (req, res) => {
    const articleId = parseInt(req.params.id);
    const commentaires = obtenirCommentairesParArticleId(articleId);
    res.json(commentaires);
});

// Route : POST /api/articles/:id/commentaires - Ajouter un commentaire
app.post('/api/articles/:id/commentaires', (req, res) => {
    const articleId = parseInt(req.params.id);
    const { nom, message } = req.body;

    if (!nom || !message) {
        return res.status(400).json({ erreur: 'Nom et message requis' });
    }

    ajouterCommentaire(articleId, nom, message);
    res.json({ succès: true, message: 'Commentaire publié' });
});

// Route : POST /api/contact - Recevoir un message de contact
app.post('/api/contact', (req, res) => {
    const { nom, email, message } = req.body;

    if (!nom || !email || !message) {
        return res.status(400).json({ succès: false, message: 'Tous les champs sont requis' });
    }

    // Validation email basique
    if (!email.includes('@') || !email.includes('.')) {
        return res.status(400).json({ succès: false, message: 'Email invalide' });
    }

    try {
        ajouterMessageContact(nom, email, message);
        res.json({ succès: true, message: 'Message envoyé avec succès' });
    } catch (erreur) {
        console.error('Erreur lors de l\'enregistrement du message:', erreur);
        res.status(500).json({ succès: false, message: 'Erreur interne du serveur' });
    }
});

// ===========================================
// ROUTES API - ADMIN MESSAGES CONTACT
// ===========================================

// Route : GET /api/admin/messages - Récupérer tous les messages de contact (admin)
app.get('/api/admin/messages', verifierConnexion, (req, res) => {
    try {
        const messages = db.prepare(`
            SELECT * FROM messages_contact ORDER BY date_creation DESC
        `).all();

        res.json(messages);
    } catch (erreur) {
        console.error('Erreur lors de la récupération des messages:', erreur);
        res.status(500).json({ erreur: 'Erreur interne du serveur' });
    }
});

// Route : DELETE /api/admin/messages/:id - Supprimer un message (admin)
app.delete('/api/admin/messages/:id', verifierConnexion, (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erreur: 'ID invalide' });
    }

    try {
        const deleteStmt = db.prepare(`
            DELETE FROM messages_contact WHERE id = ?
        `);

        const result = deleteStmt.run(id);

        if (result.changes === 0) {
            return res.status(404).json({ erreur: 'Message non trouvé' });
        }

        res.json({ succès: true, message: 'Message supprimé' });
    } catch (erreur) {
        console.error('Erreur lors de la suppression du message:', erreur);
        res.status(500).json({ erreur: 'Erreur interne du serveur' });
    }
});

// Route : GET /api/admin/messages/non-lus - Compter les messages non lus (admin)
app.get('/api/admin/messages/non-lus', verifierConnexion, (req, res) => {
    try {
        const result = db.prepare(`
            SELECT COUNT(*) as count FROM messages_contact
        `).get();

        res.json({ count: result.count || 0 });
    } catch (erreur) {
        console.error('Erreur lors du comptage des messages:', erreur);
        res.status(500).json({ erreur: 'Erreur interne du serveur' });
    }
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
// ROUTE : PUBLICATION / BROUILLON D'UN ARTICLE (PROTEGEE)
// ===========================================

app.post('/api/admin/articles', verifierConnexion, upload.single('image'), (req, res) => {
    const { titre, contenu, statut } = req.body;

    if (!titre || !contenu) {
        return res.status(400).json({ succès: false, message: 'Titre et contenu sont requis' });
    }

    // Le statut doit être 'publie' ou 'brouillon'
    const statutFinal = statut === 'brouillon' ? 'brouillon' : 'publie';

    // Chemin de l'image dans le serveur
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const datepublication = new Date().toISOString().split('T')[0];

    try {
        const insertStmt = db.prepare(`
            INSERT INTO articles (titre, contenu, image_url, date_publication, statut)
            VALUES (?, ?, ?, ?, ?)
        `);

        insertStmt.run(titre, contenu, imagePath, datepublication, statutFinal);

        const messageSucces = statutFinal === 'brouillon'
            ? 'Brouillon enregistré avec succès'
            : 'Article publié avec succès';

        res.json({
            succès: true,
            message: messageSucces,
            article: {
                titre: titre,
                contenu: contenu,
                image: imagePath,
                date: datepublication,
                statut: statutFinal
            }
        });
    } catch (erreur) {
        console.error('Erreur lors de l\'insertion de l\'article:', erreur);
        res.status(500).json({ succès: false, message: 'Erreur interne du serveur' });
    }
});

// ===========================================
// ROUTE : SUPPRESSION D'UN ARTICLE (PROTEGEE)
// ===========================================

app.delete('/api/admin/articles/:id', verifierConnexion, (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ succès: false, message: 'ID invalide' });
    }

    try {
        // Vérifier si l'article existe
        const articleExistant = obtenirArticleParId(id);
        if (!articleExistant) {
            return res.status(404).json({ succès: false, message: 'Article non trouvé' });
        }

        // Supprimer l'article (les commentaires sont supprimés automatiquement via ON DELETE CASCADE)
        const deleteStmt = db.prepare(`
            DELETE FROM articles WHERE id = ?
        `);

        deleteStmt.run(id);

        res.json({ succès: true, message: 'Article supprimé avec succès' });
    } catch (erreur) {
        console.error('Erreur lors de la suppression de l\'article:', erreur);
        res.status(500).json({ succès: false, message: 'Erreur interne du serveur' });
    }
});

// ===========================================
// ROUTE : MODIFICATION D'UN ARTICLE (PROTEGEE)
// ===========================================

// Route GET pour récupérer un article (admin)
app.get('/api/admin/articles/:id', verifierConnexion, (req, res) => {
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
        titre: article.titre,
        contenu: article.contenu,
        image_url: article.image_url,
        date_publication: article.date_publication,
        statut: article.statut
    });
});

// Route PUT pour mettre à jour un article
app.put('/api/admin/articles/:id', verifierConnexion, upload.single('image'), (req, res) => {
    const id = parseInt(req.params.id);
    const { titre, contenu, statut } = req.body;

    if (!titre || !contenu) {
        return res.status(400).json({ succès: false, message: 'Titre et contenu sont requis' });
    }

    // Le statut doit être 'publie' ou 'brouillon'
    const statutFinal = statut === 'brouillon' ? 'brouillon' : 'publie';

    // Chemin de l'image : garder l'image existante si pas de nouvelle image fournie
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        // Vérifier si l'article existe
        const articleExistant = obtenirArticleParId(id);
        if (!articleExistant) {
            return res.status(404).json({ succès: false, message: 'Article non trouvé' });
        }

        // Si une nouvelle image est fournie, on l'utilise ; sinon on garde l'image actuelle
        const imageFinal = imagePath || articleExistant.image_url;

        const updateStmt = db.prepare(`
            UPDATE articles
            SET titre = ?, contenu = ?, image_url = ?, statut = ?
            WHERE id = ?
        `);

        updateStmt.run(titre, contenu, imageFinal, statutFinal, id);

        res.json({
            succès: true,
            message: 'Article mis à jour avec succès',
            article: {
                id: id,
                titre: titre,
                contenu: contenu,
                image: imageFinal,
                statut: statutFinal
            }
        });
    } catch (erreur) {
        console.error('Erreur lors de la mise à jour de l\'article:', erreur);
        res.status(500).json({ succès: false, message: 'Erreur interne du serveur' });
    }
});

// ===========================================
// ROUTES : GESTION DES COMMENTAIRES ADMIN
// ===========================================

// Route : GET /api/admin/articles/:id/commentaires - Récupérer les commentaires d'un article
app.get('/api/admin/articles/:id/commentaires', verifierConnexion, (req, res) => {
    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
        return res.status(400).json({ erreur: 'ID invalide' });
    }
    const commentaires = obtenirCommentairesParArticleId(articleId);
    res.json(commentaires);
});

// Route : DELETE /api/admin/commentaires/:id - Supprimer un commentaire
app.delete('/api/admin/commentaires/:id', verifierConnexion, (req, res) => {
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
        return res.status(400).json({ erreur: 'ID invalide' });
    }

    const deleteStmt = db.prepare(`
        DELETE FROM commentaires WHERE id = ?
    `);

    const result = deleteStmt.run(commentId);

    if (result.changes === 0) {
        return res.status(404).json({ erreur: 'Commentaire non trouvé' });
    }

    res.json({ succès: true, message: 'Commentaire supprimé' });
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

// Nouvelle route pour la page de modification
app.get('/admin/modifier.html', verifierConnexion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/modifier.html'));
});

// Nouvelle route pour la boîte de réception
app.get('/admin/messages.html', verifierConnexion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/messages.html'));
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