// Cycle Garden - Main Application Logic
class CycleGarden {
    constructor() {
        this.cycleData = this.loadCycleData();
        this.plantData = this.loadPlantData();
        this.currentDate = new Date();
        
        this.initializeApp();
        this.setupEventListeners();
        this.startIdleGrowth();
    }

    // Data Management
    loadCycleData() {
        const saved = localStorage.getItem('cycleGarden_cycleData');
        return saved ? JSON.parse(saved) : null;
    }

    saveCycleData() {
        localStorage.setItem('cycleGarden_cycleData', JSON.stringify(this.cycleData));
    }

    loadPlantData() {
        const saved = localStorage.getItem('cycleGarden_plantData');
        return saved ? JSON.parse(saved) : {
            growthLevel: 1,
            careStreak: 0,
            lastCareDate: null,
            totalCareActions: 0,
            moodHistory: []
        };
    }

    savePlantData() {
        localStorage.setItem('cycleGarden_plantData', JSON.stringify(this.plantData));
    }

    // App Initialization
    initializeApp() {
        if (!this.cycleData) {
            this.showSetupScreen();
        } else {
            this.showGardenScreen();
            this.updateGarden();
        }
    }

    showSetupScreen() {
        document.getElementById('setup-screen').classList.add('active');
        document.getElementById('garden-screen').classList.remove('active');
    }

    showGardenScreen() {
        document.getElementById('setup-screen').classList.remove('active');
        document.getElementById('garden-screen').classList.add('active');
    }

    // Event Listeners
    setupEventListeners() {
        // Cycle setup form
        document.getElementById('cycle-setup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCycleSetup();
        });

        // Self-care buttons
        document.querySelectorAll('.care-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleCareAction(e.target.dataset.action);
            });
        });

        // Mood buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleMoodLog(e.target.dataset.mood);
            });
        });
    }

    // Cycle Setup
    handleCycleSetup() {
        const lastPeriod = document.getElementById('last-period').value;
        const cycleLength = parseInt(document.getElementById('cycle-length').value);

        if (!lastPeriod || !cycleLength) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        this.cycleData = {
            lastPeriod: new Date(lastPeriod),
            cycleLength: cycleLength,
            setupDate: new Date()
        };

        this.saveCycleData();
        this.showGardenScreen();
        this.updateGarden();
        this.showNotification('Welcome to your garden! Your plant is ready to grow with you.', 'success');
    }

    // Cycle Calculations
    getCurrentCycleDay() {
        if (!this.cycleData) return 1;
        
        const daysSinceLastPeriod = Math.floor((this.currentDate - this.cycleData.lastPeriod) / (1000 * 60 * 60 * 24));
        return (daysSinceLastPeriod % this.cycleData.cycleLength) + 1;
    }

    getCurrentPhase() {
        const cycleDay = this.getCurrentCycleDay();
        const cycleLength = this.cycleData.cycleLength;
        
        // Phase calculations based on typical cycle
        const menstrualDays = Math.ceil(cycleLength * 0.15); // ~15% of cycle
        const follicularDays = Math.ceil(cycleLength * 0.35); // ~35% of cycle
        const ovulationDays = Math.ceil(cycleLength * 0.1); // ~10% of cycle
        const lutealDays = cycleLength - menstrualDays - follicularDays - ovulationDays;

        if (cycleDay <= menstrualDays) {
            return 'menstrual';
        } else if (cycleDay <= menstrualDays + follicularDays) {
            return 'follicular';
        } else if (cycleDay <= menstrualDays + follicularDays + ovulationDays) {
            return 'ovulation';
        } else {
            return 'luteal';
        }
    }

    getDaysUntilNextPeriod() {
        if (!this.cycleData) return null;
        
        const cycleDay = this.getCurrentCycleDay();
        return this.cycleData.cycleLength - cycleDay + 1;
    }

    // Plant Management
    updatePlantAppearance() {
        const phase = this.getCurrentPhase();
        const plant = document.getElementById('plant');
        const weatherEffects = document.getElementById('weather-effects');
        
        // Remove all phase classes
        plant.className = 'plant';
        plant.classList.add(phase);
        
        // Update weather effects based on phase
        const rain = weatherEffects.querySelector('.rain');
        const sunshine = weatherEffects.querySelector('.sunshine');
        
        rain.style.opacity = '0';
        sunshine.style.opacity = '0';
        
        switch (phase) {
            case 'menstrual':
                rain.style.opacity = '1';
                break;
            case 'follicular':
                sunshine.style.opacity = '1';
                break;
            case 'ovulation':
                sunshine.style.opacity = '1';
                break;
            case 'luteal':
                sunshine.style.opacity = '0.7';
                break;
        }
    }

    updatePlantStatus() {
        const phase = this.getCurrentPhase();
        const plantName = document.getElementById('plant-name');
        const plantDescription = document.getElementById('plant-description');
        const growthLevel = document.getElementById('growth-level');
        const careStreak = document.getElementById('care-streak');
        
        const phaseInfo = this.getPhaseInfo(phase);
        
        plantName.textContent = phaseInfo.name;
        plantDescription.textContent = phaseInfo.description;
        growthLevel.textContent = this.plantData.growthLevel;
        careStreak.textContent = `${this.plantData.careStreak} days`;
    }

    getPhaseInfo(phase) {
        const phaseInfo = {
            menstrual: {
                name: 'Resting Willow',
                description: 'Your plant is resting and conserving energy, just like you during your menstrual phase.'
            },
            follicular: {
                name: 'Growing Sprout',
                description: 'New growth is emerging as your plant prepares for a new cycle of growth.'
            },
            ovulation: {
                name: 'Blooming Rose',
                description: 'Your plant is in full bloom, radiating energy and vitality.'
            },
            luteal: {
                name: 'Fruitful Tree',
                description: 'Your plant is bearing fruit and preparing for the next cycle.'
            }
        };
        
        return phaseInfo[phase] || phaseInfo.menstrual;
    }

    // Self-Care Actions
    handleCareAction(action) {
        const today = new Date().toDateString();
        const lastCareDate = this.plantData.lastCareDate;
        
        // Check if already completed today
        if (lastCareDate === today) {
            this.showNotification('You\'ve already nurtured your plant today! Come back tomorrow.', 'info');
            return;
        }
        
        // Update care streak
        if (lastCareDate && new Date(today) - new Date(lastCareDate) === 86400000) {
            this.plantData.careStreak++;
        } else if (lastCareDate !== today) {
            this.plantData.careStreak = 1;
        }
        
        this.plantData.lastCareDate = today;
        this.plantData.totalCareActions++;
        
        // Boost growth
        this.plantData.growthLevel += 0.1;
        
        this.savePlantData();
        this.updateGarden();
        
        const actionMessages = {
            hydration: 'Your plant glows with hydration! 💧',
            exercise: 'Your plant grows stronger with your energy! 🏃',
            meditation: 'Your plant finds peace in your calm! 🧘',
            rest: 'Your plant rests peacefully with you! 😴'
        };
        
        this.showNotification(actionMessages[action], 'success');
        
        // Mark button as completed
        const btn = document.querySelector(`[data-action="${action}"]`);
        btn.classList.add('completed');
        setTimeout(() => btn.classList.remove('completed'), 2000);
    }

    handleMoodLog(mood) {
        const today = new Date().toDateString();
        
        // Remove previous selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Mark current selection
        document.querySelector(`[data-mood="${mood}"]`).classList.add('selected');
        
        // Save mood
        const moodEntry = {
            date: today,
            mood: mood,
            phase: this.getCurrentPhase()
        };
        
        // Remove any existing entry for today
        this.plantData.moodHistory = this.plantData.moodHistory.filter(entry => entry.date !== today);
        this.plantData.moodHistory.push(moodEntry);
        
        this.savePlantData();
        
        const moodMessages = {
            great: 'Your plant radiates with your positive energy! ✨',
            good: 'Your plant grows happily with your good mood! 🌱',
            okay: 'Your plant understands and supports you! 🤗',
            tired: 'Your plant rests gently with you! 😴',
            crampy: 'Your plant sends you gentle healing energy! 💚'
        };
        
        this.showNotification(moodMessages[mood], 'success');
    }

    // Idle Growth System
    startIdleGrowth() {
        // Update growth every hour
        setInterval(() => {
            this.processIdleGrowth();
        }, 3600000); // 1 hour
        
        // Process growth on page load
        this.processIdleGrowth();
    }

    processIdleGrowth() {
        if (!this.cycleData) return;
        
        const now = new Date();
        const lastUpdate = this.plantData.lastGrowthUpdate || now;
        const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);
        
        if (hoursPassed >= 1) {
            // Base growth rate
            let growthRate = 0.01;
            
            // Boost growth based on care streak
            if (this.plantData.careStreak > 0) {
                growthRate += this.plantData.careStreak * 0.005;
            }
            
            // Phase-based growth modifiers
            const phase = this.getCurrentPhase();
            const phaseModifiers = {
                menstrual: 0.5,
                follicular: 1.2,
                ovulation: 1.5,
                luteal: 1.0
            };
            
            growthRate *= phaseModifiers[phase];
            
            this.plantData.growthLevel += growthRate * hoursPassed;
            this.plantData.lastGrowthUpdate = now;
            
            this.savePlantData();
            this.updateGarden();
        }
    }

    // Garden Updates
    updateGarden() {
        if (!this.cycleData) return;
        
        this.updateCycleInfo();
        this.updatePlantAppearance();
        this.updatePlantStatus();
        this.updateGardenNotes();
        this.checkNotifications();
    }

    updateCycleInfo() {
        const phase = this.getCurrentPhase();
        const cycleDay = this.getCurrentCycleDay();
        const cycleLength = this.cycleData.cycleLength;
        const daysUntilNext = this.getDaysUntilNextPeriod();
        
        document.getElementById('current-phase-name').textContent = this.formatPhaseName(phase);
        document.getElementById('cycle-progress-text').textContent = `Day ${cycleDay} of ${cycleLength}`;
        
        const progressPercent = (cycleDay / cycleLength) * 100;
        document.getElementById('cycle-progress-fill').style.width = `${progressPercent}%`;
    }

    formatPhaseName(phase) {
        const names = {
            menstrual: 'Menstrual Phase',
            follicular: 'Follicular Phase',
            ovulation: 'Ovulation Phase',
            luteal: 'Luteal Phase'
        };
        return names[phase] || 'Unknown Phase';
    }

    updateGardenNotes() {
        const phase = this.getCurrentPhase();
        const notesContainer = document.getElementById('garden-notes');
        
        const phaseNotes = {
            menstrual: 'Your plant is resting during your menstrual phase. This is a time for gentle self-care and rest.',
            follicular: 'New growth is emerging! Your plant is preparing for a new cycle of growth and energy.',
            ovulation: 'Your plant is in full bloom! This is a time of peak energy and vitality.',
            luteal: 'Your plant is bearing fruit and preparing for the next cycle. A time of harvest and preparation.'
        };
        
        const note = notesContainer.querySelector('.note p');
        note.textContent = phaseNotes[phase] || phaseNotes.menstrual;
    }

    // Notifications
    checkNotifications() {
        const daysUntilNext = this.getDaysUntilNextPeriod();
        
        if (daysUntilNext === 3) {
            this.showNotification('Your next period is approaching in 3 days. Your plant is preparing for rest.', 'info');
        } else if (daysUntilNext === 1) {
            this.showNotification('Your period starts tomorrow. Your plant is ready to rest with you.', 'info');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        notificationText.textContent = message;
        notification.classList.remove('hidden');
        notification.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 300);
        }, 5000);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CycleGarden();
});

// Service Worker for notifications (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}
