// Dashboard Interactions
document.addEventListener('DOMContentLoaded', function() {
    // Load user data
    loadUserData();
    
    // Load recent activity
    loadRecentActivity();
    
    // Setup event listeners
    setupEventListeners();
});

function loadUserData() {
    // Simulate loading user data
    const userData = {
        name: 'Dev Kumar',
        streak: 23,
        quizzesCompleted: 47,
        averageScore: 78,
        rank: 156
    };
    
    // Update UI with user data
    updateUserStats(userData);
}

function updateUserStats(data) {
    // Update stats in the DOM
    const statsElements = {
        streak: document.querySelector('.stat-card:nth-child(2) .stat-number'),
        quizzes: document.querySelector('.stat-card:nth-child(1) .stat-number'),
        score: document.querySelector('.stat-card:nth-child(3) .stat-number')
    };
    
    if (statsElements.streak) {
        statsElements.streak.textContent = data.streak;
    }
    if (statsElements.quizzes) {
        statsElements.quizzes.textContent = data.quizzesCompleted;
    }
    if (statsElements.score) {
        statsElements.score.textContent = data.averageScore + '%';
    }
}

function loadRecentActivity() {
    const activities = [
        { type: 'quiz', subject: 'Data Structures', score: '85%', time: '2 hours ago' },
        { type: 'chat', subject: 'OS Discussion', messages: 12, time: '5 hours ago' },
        { type: 'achievement', subject: '7 Day Streak', reward: '50 points', time: '1 day ago' }
    ];
    
    displayActivities(activities);
}

function displayActivities(activities) {
    const activityContainer = document.querySelector('.recent-activities');
    if (!activityContainer) return;
    
    let html = '<h3>Recent Activities</h3>';
    activities.forEach(activity => {
        html += `
            <div class="activity-item">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                <div class="activity-details">
                    <p>${activity.subject}</p>
                    <small>${activity.time}</small>
                </div>
            </div>
        `;
    });
    
    activityContainer.innerHTML = html;
}

function getActivityIcon(type) {
    const icons = {
        quiz: 'question-circle',
        chat: 'comments',
        achievement: 'trophy'
    };
    return icons[type] || 'circle';
}

function setupEventListeners() {
    // Subject card clicks
    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', function() {
            const subject = this.querySelector('span').textContent;
            window.location.href = `subjects.html?subject=${encodeURIComponent(subject)}`;
        });
    });
    
    // Continue learning button
    const continueBtn = document.querySelector('.btn-continue');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            window.location.href = 'quiz-generator.html';
        });
    }
    
    // Search functionality
    const searchInput = document.querySelector('.header-search input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            performSearch(e.target.value);
        }, 500));
    }
}

function performSearch(query) {
    if (query.length < 2) return;
    
    // Simulate search results
    console.log('Searching for:', query);
    // In real app, this would make an API call
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Chart initialization (if using Chart.js)
function initializeCharts() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Study Hours',
                data: [2, 3, 1.5, 4, 2.5, 3.5, 2],
                borderColor: '#6366f1',
                tension: 0.4
            }]
        }
    });
}