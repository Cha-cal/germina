// Script pour la publication d'un nouvel article
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('nouveau-article-form');
    const messageErreur = document.getElementById('message-erreur');
    const messageSuccess = document.getElementById('message-success');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Vider les messages
            messageErreur.style.display = 'none';
            messageSuccess.style.display = 'none';

            // Déterminer le statut selon le bouton cliqué (Publier ou Brouillon)
            let statut = 'publie';
            if (e.submitter && e.submitter.value) {
                statut = e.submitter.value;
            }

            // Créer FormData pour envoyer texte + fichier + statut
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
                    // Rediriger vers le dashboard avec message de succès
                    messageSuccess.textContent = result.message;
                    messageSuccess.style.display = 'block';

                    // Redirection après 1 seconde
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    messageErreur.textContent = result.message || 'Erreur lors de la publication';
                    messageErreur.style.display = 'block';
                }
            } catch (erreur) {
                messageErreur.textContent = 'Erreur de connexion au serveur';
                messageErreur.style.display = 'block';
                console.error('Erreur:', erreur);
            }
        });
    }
});