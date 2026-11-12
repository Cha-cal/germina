// Script pour la connexion et la gestion des articles administrateur
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('erreur-message');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Empêcher le rechargement de la page

            const email = document.getElementById('email').value;
            const motDePasse = document.getElementById('mot-de-passe').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, motDePasse })
                });

                const result = await response.json();

                if (result.succès) {
                    // Rediriger vers le dashboard si connexion réussie
                    window.location.href = '/admin/dashboard.html';
                } else {
                    // Afficher le message d'erreur
                    errorMessage.textContent = result.message || 'Erreur de connexion';
                    errorMessage.style.display = 'block';
                }
            } catch (erreur) {
                errorMessage.textContent = 'Erreur de connexion au serveur';
                errorMessage.style.display = 'block';
                console.error('Erreur:', erreur);
            }
        });
    }

    // Gestion du formulaire de création / brouillon d'article
    const nouveauArticleForm = document.getElementById('nouveau-article-form');
    if (nouveauArticleForm) {
        nouveauArticleForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const messageErreur = document.getElementById('message-erreur');
            const messageSuccess = document.getElementById('message-success');

            if (messageErreur) messageErreur.style.display = 'none';
            if (messageSuccess) messageSuccess.style.display = 'none';

            // Déterminer le statut selon le bouton cliqué (Publier ou Brouillon)
            let statut = 'publie';
            if (e.submitter && e.submitter.value) {
                statut = e.submitter.value;
            }

            const formData = new FormData();
            formData.append('titre', document.getElementById('titre').value);
            formData.append('contenu', document.getElementById('contenu').value);
            formData.append('statut', statut);

            const imageFile = document.getElementById('image').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }

            try {
                const response = await fetch('/api/admin/articles', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.succès) {
                    if (messageSuccess) {
                        messageSuccess.textContent = result.message;
                        messageSuccess.style.display = 'block';
                    }

                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    if (messageErreur) {
                        messageErreur.textContent = result.message || 'Erreur lors de l\'enregistrement';
                        messageErreur.style.display = 'block';
                    }
                }
            } catch (erreur) {
                if (messageErreur) {
                    messageErreur.textContent = 'Erreur de connexion au serveur';
                    messageErreur.style.display = 'block';
                }
                console.error('Erreur:', erreur);
            }
        });
    }
});

// Fonction pour se déconnecter (appelable depuis n'importe quelle page)
async function seDeconnecter() {
    try {
        await fetch('/api/logout', {
            method: 'POST'
        });
        window.location.href = '/admin/login.html';
    } catch (erreur) {
        console.error('Erreur lors de la déconnexion:', erreur);
    }
}