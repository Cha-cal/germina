// Script pour la boîte de réception admin
document.addEventListener('DOMContentLoaded', () => {
    chargerMessages();
});

async function chargerMessages() {
    const container = document.getElementById('liste-messages');

    if (!container) return;

    try {
        const response = await fetch('/api/admin/messages');

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/admin/login.html';
                return;
            }
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const messages = await response.json();

        // Vider le conteneur
        container.innerHTML = '';

        // Si aucun message
        if (messages.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic; text-align: center; padding: 40px;">Aucun message pour le moment.</p>';
            return;
        }

        // Afficher chaque message
        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message-card';
            messageElement.dataset.id = message.id;

            const date = new Date(message.date_creation);
            const dateFormatee = date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            messageElement.innerHTML = `
                <div class="message-header">
                    <h3>${message.nom}</h3>
                    <span class="message-date">${dateFormatee}</span>
                </div>
                <p class="message-email">${message.email}</p>
                <div class="message-content">${message.message}</div>
                <div class="message-actions">
                    <button class="btn-admin btn-supprimer" title="Supprimer" data-action="supprimer" data-id="${message.id}">🗑️ Supprimer</button>
                </div>
            `;

            container.appendChild(messageElement);
        });

        // Attacher les événements
        attacherEvenements();

    } catch (erreur) {
        console.error('Erreur lors du chargement des messages:', erreur);
        container.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Erreur de chargement.</p>';
    }
}

function attacherEvenements() {
    document.querySelectorAll('.message-card .btn-supprimer').forEach(button => {
        button.addEventListener('click', async (e) => {
            const messageId = e.target.dataset.id;

            if (!messageId) return;

            // Confirmation avant suppression
            if (!window.confirm("Supprimer ce message ?")) {
                return;
            }

            try {
                const response = await fetch(`/api/admin/messages/${messageId}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (result.succès) {
                    // Retirer la carte de l'écran (animation + suppression DOM)
                    const card = document.querySelector(`.message-card[data-id="${messageId}"]`);
                    if (card) {
                        card.style.opacity = '0';
                        card.style.transform = 'translateX(20px)';
                        card.style.transition = 'opacity 0.3s, transform 0.3s';
                        setTimeout(() => card.remove(), 300);
                    }
                } else {
                    alert(result.erreur || result.message || 'Erreur lors de la suppression');
                }
            } catch (erreur) {
                console.error('Erreur:', erreur);
                alert('Erreur de connexion au serveur');
            }
        });
    });
}