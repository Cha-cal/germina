// Script pour la connexion administrateur
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