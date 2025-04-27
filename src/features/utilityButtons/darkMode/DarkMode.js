export default class DarkMode {
    constructor() {
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.body = document.body;
        this.icon = this.darkModeToggle.querySelector('i');
        
        // Initialize logo image references
        this.logoImage = document.querySelector('.header-image');
        this.lightLogoSrc = this.logoImage ? this.logoImage.src : '';
        this.darkLogoSrc = this.logoImage ? this.logoImage.getAttribute('data-dark-src') : '';
    }

    init() {
        this.loadSavedPreference();
        this.setupEventListeners();
    }

    loadSavedPreference() {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'enabled') {
            this.enableDarkMode();
        }
    }

    setupEventListeners() {
        this.darkModeToggle.addEventListener('click', () => {
            this.body.classList.toggle('dark-mode');
            this.updateUI();
            this.savePreference();
        });
    }

    updateUI() {
        const isDarkMode = this.body.classList.contains('dark-mode');
        
        // Update icon
        this.icon.classList.remove(isDarkMode ? 'fa-moon' : 'fa-sun');
        this.icon.classList.add(isDarkMode ? 'fa-sun' : 'fa-moon');
        


        // Update tooltip text with line break
        const tooltipSpan = this.darkModeToggle.querySelector('.tooltip');
        tooltipSpan.innerHTML = isDarkMode ? 'Light<br>Mode' : 'Dark<br>Mode';
    }

    enableDarkMode() {
        this.body.classList.add('dark-mode');
        this.updateUI();
    }

    disableDarkMode() {
        this.body.classList.remove('dark-mode');
        this.updateUI();
    }

    savePreference() {
        const isDarkMode = this.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : null);
    }
} 