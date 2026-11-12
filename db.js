const Database = require('better-sqlite3');
const path = require('path');

// Chemin vers le fichier de base de données SQLite
const dbPath = path.join(__dirname, 'data.db');

// Ouvrir (ou créer) la base de données
const db = new Database(dbPath);

// Créer la table "articles" et la table "commentaires" si elles n'existent pas déjà
db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        contenu TEXT NOT NULL,
        image_url TEXT NOT NULL,
        date_publication TEXT NOT NULL,
        statut TEXT DEFAULT 'publie'
    );

    CREATE TABLE IF NOT EXISTS commentaires (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        nom TEXT NOT NULL,
        message TEXT NOT NULL,
        date_creation TEXT NOT NULL,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
`);

// Migration : Ajouter la colonne "statut" si la table existait déjà sans cette colonne
try {
    db.exec(`ALTER TABLE articles ADD COLUMN statut TEXT DEFAULT 'publie'`);
    console.log('Colonne "statut" ajoutée à la table articles.');
} catch (err) {
    // Si la colonne existe déjà, SQLite renvoie une erreur qu'on ignore
}

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
    obtenirArticlesPublies: () => {
        const stmt = db.prepare("SELECT * FROM articles WHERE statut = 'publie' ORDER BY id DESC");
        return stmt.all();
    },
    obtenirArticleParId: (id) => {
        const stmt = db.prepare('SELECT * FROM articles WHERE id = ?');
        return stmt.get(id);
    },
    obtenirCommentairesParArticleId: (articleId) => {
        const stmt = db.prepare('SELECT * FROM commentaires WHERE article_id = ? ORDER BY id DESC');
        return stmt.all(articleId);
    },
    ajouterCommentaire: (articleId, nom, message) => {
        const dateCreation = new Date().toISOString();
        const stmt = db.prepare(`
            INSERT INTO commentaires (article_id, nom, message, date_creation)
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(articleId, nom, message, dateCreation);
    }
};