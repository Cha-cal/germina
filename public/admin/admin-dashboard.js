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

        // Attacher les événements aux boutons après avoir créé les éléments
        attacherEvenements();

    } catch (erreur) {
        console.error('Erreur lors du chargement des articles:', erreur);
        if (containerBrouillons) containerBrouillons.innerHTML = '<p style="color: red;">Erreur de chargement.</p>';
        if (containerPublies) containerPublies.innerHTML = '<p style="color: red;">Erreur de chargement.</p>';
    }
}

function créerElementArticle(article, type) {
    const articleElement = document.createElement('div');
    articleElement.className = 'article-admin';
    articleElement.dataset.id = article.id || article.title || ''; // Stocker l'ID pour les actions

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
                <button class="btn-admin btn-publier" title="Publier" data-action="publier" data-id="${article.id}">🚀 Publier</button>
                <button class="btn-admin btn-modifier" title="Modifier" data-action="modifier" data-id="${article.id}">✏️ Modifier</button>
            </div>
        `;
    } else {
        articleElement.innerHTML = `
            <div>
                <h3>${titre}</h3>
                <p>Date : ${dateFormatee}</p>
            </div>
            <div class="article-admin-actions">
                <button class="btn-admin btn-modifier" title="Modifier" data-action="modifier" data-id="${article.id}">✏️ Modifier</button>
                <button class="btn-admin btn-supprimer" title="Supprimer l'article" data-action="supprimer" data-id="${article.id}">🗑️ Supprimer l'article</button>
                <button class="btn-admin btn-commentaires" title="Gérer les commentaires" data-action="commentaires" data-id="${article.id}">💬 Gérer les commentaires</button>
            </div>
        `;
    }

    return articleElement;
}

function attacherEvenements() {
    // Gestion de tous les boutons d'action
    document.querySelectorAll('.article-admin-actions button').forEach(button => {
        button.addEventListener('click', async (e) => {
            const action = e.target.dataset.action;
            const articleId = e.target.dataset.id;

            if (!articleId) return;

            switch (action) {
                case 'modifier':
                    window.location.href = `modifier.html?id=${articleId}`;
                    break;

                case 'supprimer':
                    await supprimerArticle(articleId);
                    break;

                case 'commentaires':
                    await gererCommentaires(articleId);
                    break;

                case 'publier':
                    // Pour publier un brouillon, on le redirige vers la page de modification
                    // où il pourra changer le statut
                    window.location.href = `modifier.html?id=${articleId}`;
                    break;
            }
        });
    });
}

async function supprimerArticle(id) {
    // Confirmation avant suppression
    if (!window.confirm("Voulez-vous vraiment supprimer cet article ?")) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/articles/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.succès) {
            // Recharger la liste des articles
            chargerArticlesAdmin();
        } else {
            alert(result.message || 'Erreur lors de la suppression');
        }
    } catch (erreur) {
        console.error('Erreur:', erreur);
        alert('Erreur de connexion au serveur');
    }
}

async function gererCommentaires(articleId) {
    try {
        const response = await fetch(`/api/admin/articles/${articleId}/commentaires`);

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/admin/login.html';
                return;
            }
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const commentaires = await response.json();

        if (commentaires.length === 0) {
            alert('Aucun commentaire pour cet article.');
            return;
        }

        // Construire la liste des commentaires pour l'alerte
        let message = `Commentaires pour l'article (ID: ${articleId}):\n\n`;
        commentaires.forEach(c => {
            const date = new Date(c.date_creation).toLocaleDateString('fr-FR', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            message += `• ${c.nom} (${date}): ${c.message}\n`;
        });
        message += '\n---\nEntrez l\'ID du commentaire à supprimer (ou annulez) :';

        // Demander l'ID du commentaire à supprimer
        const commentId = prompt(message);

        if (commentId && commentId.trim() !== '') {
            await supprimerCommentaire(parseInt(commentId));
        }
    } catch (erreur) {
        console.error('Erreur:', erreur);
        alert('Impossible de charger les commentaires');
    }
}

async function supprimerCommentaire(commentId) {
    if (isNaN(commentId)) {
        alert('ID de commentaire invalide');
        return;
    }

    // Confirmation avant suppression
    if (!window.confirm("Voulez-vous vraiment supprimer ce commentaire ?")) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/commentaires/${commentId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.succès) {
            alert('Commentaire supprimé avec succès');
        } else {
            alert(result.erreur || result.message || 'Erreur lors de la suppression');
        }
    } catch (erreur) {
        console.error('Erreur:', erreur);
        alert('Erreur de connexion au serveur');
    }
}