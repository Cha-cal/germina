const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour parser le JSON dans les requêtes
app.use(express.json());

// Route API de test : GET /api/articles
app.get('/api/articles', (req, res) => {
    const articles = [
        {
            id: 1,
            title: "Lancement réussi du nouveau projet Actu",
            content: "Aujourd'hui marque une étape importante avec le lancement officiel du site d'actualité Actu en continu.",
            date: "2026-11-14"
        },
        {
            id: 2,
            title: "Les avancées majeures du développement Web",
            content: "Découvrez les nouvelles technologies et tendances qui façonnent le Web de demain.",
            date: "2026-11-13"
        }
    ];

    res.json(articles);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
