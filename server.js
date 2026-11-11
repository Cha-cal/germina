const express = require('express');
const path = require('path');
const { obtenirTousLesArticles, db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour parser le JSON dans les requêtes
app.use(express.json());

// Route API : GET /api/articles
// Retourne les articles depuis la base de données SQLite
app.get('/api/articles', (req, res) => {
    try {
        const articles = obtenirTousLesArticles();

        // Mapper les colonnes de la DB vers les noms propres au front-end
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

// Route pour fermer proprement la base de données (pour le développement)
process.on('SIGINT', () => {
    db.close();
    console.log('\nBase de données fermée.');
    process.exit(0);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});