const Database = require('better-sqlite3');
const path = require('path');

// Chemin vers le fichier de base de données SQLite
const dbPath = path.join(__dirname, 'data.db');

// Ouvrir (ou créer) la base de données
const db = new Database(dbPath);

// Créer la table "articles" si elle n'existe pas déjà
db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        contenu TEXT NOT NULL,
        image_url TEXT NOT NULL,
        date_publication TEXT NOT NULL
    )
`);

// Fonction pour insérer les articles de test si la table est vide
function initialiserArticlesDeTest() {
    const compte = db.prepare('SELECT COUNT(*) as count FROM articles').get();

    if (compte.count === 0) {
        const insertStmt = db.prepare(`
            INSERT INTO articles (titre, contenu, image_url, date_publication)
            VALUES (?, ?, ?, ?)
        `);

        const articlesDeTest = [
            [
                'Lancement réussi du nouveau projet Actu',
                "Aujourd'hui marque une étape importante avec le lancement officiel du site d'actualité Actu en continu. Notre équipe de journalistes passionnés vous offre une nouvelle façon de consulter l'information.",
                'https://picsum.photos/400/250?random=1',
                '2026-11-14'
            ],
            [
                'Les avancées majeures du développement Web',
                "Découvrez les nouvelles technologies et tendances qui façonnent le Web de demain. Les frameworks modernes transforment notre façon de construire des applications.",
                'https://picsum.photos/400/250?random=2',
                '2026-11-13'
            ],
            [
                'Comment le code ouvre les portes du futur',
                "Explorons comment le développement d'applications modernes change la donne dans tous les aspects de notre quotidien. Le code est de plus en plus présent partout autour de nous.",
                'https://picsum.photos/400/250?random=3',
                '2026-11-12'
            ]
        ];

        articlesDeTest.forEach(article => {
            insertStmt.run(...article);
        });

        console.log('Articles de test insérés dans la base de données.');
    }
}

// Exécuter l'initialisation au chargement du module
initialiserArticlesDeTest();

// Exporter des fonctions pour utilisation dans server.js
module.exports = {
    db,
    obtenirTousLesArticles: () => {
        const stmt = db.prepare('SELECT * FROM articles ORDER BY id DESC');
        return stmt.all();
    },
    obtenirArticleParId: (id) => {
        const stmt = db.prepare('SELECT * FROM articles WHERE id = ?');
        return stmt.get(id);
    }
};