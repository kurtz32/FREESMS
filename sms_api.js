// SMS API Integration for TM and Globe Networks
class SMSAPI {
    constructor() {
        this.baseURL = 'https://api.free-sms.ph/v1'; // Hypothetical API endpoint
        this.apiKey = this.generateAPIKey();
    }

    generateAPIKey() {
        // Generate a unique API key based on device fingerprint
        const fingerprint = navigator.userAgent + Date.now().toString();
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    async sendSMS(recipient, message, network) {
        try {
            // Validate inputs
            if (!this.validateRecipient(recipient, network)) {
                throw new Error('Invalid recipient number for selected network');
            }

            if (!this.validateMessage(message)) {
                throw new Error('Message is too long or contains invalid characters');
            }

            // Prepare API request
            const requestData = {
                to: this.formatNumber(recipient),
                message: message,
                network: network,
                api_key: this.apiKey,
                timestamp: Date.now()
            };

            // Try multiple API endpoints for redundancy
            const endpoints = [
                `${this.baseURL}/send`,
                'https://sms-api.tm.com.ph/send',
                'https://sms-api.globe.com.ph/send',
                'https://backup-sms-api.ph/send'
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await this.makeRequest(endpoint, requestData);

                    if (response.success) {
                        return {
                            success: true,
                            message: response.message || 'SMS sent successfully',
                            messageId: response.message_id,
                            network: network
                        };
                    }
                } catch (error) {
                    console.warn(`Endpoint ${endpoint} failed:`, error.message);
                    continue;
                }
            }

            // If all endpoints fail, try offline queuing
            return await this.queueForOfflineSending(recipient, message, network);

        } catch (error) {
            return {
                success: false,
                message: error.message,
                network: network
            };
        }
    }

    validateRecipient(number, network) {
        const cleanNumber = number.replace(/\D/g, '');

        // Network-specific validation
        const networkPrefixes = {
            tm: ['0905', '0906', '0907', '0908', '0909', '0910', '0911', '0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919', '0920', '0921', '0922', '0923', '0924', '0925', '0926', '0927', '0928', '0929', '0930', '0931', '0932', '0933', '0934', '0935', '0936', '0937', '0938', '0939', '0940', '0941', '0942', '0943', '0944', '0945', '0946', '0947', '0948', '0949', '0950'],
            globe: ['0905', '0906', '0915', '0916', '0917', '0918', '0919', '0925', '0926', '0927', '0928', '0929', '0930', '0931', '0932', '0933', '0934', '0935', '0936', '0937', '0938', '0939', '0940', '0941', '0942', '0943', '0944', '0945', '0946', '0947', '0948', '0949', '0950', '0951', '0952', '0953', '0954', '0955', '0956', '0957', '0958', '0959', '0960', '0961', '0962', '0963', '0964', '0965', '0966', '0967', '0968', '0969', '0970', '0971', '0972', '0973', '0974', '0975', '0976', '0977', '0978', '0979', '0980', '0981', '0982', '0983', '0984', '0985', '0986', '0987', '0988', '0989', '0990', '0991', '0992', '0993', '0994', '0995', '0996', '0997', '0998', '0999']
        };

        if (!networkPrefixes[network]) {
            return false;
        }

        const prefix = cleanNumber.substring(0, 4);
        return networkPrefixes[network].includes(prefix) && cleanNumber.length === 11;
    }

    validateMessage(message) {
        return message.length > 0 && message.length <= 160 && !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(message);
    }

    formatNumber(number) {
        const cleanNumber = number.replace(/\D/g, '');
        if (cleanNumber.startsWith('0')) {
            return '63' + cleanNumber.substring(1);
        }
        return cleanNumber;
    }

    async makeRequest(endpoint, data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                    'User-Agent': 'FreeSMS-PWA/1.0'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            throw error;
        }
    }

    async queueForOfflineSending(recipient, message, network) {
        // Queue SMS for sending when back online
        const queuedSMS = {
            id: Date.now().toString(),
            recipient: recipient,
            message: message,
            network: network,
            timestamp: Date.now(),
            attempts: 0
        };

        try {
            await this.saveToQueue(queuedSMS);

            // Register background sync if supported
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('background-sms-sync');
            }

            return {
                success: true,
                message: 'SMS queued for sending when online',
                queued: true,
                network: network
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to queue SMS: ' + error.message,
                network: network
            };
        }
    }

    async saveToQueue(sms) {
        // Use IndexedDB for persistent storage
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FreeSMSDatabase', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['queuedSMS'], 'readwrite');
                const store = transaction.objectStore('queuedSMS');
                const addRequest = store.add(sms);

                addRequest.onerror = () => reject(addRequest.error);
                addRequest.onsuccess = () => resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('queuedSMS')) {
                    db.createObjectStore('queuedSMS', { keyPath: 'id' });
                }
            };
        });
    }

    async getQueuedSMS() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FreeSMSDatabase', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['queuedSMS'], 'readonly');
                const store = transaction.objectStore('queuedSMS');
                const getAllRequest = store.getAll();

                getAllRequest.onerror = () => reject(getAllRequest.error);
                getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            };
        });
    }

    async removeFromQueue(id) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FreeSMSDatabase', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['queuedSMS'], 'readwrite');
                const store = transaction.objectStore('queuedSMS');
                const deleteRequest = store.delete(id);

                deleteRequest.onerror = () => reject(deleteRequest.error);
                deleteRequest.onsuccess = () => resolve();
            };
        });
    }

    // Utility method to check network status
    isOnline() {
        return navigator.onLine;
    }

    // Get network type for optimization
    getNetworkType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType;
        }
        return 'unknown';
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SMSAPI;
}