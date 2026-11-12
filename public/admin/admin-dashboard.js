// Chargement des articles au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    chargerArticlesAdmin();
});

async function chargerArticlesAdmin() {
    const containerBrouillons = document.getElementById('liste-brouillons');
    const containerPublies = document.getElementById('liste-publies');

    if (!containerBrouillons || !containerPublies) return;

    try {
        // Fetch pour récupérer tous les articles (publiés et brouillons) via l'API admin
        const response = await fetch('/api/admin/articles');

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/admin/login.html';
                return;
            }
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const articles = await response.json();

        // Vider les conteneurs
        containerBrouillons.innerHTML = '';
        containerPublies.innerHTML = '';

        // Filtrer les articles par statut
        const brouillons = articles.filter(article => article.statut === 'brouillon');
        const publies = articles.filter(article => article.statut === 'publie' || !article.statut);

        // --- Afficher les brouillons ---
        if (brouillons.length === 0) {
            containerBrouillons.innerHTML = '<p style="color: #666; font-style: italic;">Aucun brouillon pour le moment.</p>';
        } else {
            brouillons.forEach(article => {
                const articleElement = créerElementArticle(article, 'brouillon');
                containerBrouillons.appendChild(articleElement);
            });
        }

        // --- Afficher les publications en ligne ---
        if (publies.length === 0) {
            containerPublies.innerHTML = '<p style="color: #666; font-style: italic;">Aucune publication en ligne pour le moment.</p>';
        } else {
            publies.forEach(article => {
                const articleElement = créerElementArticle(article, 'publie');
                containerPublies.appendChild(articleElement);
            });
        }

    } catch (erreur) {
        console.error('Erreur lors du chargement des articles:', erreur);
        if (containerBrouillons) containerBrouillons.innerHTML = '<p style="color: red;">Erreur de chargement.</p>';
        if (containerPublies) containerPublies.innerHTML = '<p style="color: red;">Erreur de chargement.</p>';
    }
}

function créerElementArticle(article, type) {
    const articleElement = document.createElement('div');
    articleElement.className = 'article-admin';

    const titre = article.title || article.titre || 'Sans titre';
    const dateRaw = article.date || article.date_publication;
    const date = dateRaw ? new Date(dateRaw) : new Date();
    const dateFormatee = date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (type === 'brouillon') {
        articleElement.innerHTML = `
            <div>
                <h3>${titre}</h3>
                <p>Date : ${dateFormatee}</p>
            </div>
            <div class="article-admin-actions">
                <button class="btn-admin btn-publier" title="Publier">🚀 Publier</button>
                <button class="btn-admin btn-modifier" title="Modifier">✏️ Modifier</button>
            </div>
        `;
    } else {
        articleElement.innerHTML = `
            <div>
                <h3>${titre}</h3>
                <p>Date : ${dateFormatee}</p>
            </div>
            <div class="article-admin-actions">
                <button class="btn-admin btn-modifier" title="Modifier">✏️ Modifier</button>
                <button class="btn-admin btn-supprimer" title="Supprimer l'article">🗑️ Supprimer l'article</button>
                <button class="btn-admin btn-commentaires" title="Gérer les commentaires">💬 Gérer les commentaires</button>
            </div>
        `;
    }

    return articleElement;
}