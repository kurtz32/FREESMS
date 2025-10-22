// Free SMS Sender - PWA Application
class FreeSMSSender {
    constructor() {
        this.selectedNetwork = 'tm';
        this.isOnline = navigator.onLine;
        this.deferredPrompt = null;
        this.smsAPI = new SMSAPI();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateNetworkStatus();
        this.updateCharCounter();
        this.registerServiceWorker();
        this.setupInstallPrompt();
    }

    bindEvents() {
        // Network selection
        document.querySelectorAll('.network-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectNetwork(e.target.dataset.network);
            });
        });

        // Form submission
        document.getElementById('smsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendSMS();
        });

        // Character counter
        document.getElementById('message').addEventListener('input', () => {
            this.updateCharCounter();
        });

        // Online/offline detection
        window.addEventListener('online', () => this.updateNetworkStatus());
        window.addEventListener('offline', () => this.updateNetworkStatus());

        // Install prompt
        document.getElementById('installBtn').addEventListener('click', () => {
            this.installPWA();
        });

        document.getElementById('dismissBtn').addEventListener('click', () => {
            document.getElementById('installPrompt').style.display = 'none';
        });
    }

    selectNetwork(network) {
        this.selectedNetwork = network;
        document.querySelectorAll('.network-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.network === network);
        });
    }

    updateCharCounter() {
        const message = document.getElementById('message').value;
        const count = message.length;
        document.getElementById('charCount').textContent = count;

        // Change color based on length
        const counter = document.querySelector('.char-counter');
        if (count > 140) {
            counter.style.color = '#dc3545';
        } else if (count > 120) {
            counter.style.color = '#ffc107';
        } else {
            counter.style.color = '#666';
        }
    }

    updateNetworkStatus() {
        this.isOnline = navigator.onLine;
        const indicator = document.getElementById('offlineIndicator');
        const status = document.getElementById('networkStatus');

        if (this.isOnline) {
            indicator.className = 'offline-indicator online';
            status.textContent = 'Online';
            indicator.style.display = 'block';
        } else {
            indicator.className = 'offline-indicator offline';
            status.textContent = 'Offline';
            indicator.style.display = 'block';
        }

        // Hide indicator after 3 seconds
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }

    async sendSMS() {
        const recipient = document.getElementById('recipient').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!recipient || !message) {
            this.showResult('Please fill in all fields', 'error');
            return;
        }

        if (!this.validatePhoneNumber(recipient)) {
            this.showResult('Please enter a valid Philippine mobile number', 'error');
            return;
        }

        // Show loading state
        this.setLoading(true);

        try {
            // Use real SMS API
            const result = await this.smsAPI.sendSMS(recipient, message, this.selectedNetwork);

            if (result.success) {
                let successMessage = `SMS sent successfully to ${recipient}`;
                if (result.queued) {
                    successMessage += ' (queued for offline sending)';
                }
                this.showResult(successMessage, 'success');

                // Clear form
                document.getElementById('smsForm').reset();
                this.updateCharCounter();
            } else {
                this.showResult(result.message, 'error');
            }

        } catch (error) {
            this.showResult('Failed to send SMS. Please try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    validatePhoneNumber(number) {
        // Philippine mobile number validation
        const cleanNumber = number.replace(/\D/g, '');

        // Check if it starts with correct prefixes
        const validPrefixes = ['09', '63'];
        const startsWithValid = validPrefixes.some(prefix => cleanNumber.startsWith(prefix));

        // Check length (11 digits for 09xx, 12 for +63xx)
        const validLength = cleanNumber.length === 11 || cleanNumber.length === 12;

        return startsWithValid && validLength;
    }

    async simulateSMSSend(recipient, message) {
        // Simulate different scenarios for demo
        const scenarios = [
            { success: true, message: 'SMS delivered successfully' },
            { success: true, message: 'SMS sent via network' },
            { success: false, message: 'Network temporarily unavailable' },
            { success: true, message: 'SMS queued for delivery' }
        ];

        // Randomly select a scenario
        const result = scenarios[Math.floor(Math.random() * scenarios.length)];

        // Add network-specific messaging
        if (result.success) {
            result.message += ` (${this.selectedNetwork.toUpperCase()})`;
        }

        return result;
    }

    showResult(message, type) {
        const resultDiv = document.getElementById('result');
        resultDiv.textContent = message;
        resultDiv.className = `result ${type}`;
        resultDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 5000);
    }

    setLoading(loading) {
        const sendBtn = document.getElementById('sendBtn');
        const sendText = document.getElementById('sendText');

        if (loading) {
            sendBtn.disabled = true;
            sendText.innerHTML = '<span class="loading"></span>Sending...';
        } else {
            sendBtn.disabled = false;
            sendText.textContent = '📤 Send SMS';
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            // Show install prompt after user interaction
            setTimeout(() => {
                if (!this.isInstalled()) {
                    document.getElementById('installPrompt').style.display = 'block';
                }
            }, 3000);
        });

        window.addEventListener('appinstalled', () => {
            document.getElementById('installPrompt').style.display = 'none';
            this.deferredPrompt = null;
        });
    }

    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                this.deferredPrompt = null;
                document.getElementById('installPrompt').style.display = 'none';
            });
        }
    }

    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FreeSMSSender();
});

// Handle PWA updates
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}