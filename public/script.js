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

            articleElement.innerHTML = `
                <img src="${imageUrl}" alt="${article.title}">
                <h3>${article.title}</h3>
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
   CHARGEMENT D'UN ARTICLE Précis
   =========================================== */

async function chargerArticleParId() {
    // Lire l'ID dans l'URL : ?id=123
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    // Vérifier si un ID est présent
    if (!articleId) {
        document.getElementById('contenu-article').innerHTML = '<p>Aucun ID d\'article spécifié.</p>';
        return;
    }

    try {
        // Appeler l'API pour récupérer l'article spécifique
        const response = await fetch(`/api/articles/${articleId}`);

        if (!response.ok) {
            if (response.status === 404) {
                document.getElementById('contenu-article').innerHTML = '<h2>Article introuvable</h2>';
                return;
            }
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const article = await response.json();

        // Remplir les balises HTML avec les données de l'article
        document.getElementById('titre-article').textContent = article.title;
        document.getElementById('date-article').textContent = formaterDate(article.date);
        document.getElementById('date-article').href = article.date;

        // Image (avec fallback)
        const imageElement = document.getElementById('image-article');
        imageElement.src = article.image || 'https://picsum.photos/800/400';
        imageElement.alt = article.title;

        // Contenu
        document.getElementById('contenu-article').innerHTML = article.content;

    } catch (erreur) {
        console.error('Erreur lors du chargement de l\'article :', erreur);
        document.getElementById('contenu-article').innerHTML = '<p>Impossible de charger l\'article.</p>';
    }
}