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
});