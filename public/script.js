/* ===========================================
   GESTION DU MENU HAMBURGER (JavaScript)
   =========================================== */

// Attendre que le contenu de la page soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    // Récupérer le bouton du menu hamburger et le menu de navigation
    const menuBtn = document.getElementById('menu-btn');
    const navMenu = document.querySelector('.main-nav');

    // Vérifier si les éléments existent avant d'ajouter l'événement
    if (menuBtn && navMenu) {
        // Écouter le clic sur le bouton hamburger
        menuBtn.addEventListener('click', () => {
            // Basculer (ajouter/retirer) la classe "ouvert" sur le menu
            navMenu.classList.toggle('ouvert');
        });
    }

    // Charger les articles dynamiquement si le conteneur existe sur la page d'accueil
    const listeArticles = document.getElementById('liste-articles');
    if (listeArticles) {
        chargerArticles();
    }

    // Vérifier si on est sur la page article.html et charger l'article
    if (document.getElementById('titre-article')) {
        chargerArticleParId();
    }

    // Vérifier si on est sur la page articles.html et charger la liste des articles
    if (document.getElementById('toutes-les-articles')) {
        // Vider le conteneur avant de le remplir
        document.getElementById('toutes-les-articles').innerHTML = "";
        chargerArticlesToutesLesActus();
    }
});

/* ===========================================
   RÉCUPÉRATION DES ARTICLES DEPUIS L'API
   =========================================== */

async function chargerArticles() {
    const container = document.getElementById('liste-articles');

    try {
        // Appeler l'API pour récupérer les articles en JSON
        const response = await fetch('/api/articles');

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const articles = await response.json();

        // Effacer le message de chargement
        container.innerHTML = '';

        // Si aucun article n'est retourné
        if (articles.length === 0) {
            container.innerHTML = '<p>Aucune actualité disponible pour le moment.</p>';
            return;
        }

        // Parcourir les articles et générer le HTML de chaque carte
        articles.forEach(article => {
            const articleElement = document.createElement('article');
            articleElement.className = 'news-card';

            // Utiliser l'image de la base de données ou un placeholder par défaut
            const imageUrl = article.image || 'https://picsum.photos/400/250';

            // Badge nombre de commentaires (seulement si > 0)
            const commentBadge = article.nombre_commentaires > 0
                ? `<span class="comment-badge" title="${article.nombre_commentaires} commentaire${article.nombre_commentaires > 1 ? 's' : ''}">💬 ${article.nombre_commentaires}</span>`
                : '';

            articleElement.innerHTML = `
                <img src="${imageUrl}" alt="${article.title}">
                <h3>${article.title} ${commentBadge}</h3>
                <time datetime="${article.date}">${formaterDate(article.date)}</time>
                <p>${article.content}</p>
                <a href="article.html?id=${article.id}" class="read-more">Lire la suite</a>
            `;

            container.appendChild(articleElement);
        });

    } catch (erreur) {
        console.error('Erreur lors du chargement des articles :', erreur);
        container.innerHTML = '<p style="color: red;">Impossible de charger les actualités pour le moment.</p>';
    }
}

// Fonction utilitaire pour formater la date en français
function formaterDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', options);
}

/* ===========================================
   CHARGEMENT DES ARTICLES POUR LA PAGE articles.html
   =========================================== */

async function chargerArticlesToutesLesActus() {
    const container = document.getElementById('toutes-les-articles');

    try {
        // Appeler l'API pour récupérer les articles en JSON
        const response = await fetch('/api/articles');

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const articles = await response.json();

        // Vider le conteneur
        container.innerHTML = '';

        // Si aucun article
        if (articles.length === 0) {
            container.innerHTML = '<p>Aucune actualité disponible pour le moment.</p>';
            return;
        }

        // Parcourir les articles et générer le HTML de chaque carte
        articles.forEach(article => {
            const articleElement = document.createElement('article');
            articleElement.className = 'news-card';

            // Utiliser l'image de la base de données ou un placeholder par défaut
            const imageUrl = article.image || 'https://picsum.photos/400/250';

            // Badge nombre de commentaires (seulement si > 0)
            const commentBadge = article.nombre_commentaires > 0
                ? `<span class="comment-badge" title="${article.nombre_commentaires} commentaire${article.nombre_commentaires > 1 ? 's' : ''}">💬 ${article.nombre_commentaires}</span>`
                : '';

            articleElement.innerHTML = `
                <img src="${imageUrl}" alt="${article.title}">
                <h3>${article.title} ${commentBadge}</h3>
                <time datetime="${article.date}">${formaterDate(article.date)}</time>
                <p>${article.content}</p>
                <a href="article.html?id=${article.id}" class="read-more">Lire la suite</a>
            `;

            container.appendChild(articleElement);
        });

    } catch (erreur) {
        console.error('Erreur lors du chargement des articles :', erreur);
        container.innerHTML = '<p style="color: red;">Impossible de charger les actualités pour le moment.</p>';
    }
}

/* ===========================================
   CHARGEMENT D'UN ARTICLE Précis
   =========================================== */

async function chargerArticleParId() {
    // Lire l'ID dans l'URL : ?id=123
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    // Vérifier si un ID est présent
    if (!articleId) {
        document.getElementById('contenu-article').innerHTML = '<p>Aucun ID d\'article spécifié.</p>';
        console.log('Aucun ID d\'article dans l\'URL');
        return;
    }

    console.log('Chargement de l\'article avec ID :', articleId);

    try {
        // Appeler l'API pour récupérer l'article spécifique
        const response = await fetch(`/api/articles/${articleId}`);

        if (!response.ok) {
            if (response.status === 404) {
                document.getElementById('contenu-article').innerHTML = '<h2>Article introuvable</h2>';
                console.log('Article introuvable (404)');
                return;
            }
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const article = await response.json();

        // Vérifier les données reçues
        console.log('Données reçues de l\'API :', article);

        // Remplir les balises HTML avec les données de l'article
        document.getElementById('titre-article').textContent = article.title;
        document.getElementById('date-article').textContent = formaterDate(article.date);
        document.getElementById('date-article').href = article.date;

        // Image (avec fallback)
        const imageElement = document.getElementById('image-article');
        if (article.image_url) {
            imageElement.src = article.image_url;
        } else {
            imageElement.src = 'https://picsum.photos/800/400';
            console.log('Aucune image_url dans les données, utilisation du placeholder');
        }
        imageElement.alt = article.title || 'Article';

        // Contenu
        if (article.content) {
            document.getElementById('contenu-article').innerHTML = article.content;
        } else {
            document.getElementById('contenu-article').innerHTML = '<p>Aucun contenu disponible</p>';
            console.log('Aucun contenu dans les données reçues');
        }

        // Charger les commentaires existants
        chargerCommentaires(articleId);
    } catch (erreur) {
        console.error('Erreur lors du chargement de l\'article :', erreur);
        document.getElementById('contenu-article').innerHTML = '<p>Impossible de charger l\'article.</p>';
    }
}

/* ===========================================
   GESTION DES COMMENTAIRES
   =========================================== */

async function chargerCommentaires(articleId) {
    const listeCommentaires = document.getElementById('liste-commentaires');

    try {
        // Récupérer les commentaires depuis l'API
        const response = await fetch(`/api/articles/${articleId}/commentaires`);

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const commentaires = await response.json();

        // Vider la liste existante
        listeCommentaires.innerHTML = '';

        // Si aucun commentaire
        if (commentaires.length === 0) {
            listeCommentaires.innerHTML = '<p>Aucun commentaire pour le moment.</p>';
            return;
        }

        // Parcourir les commentaires et les afficher
        commentaires.forEach(commentaire => {
            const date = new Date(commentaire.date_creation);
            const dateFormatee = date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Récupérer la première lettre du pseudo
            const lettrePseudo = commentaire.nom.charAt(0).toUpperCase();

            const commentaireElement = document.createElement('div');
            commentaireElement.className = 'commentaire-element entete-commentaire';
            commentaireElement.innerHTML = `
                <div class="avatar-commentaire">${lettrePseudo}</div>
                <strong>${commentaire.nom}</strong>
                <span style="color: #666; font-size: 0.8em;">le ${dateFormatee}</span>
                <p>${commentaire.message}</p>
            `;

            listeCommentaires.appendChild(commentaireElement);
        });

    } catch (erreur) {
        console.error('Erreur lors du chargement des commentaires :', erreur);
        listeCommentaires.innerHTML = '<p style="color: red;">Impossible de charger les commentaires.</p>';
    }
}

// Écouter la soumission du formulaire de commentaire
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-commentaire');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Empêcher le rechargement de la page

            const nom = document.getElementById('nom-commentaire').value;
            const message = document.getElementById('message-commentaire').value;
            const urlParams = new URLSearchParams(window.location.search);
            const articleId = urlParams.get('id');

            if (!articleId || !nom || !message) {
                alert('Données incomplètes');
                return;
            }

            try {
                // Envoyer le commentaire à l'API
                const response = await fetch(`/api/articles/${articleId}/commentaires`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nom, message })
                });

                const result = await response.json();

                if (result.succès) {
                    // Vider le formulaire
                    form.reset();

                    // Recharger la liste des commentaires
                    chargerCommentaires(articleId);
                } else {
                    alert('Erreur lors de la publication du commentaire');
                }
            } catch (erreur) {
                console.error('Erreur:', erreur);
                alert('Erreur de connexion au serveur');
            }
        });
    }
});