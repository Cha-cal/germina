// Script pour la modification d'un article
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('modifier-article-form');
    const messageErreur = document.getElementById('message-erreur');
    const messageSuccess = document.getElementById('message-success');

    if (!form) return;

    // Récupérer l'ID de l'article depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        if (messageErreur) {
            messageErreur.textContent = 'Aucun ID d\'article spécifié';
            messageErreur.style.display = 'block';
        }
        return;
    }

    // Charger l'article existant
    await chargerArticle(articleId);

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Vider les messages
        messageErreur.style.display = 'none';
        messageSuccess.style.display = 'none';

        // Déterminer le statut selon la checkbox
        const checkbox = document.getElementById('statut-publie');
        const statut = checkbox.checked ? 'publie' : 'brouillon';

        // Récupérer les valeurs AVEC .trim()
        const titre = document.getElementById('titre').value.trim();
        const contenu = document.getElementById('contenu').value.trim();

        // Validation côté client
        if (!titre || !contenu) {
            messageErreur.textContent = 'Veuillez remplir tous les champs';
            messageErreur.style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append('titre', titre);
        formData.append('contenu', contenu);
        formData.append('statut', statut);

        const imageFile = document.getElementById('image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch(`/api/admin/articles/${articleId}`, {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();

            if (result.succès) {
                messageSuccess.textContent = result.message;
                messageSuccess.style.display = 'block';

                // Redirection après 1 seconde
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                messageErreur.textContent = result.message || 'Erreur lors de la modification';
                messageErreur.style.display = 'block';
            }
        } catch (erreur) {
            messageErreur.textContent = 'Erreur de connexion au serveur';
            messageErreur.style.display = 'block';
            console.error('Erreur:', erreur);
        }
    });

    async function chargerArticle(id) {
        try {
            const response = await fetch(`/api/admin/articles/${id}`);

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/admin/login.html';
                    return;
                }
                throw new Error(`Erreur HTTP : ${response.status}`);
            }

            const article = await response.json();

            // Pré-remplir le formulaire
            document.getElementById('article-id').value = article.id;
            document.getElementById('titre').value = article.titre || '';
            document.getElementById('contenu').value = article.contenu || '';

            // Gérer la checkbox du statut
            const checkbox = document.getElementById('statut-publie');
            checkbox.checked = (article.statut === 'publie');

            // Afficher l'image actuelle si elle existe
            if (article.image_url) {
                const imagePreview = document.createElement('img');
                imagePreview.src = article.image_url;
                imagePreview.alt = 'Image actuelle';
                imagePreview.style.maxWidth = '200px';
                imagePreview.style.marginBottom = '10px';
                imagePreview.style.borderRadius = '4px';

                const imageGroup = document.getElementById('image').parentElement;
                const existingPreview = imageGroup.querySelector('img');
                if (existingPreview) {
                    existingPreview.remove();
                }
                imageGroup.insertBefore(imagePreview, document.getElementById('image'));
            }

        } catch (erreur) {
            console.error('Erreur lors du chargement de l\'article:', erreur);
            if (messageErreur) {
                messageErreur.textContent = 'Impossible de charger l\'article';
                messageErreur.style.display = 'block';
            }
        }
    }
});