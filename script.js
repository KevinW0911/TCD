class TimeTracker {
    constructor() {
        this.timer = null;
        this.timeLeft = 15 * 60; // 15 minutes in seconds
        this.isRunning = false;
        this.isPaused = false;
        this.currentTask = null;
        this.taskHistory = JSON.parse(localStorage.getItem('taskHistory')) || [];
        
        this.initializeElements();
        this.bindEvents();
        this.displayHistory();
        this.updateDisplay();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.notesInput = document.getElementById('notesInput');
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.stopButton = document.getElementById('stopButton');
        this.continueButton = document.getElementById('continueButton');
        this.nextTaskButton = document.getElementById('nextTaskButton');
        
        this.timeLeftDisplay = document.getElementById('timeLeft');
        this.timerStatus = document.getElementById('timerStatus');
        this.startTimeDisplay = document.getElementById('startTime');
        this.endTimeDisplay = document.getElementById('endTime');
        
        this.controlSection = document.getElementById('controlSection');
        this.completionSection = document.getElementById('completionSection');
        this.taskHistoryElement = document.getElementById('taskHistory');
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.startTimer());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        this.stopButton.addEventListener('click', () => this.stopTimer());
        this.continueButton.addEventListener('click', () => this.continueTask());
        this.nextTaskButton.addEventListener('click', () => this.nextTask());
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    startTimer() {
        const taskName = this.taskInput.value.trim();
        if (!taskName) {
            alert('請輸入任務項目！');
            return;
        }

        this.currentTask = {
            name: taskName,
            notes: this.notesInput.value.trim(),
            startTime: new Date(),
            totalTime: 0,
            sessions: []
        };

        this.timeLeft = 15 * 60;
        this.isRunning = true;
        this.isPaused = false;
        
        this.startButton.disabled = true;
        this.taskInput.disabled = true;
        this.notesInput.disabled = true;
        
        this.controlSection.style.display = 'flex';
        this.completionSection.style.display = 'none';
        
        this.updateTimeDisplay();
        this.timerStatus.textContent = '計時中...';
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    togglePause() {
        if (this.isPaused) {
            this.isPaused = false;
            this.pauseButton.textContent = '暫停';
            this.timerStatus.textContent = '計時中...';
            
            // 更新結束時間為當前時間加上剩餘時間
            this.updateTimeDisplay();
            
            this.timer = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                
                if (this.timeLeft <= 0) {
                    this.completeSession();
                }
            }, 1000);
        } else {
            this.isPaused = true;
            this.pauseButton.textContent = '繼續';
            this.timerStatus.textContent = '已暫停';
            clearInterval(this.timer);
        }
    }

    stopTimer() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.currentTask) {
            const sessionTime = 15 * 60 - this.timeLeft;
            this.currentTask.sessions.push({
                startTime: new Date(Date.now() - sessionTime * 1000),
                endTime: new Date(),
                duration: sessionTime,
                completed: false
            });
            this.currentTask.totalTime += sessionTime;
            this.saveTask();
        }
        
        this.resetUI();
    }

    completeSession() {
        clearInterval(this.timer);
        
        const sessionEndTime = new Date();
        this.currentTask.sessions.push({
            startTime: new Date(sessionEndTime.getTime() - 15 * 60 * 1000),
            endTime: sessionEndTime,
            duration: 15 * 60,
            completed: true
        });
        this.currentTask.totalTime += 15 * 60;
        
        this.controlSection.style.display = 'none';
        this.completionSection.style.display = 'block';
        this.timerStatus.textContent = '時間到！';
        
        this.showNotification();
        this.playNotificationSound();
    }

    continueTask() {
        this.timeLeft = 15 * 60;
        this.isRunning = true;
        this.isPaused = false;
        
        this.controlSection.style.display = 'flex';
        this.completionSection.style.display = 'none';
        this.timerStatus.textContent = '計時中...';
        
        this.updateTimeDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    nextTask() {
        this.saveTask();
        this.resetUI();
    }

    saveTask() {
        if (this.currentTask && this.currentTask.totalTime > 0) {
            this.currentTask.endTime = new Date();
            this.taskHistory.unshift(this.currentTask);
            localStorage.setItem('taskHistory', JSON.stringify(this.taskHistory));
            this.displayHistory();
        }
        this.currentTask = null;
    }

    resetUI() {
        this.timeLeft = 15 * 60;
        this.isRunning = false;
        this.isPaused = false;
        
        this.startButton.disabled = false;
        this.taskInput.disabled = false;
        this.notesInput.disabled = false;
        this.taskInput.value = '';
        this.notesInput.value = '';
        
        this.controlSection.style.display = 'none';
        this.completionSection.style.display = 'none';
        
        this.pauseButton.textContent = '暫停';
        this.timerStatus.textContent = '準備開始';
        this.startTimeDisplay.textContent = '--:--';
        this.endTimeDisplay.textContent = '--:--';
        
        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeLeftDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateTimeDisplay() {
        const now = new Date();
        const endTime = new Date(now.getTime() + this.timeLeft * 1000);
        
        this.startTimeDisplay.textContent = this.formatTime(now);
        this.endTimeDisplay.textContent = this.formatTime(endTime);
    }

    formatTime(date) {
        return date.toLocaleTimeString('zh-TW', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}時 ${minutes}分 ${secs}秒`;
        } else if (minutes > 0) {
            return `${minutes}分 ${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    }

    displayHistory() {
        if (this.taskHistory.length === 0) {
            this.taskHistoryElement.innerHTML = '<p class="no-records">尚無任務記錄</p>';
            return;
        }

        this.taskHistoryElement.innerHTML = this.taskHistory.map(task => {
            const completedSessions = task.sessions.filter(s => s.completed).length;
            const totalSessions = task.sessions.length;
            
            return `
                <div class="task-record">
                    <h4>${task.name}</h4>
                    <div class="task-meta">
                        <span>${this.formatTime(new Date(task.startTime))} - ${this.formatTime(new Date(task.endTime))}</span>
                        <span class="duration">${this.formatDuration(task.totalTime)}</span>
                    </div>
                    <div class="task-meta">
                        <span>完成 ${completedSessions}/${totalSessions} 個時段</span>
                        <span>${new Date(task.startTime).toLocaleDateString('zh-TW')}</span>
                    </div>
                    ${task.notes ? `<div class="task-notes">備註：${task.notes}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    showNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('時間到！', {
                body: `任務「${this.currentTask.name}」的 15 分鐘時間已到`,
                icon: '⏰'
            });
        }
    }

    playNotificationSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
        } catch (error) {
            console.log('無法播放音效');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimeTracker();
});