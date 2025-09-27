// Cycle Garden - Main Application Logic
class CycleGarden {
    constructor() {
        this.cycleData = this.loadCycleData();
        this.plantData = this.loadPlantData();
        this.periodData = this.loadPeriodData();
        this.currentDate = new Date();
        this.calendarDate = new Date();
        this.selectedDate = null;
        
        this.initializeApp();
        this.setupEventListeners();
        this.startIdleGrowth();
        this.updatePeriodEndButton();
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

    loadPeriodData() {
        const saved = localStorage.getItem('cycleGarden_periodData');
        return saved ? JSON.parse(saved) : {};
    }

    savePeriodData() {
        localStorage.setItem('cycleGarden_periodData', JSON.stringify(this.periodData));
    }

    // App Initialization
    initializeApp() {
        if (!this.cycleData) {
            this.showSetupScreen();
        } else {
            this.showGardenScreen();
            this.updateGarden();
            this.renderCalendar();
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

        // Calendar controls
        document.getElementById('toggle-calendar').addEventListener('click', () => {
            this.toggleCalendar();
        });

        document.getElementById('prev-month').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Flow modal
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeFlowModal();
        });

        document.getElementById('save-flow').addEventListener('click', () => {
            this.saveFlowData();
        });

        document.getElementById('delete-flow').addEventListener('click', () => {
            this.deleteFlowData();
        });

        // Period start/end buttons
        document.getElementById('period-started-today').addEventListener('click', () => {
            this.quickLogPeriod('start');
        });

        document.getElementById('period-ended-today').addEventListener('click', () => {
            this.quickLogPeriod('end');
        });

        // Flow buttons
        document.querySelectorAll('.flow-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectFlowType(e.target.dataset.flow);
            });
        });

        // Period type buttons
        document.querySelectorAll('.period-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectPeriodType(e.target.dataset.type);
            });
        });

        // Modal backdrop click
        document.getElementById('flow-modal').addEventListener('click', (e) => {
            if (e.target.id === 'flow-modal') {
                this.closeFlowModal();
            }
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
        
        // Try to find the most recent period start from actual period data
        const lastPeriodStart = this.getLastPeriodStart();
        if (lastPeriodStart) {
            const daysSinceLastPeriod = Math.floor((this.currentDate - lastPeriodStart) / (1000 * 60 * 60 * 24));
            
            // Handle negative days
            if (daysSinceLastPeriod < 0) {
                return 1;
            }
            
            // Calculate cycle day
            const cycleDay = daysSinceLastPeriod + 1;
            
            // Ensure cycle day is valid
            if (isNaN(cycleDay) || cycleDay < 1) {
                return 1;
            }
            
            return Math.min(cycleDay, this.cycleData.cycleLength);
        }
        
        // Fallback to original calculation if no period data
        const daysSinceLastPeriod = Math.floor((this.currentDate - this.cycleData.lastPeriod) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastPeriod < 0) {
            return 1;
        }
        
        const cycleDay = (daysSinceLastPeriod % this.cycleData.cycleLength) + 1;
        
        if (isNaN(cycleDay) || cycleDay < 1) {
            return 1;
        }
        
        return Math.min(cycleDay, this.cycleData.cycleLength);
    }

    // Get the most recent period start date from period data
    getLastPeriodStart() {
        if (!this.periodData || Object.keys(this.periodData).length === 0) {
            return null;
        }
        
        const periodDates = Object.keys(this.periodData).sort();
        let lastStartDate = null;
        
        // Find the most recent period start
        for (let i = periodDates.length - 1; i >= 0; i--) {
            const dateString = periodDates[i];
            const periodData = this.periodData[dateString];
            
            if (periodData.periodType === 'start') {
                const date = new Date(dateString);
                if (!lastStartDate || date > lastStartDate) {
                    lastStartDate = date;
                }
            }
        }
        
        return lastStartDate;
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
        
        // Save mood to both plant data and period data
        const moodEntry = {
            date: today,
            mood: mood,
            phase: this.getCurrentPhase()
        };
        
        // Remove any existing entry for today
        this.plantData.moodHistory = this.plantData.moodHistory.filter(entry => entry.date !== today);
        this.plantData.moodHistory.push(moodEntry);
        
        // Also save mood to period data for that day
        if (!this.periodData[today]) {
            this.periodData[today] = {
                flow: 'none',
                periodType: 'none',
                symptoms: [],
                notes: '',
                date: today
            };
        }
        
        // Add mood to notes
        const moodText = this.getMoodText(mood);
        const existingNotes = this.periodData[today].notes || '';
        const moodNote = `Mood: ${moodText}`;
        
        // Only add mood note if it's not already there
        if (!existingNotes.includes('Mood:')) {
            this.periodData[today].notes = existingNotes ? `${existingNotes}\n${moodNote}` : moodNote;
        } else {
            // Replace existing mood note
            this.periodData[today].notes = existingNotes.replace(/Mood: .*/, moodNote);
        }
        
        this.savePlantData();
        this.savePeriodData();
        
        const moodMessages = {
            great: 'Your plant radiates with your positive energy! ✨',
            good: 'Your plant grows happily with your good mood! 🌱',
            okay: 'Your plant understands and supports you! 🤗',
            tired: 'Your plant rests gently with you! 😴',
            crampy: 'Your plant sends you gentle healing energy! 💚'
        };
        
        this.showNotification(moodMessages[mood], 'success');
    }

    getMoodText(mood) {
        const moodTexts = {
            great: 'Great 😊',
            good: 'Good 😌',
            okay: 'Okay 😐',
            tired: 'Tired 😴',
            crampy: 'Crampy 😣'
        };
        return moodTexts[mood] || mood;
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
        if (!this.cycleData) {
            document.getElementById('current-phase-name').textContent = 'No cycle data';
            document.getElementById('cycle-progress-text').textContent = 'Please set up your cycle';
            return;
        }
        
        const phase = this.getCurrentPhase();
        const cycleDay = this.getCurrentCycleDay();
        const cycleLength = this.cycleData.cycleLength;
        const daysUntilNext = this.getDaysUntilNextPeriod();
        
        // Ensure cycle day is valid
        const validCycleDay = isNaN(cycleDay) ? 1 : Math.max(1, Math.min(cycleDay, cycleLength));
        
        document.getElementById('current-phase-name').textContent = this.formatPhaseName(phase);
        document.getElementById('cycle-progress-text').textContent = `Day ${validCycleDay} of ${cycleLength}`;
        
        const progressPercent = Math.max(0, Math.min(100, (validCycleDay / cycleLength) * 100));
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

    // Calendar Functionality
    toggleCalendar() {
        const calendarContainer = document.getElementById('calendar-container');
        const toggleBtn = document.getElementById('toggle-calendar');
        
        if (calendarContainer.classList.contains('hidden')) {
            calendarContainer.classList.remove('hidden');
            toggleBtn.textContent = 'Hide Calendar';
            this.renderCalendar();
        } else {
            calendarContainer.classList.add('hidden');
            toggleBtn.textContent = 'View Calendar';
        }
    }

    // Update period end button visibility
    updatePeriodEndButton() {
        const endButton = document.getElementById('period-ended-today');
        const hasActivePeriod = this.hasActivePeriod();
        
        if (hasActivePeriod) {
            endButton.style.display = 'block';
        } else {
            endButton.style.display = 'none';
        }
    }

    // Check if there's an active period
    hasActivePeriod() {
        const today = new Date();
        const todayString = today.toDateString();
        
        // Check if today has period data
        if (this.periodData[todayString]) {
            const todayData = this.periodData[todayString];
            return todayData.periodType === 'start' || todayData.periodType === 'continue';
        }
        
        // Check if there's a recent start without an end
        const periodDates = Object.keys(this.periodData).sort();
        let hasRecentStart = false;
        let hasRecentEnd = false;
        
        for (let i = periodDates.length - 1; i >= 0; i--) {
            const dateString = periodDates[i];
            const periodData = this.periodData[dateString];
            const date = new Date(dateString);
            const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
            
            // Only consider dates within the last 10 days
            if (daysDiff <= 10) {
                if (periodData.periodType === 'start') {
                    hasRecentStart = true;
                } else if (periodData.periodType === 'end') {
                    hasRecentEnd = true;
                }
            }
        }
        
        return hasRecentStart && !hasRecentEnd;
    }

    changeMonth(direction) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month-year').textContent = 
            `${monthNames[month]} ${year}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Clear calendar
        const calendarDays = document.getElementById('calendar-days');
        calendarDays.innerHTML = '';
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            emptyDay.textContent = '';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDate = new Date(year, month, day);
            const dateString = currentDate.toDateString();
            
            // Check if today
            if (this.isSameDate(currentDate, this.currentDate)) {
                dayElement.classList.add('today');
            }
            
            // Check if has period data
            if (this.periodData[dateString]) {
                dayElement.classList.add('has-flow', this.periodData[dateString].flow);
            }
            
            // Add click event
            dayElement.addEventListener('click', () => {
                this.openFlowModal(currentDate);
            });
            
            calendarDays.appendChild(dayElement);
        }
    }

    isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    openFlowModal(date) {
        this.selectedDate = date;
        const dateString = date.toDateString();
        const modal = document.getElementById('flow-modal');
        
        // Clear previous selections
        document.querySelectorAll('.flow-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('flow-notes').value = '';
        
        // If date has existing data, populate modal
        if (this.periodData[dateString]) {
            const flowData = this.periodData[dateString];
            document.querySelector(`[data-flow="${flowData.flow}"]`).classList.add('selected');
            document.getElementById('flow-notes').value = flowData.notes || '';
        }
        
        modal.classList.remove('hidden');
    }

    closeFlowModal() {
        document.getElementById('flow-modal').classList.add('hidden');
        this.selectedDate = null;
    }

    selectFlowType(flowType) {
        // Remove previous selection
        document.querySelectorAll('.flow-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Add selection to clicked button
        document.querySelector(`[data-flow="${flowType}"]`).classList.add('selected');
    }

    saveFlowData() {
        if (!this.selectedDate) return;
        
        const selectedFlow = document.querySelector('.flow-btn.selected');
        if (!selectedFlow) {
            this.showNotification('Please select a flow type', 'error');
            return;
        }
        
        const flowType = selectedFlow.dataset.flow;
        const notes = document.getElementById('flow-notes').value;
        const dateString = this.selectedDate.toDateString();
        
        this.periodData[dateString] = {
            flow: flowType,
            notes: notes,
            date: dateString
        };
        
        this.savePeriodData();
        this.renderCalendar();
        this.closeFlowModal();
        
        this.showNotification('Period data saved successfully!', 'success');
    }

    deleteFlowData() {
        if (!this.selectedDate) return;
        
        const dateString = this.selectedDate.toDateString();
        delete this.periodData[dateString];
        
        this.savePeriodData();
        this.renderCalendar();
        this.closeFlowModal();
        this.updatePeriodEndButton();
        
        this.showNotification('Period data deleted', 'info');
    }

    // Quick period logging
    quickLogPeriod(type) {
        const today = new Date();
        const dateString = today.toDateString();
        
        if (type === 'start') {
            this.periodData[dateString] = {
                flow: 'medium',
                periodType: 'start',
                symptoms: [],
                notes: 'Period started today',
                date: dateString
            };
            this.showNotification('Period started logged! Your plant is preparing for rest.', 'success');
        } else if (type === 'end') {
            this.periodData[dateString] = {
                flow: 'light',
                periodType: 'end',
                symptoms: [],
                notes: 'Period ended today',
                date: dateString
            };
            this.showNotification('Period ended logged! Your plant is ready for new growth.', 'success');
        }
        
        this.savePeriodData();
        this.renderCalendar();
        this.updatePeriodEndButton();
    }

    selectPeriodType(type) {
        // Remove previous selection
        document.querySelectorAll('.period-type-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Add selection to clicked button
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    }

    // Enhanced calendar rendering with period coloring
    renderCalendar() {
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month-year').textContent = 
            `${monthNames[month]} ${year}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Clear calendar
        const calendarDays = document.getElementById('calendar-days');
        calendarDays.innerHTML = '';
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            emptyDay.textContent = '';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDate = new Date(year, month, day);
            const dateString = currentDate.toDateString();
            
            // Check if today
            if (this.isSameDate(currentDate, this.currentDate)) {
                dayElement.classList.add('today');
            }
            
            // Check if has period data and apply appropriate styling
            if (this.periodData[dateString]) {
                const periodData = this.periodData[dateString];
                dayElement.classList.add('has-flow', periodData.flow);
                
                // Add period type styling
                if (periodData.periodType === 'start') {
                    dayElement.classList.add('period-start');
                } else if (periodData.periodType === 'end') {
                    dayElement.classList.add('period-end');
                } else if (periodData.periodType === 'continue') {
                    dayElement.classList.add('period-active');
                }
            }
            
            // Add click event
            dayElement.addEventListener('click', () => {
                this.openFlowModal(currentDate);
            });
            
            calendarDays.appendChild(dayElement);
        }
    }

    // Enhanced modal opening with period type selection
    openFlowModal(date) {
        this.selectedDate = date;
        const dateString = date.toDateString();
        const modal = document.getElementById('flow-modal');
        
        // Clear previous selections
        document.querySelectorAll('.flow-btn, .period-type-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('flow-notes').value = '';
        
        // Clear symptom checkboxes
        document.querySelectorAll('.symptom-checkbox input').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // If date has existing data, populate modal
        if (this.periodData[dateString]) {
            const flowData = this.periodData[dateString];
            
            // Set period type
            if (flowData.periodType) {
                document.querySelector(`[data-type="${flowData.periodType}"]`).classList.add('selected');
            }
            
            // Set flow level
            if (flowData.flow) {
                document.querySelector(`[data-flow="${flowData.flow}"]`).classList.add('selected');
            }
            
            // Set symptoms
            if (flowData.symptoms) {
                flowData.symptoms.forEach(symptom => {
                    const checkbox = document.querySelector(`[data-symptom="${symptom}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            
            // Set notes
            document.getElementById('flow-notes').value = flowData.notes || '';
        }
        
        modal.classList.remove('hidden');
    }

    // Enhanced save functionality
    saveFlowData() {
        if (!this.selectedDate) return;
        
        const selectedPeriodType = document.querySelector('.period-type-btn.selected');
        const selectedFlow = document.querySelector('.flow-btn.selected');
        
        if (!selectedPeriodType) {
            this.showNotification('Please select a period status', 'error');
            return;
        }
        
        const periodType = selectedPeriodType.dataset.type;
        const flowType = selectedFlow ? selectedFlow.dataset.flow : 'none';
        const notes = document.getElementById('flow-notes').value;
        
        // Get selected symptoms
        const symptoms = [];
        document.querySelectorAll('.symptom-checkbox input:checked').forEach(checkbox => {
            symptoms.push(checkbox.dataset.symptom);
        });
        
        const dateString = this.selectedDate.toDateString();
        
        this.periodData[dateString] = {
            flow: flowType,
            periodType: periodType,
            symptoms: symptoms,
            notes: notes,
            date: dateString
        };
        
        // Auto-fill days between start and end
        this.autoFillPeriodDays();
        
        this.savePeriodData();
        this.renderCalendar();
        this.closeFlowModal();
        this.updatePeriodEndButton();
        
        this.showNotification('Period data saved successfully!', 'success');
    }

    // Auto-fill days between period start and end
    autoFillPeriodDays() {
        const periodDates = Object.keys(this.periodData).sort();
        let startDate = null;
        let endDate = null;
        
        // Find the most recent start and end dates
        for (let i = periodDates.length - 1; i >= 0; i--) {
            const dateString = periodDates[i];
            const periodData = this.periodData[dateString];
            
            if (periodData.periodType === 'start' && !startDate) {
                startDate = new Date(dateString);
            } else if (periodData.periodType === 'end' && !endDate) {
                endDate = new Date(dateString);
            }
        }
        
        // If we have both start and end dates, fill the days between
        if (startDate && endDate && startDate < endDate) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + 1); // Start from day after start
            
            while (currentDate < endDate) {
                const dateString = currentDate.toDateString();
                
                // Only fill if the day doesn't already have data
                if (!this.periodData[dateString]) {
                    this.periodData[dateString] = {
                        flow: 'medium', // Default flow for auto-filled days
                        periodType: 'continue',
                        symptoms: [],
                        notes: 'Auto-filled period day',
                        date: dateString
                    };
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
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
