
/**
 * ScholarsSearch Tracking System
 * Sistema de logging modular y no invasivo
 * Versión: 1.0.0
 */

(function(window) {
    'use strict';

    // Configuración por defecto (se puede sobrescribir)
    const DEFAULT_CONFIG = {
        enabled: true,
        apiEndpoint: '/api/tracking',
        debug: false,
        anonymousOnly: true,
        batchSize: 10,
        flushInterval: 30000, // 30 segundos
        maxRetries: 3,
        retryDelay: 2000,
        cookieName: 'ss_session_id',
        cookieExpiry: 30, // días
        excludeIPs: [],
        excludeUserAgents: ['bot', 'crawler', 'spider'],
        privacy: {
            respectDNT: true, // Respetar Do Not Track
            anonymizeIP: true,
            saltUserAgent: true
        }
    };

    class ScholarsSearchTracker {
        constructor(config = {}) {
            this.config = { ...DEFAULT_CONFIG, ...config };
            this.enabled = this.config.enabled && this.shouldTrack();
            this.eventQueue = [];
            this.sessionId = this.getOrCreateSession();
            this.retryCount = 0;

            if (this.enabled) {
                this.init();
            }

            this.log('ScholarsSearch Tracker initialized', { enabled: this.enabled });
        }

        /**
         * Inicialización del sistema de tracking
         */
        init() {
            this.startFlushTimer();
            this.attachEventListeners();

            // Trackear page view inicial
            this.trackPageView();
        }

        /**
         * Verifica si se debe activar el tracking
         */
        shouldTrack() {
            // Respetar Do Not Track
            if (this.config.privacy.respectDNT && navigator.doNotTrack === '1') {
                return false;
            }

            // Verificar User Agent excluidos
            const userAgent = navigator.userAgent.toLowerCase();
            if (this.config.excludeUserAgents.some(excluded => userAgent.includes(excluded))) {
                return false;
            }

            // Verificar si está en modo desarrollo local
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return this.config.debug;
            }

            return true;
        }

        /**
         * Obtiene o crea un ID de sesión anónimo
         */
        getOrCreateSession() {
            let sessionId = this.getCookie(this.config.cookieName);

            if (!sessionId) {
                sessionId = this.generateSessionId();
                this.setCookie(this.config.cookieName, sessionId, this.config.cookieExpiry);
            }

            return sessionId;
        }

        /**
         * Genera un ID de sesión único y anónimo
         */
        generateSessionId() {
            const timestamp = Date.now().toString(36);
            const randomPart = Math.random().toString(36).substring(2);
            return `ss_${timestamp}_${randomPart}`;
        }

        /**
         * Trackear búsqueda
         */
        trackSearch(searchData) {
            if (!this.enabled) return;

            const event = {
                type: 'search',
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
                data: {
                    search_query: searchData.query || '',
                    search_type: searchData.type || 'general',
                    search_filters: searchData.filters || {},
                    results_count: searchData.resultCount || 0,
                    page_url: window.location.href,
                    referrer: document.referrer || null
                }
            };

            this.queueEvent(event);
            this.log('Search tracked', event);
        }

        /**
         * Trackear interacción con resultados
         */
        trackResultInteraction(interactionData) {
            if (!this.enabled) return;

            const event = {
                type: 'result_interaction',
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
                data: {
                    result_id: interactionData.resultId,
                    action: interactionData.action, // 'click', 'view', 'save', etc.
                    position: interactionData.position || null,
                    search_query: interactionData.searchQuery || '',
                    page_url: window.location.href
                }
            };

            this.queueEvent(event);
            this.log('Result interaction tracked', event);
        }

        /**
         * Trackear page view
         */
        trackPageView() {
            if (!this.enabled) return;

            const event = {
                type: 'page_view',
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
                data: {
                    page_url: window.location.href,
                    page_title: document.title || '',
                    referrer: document.referrer || null,
                    user_agent: this.config.privacy.saltUserAgent ? this.hashString(navigator.userAgent) : navigator.userAgent,
                    screen_resolution: `${screen.width}x${screen.height}`,
                    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                    device_info: this.getDeviceInfo()
                }
            };

            this.queueEvent(event);
            this.log('Page view tracked', event);
        }

        /**
         * Trackear evento personalizado
         */
        trackCustomEvent(eventName, eventData = {}) {
            if (!this.enabled) return;

            const event = {
                type: 'custom_event',
                timestamp: new Date().toISOString(),
                session_id: this.sessionId,
                data: {
                    event_name: eventName,
                    event_data: eventData,
                    page_url: window.location.href
                }
            };

            this.queueEvent(event);
            this.log('Custom event tracked', { eventName, eventData });
        }

        /**
         * Añadir evento a la cola
         */
        queueEvent(event) {
            this.eventQueue.push(event);

            // Auto-flush si se alcanza el tamaño del batch
            if (this.eventQueue.length >= this.config.batchSize) {
                this.flush();
            }
        }

        /**
         * Enviar eventos en cola al servidor
         */
        async flush() {
            if (this.eventQueue.length === 0) return;

            const events = [...this.eventQueue];
            this.eventQueue = [];

            try {
                const response = await fetch(this.config.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        events: events,
                        session_id: this.sessionId
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                this.retryCount = 0;
                this.log('Events flushed successfully', { count: events.length });

            } catch (error) {
                this.log('Failed to flush events', { error: error.message, events: events.length });

                // Reintroduce eventos en la cola para retry
                this.eventQueue.unshift(...events);

                // Implementar retry con backoff exponencial
                if (this.retryCount < this.config.maxRetries) {
                    this.retryCount++;
                    const delay = this.config.retryDelay * Math.pow(2, this.retryCount - 1);

                    setTimeout(() => {
                        this.flush();
                    }, delay);
                } else {
                    this.log('Max retries reached, discarding events', { count: events.length });
                    this.retryCount = 0;
                }
            }
        }

        /**
         * Obtener información del dispositivo (anónima)
         */
        getDeviceInfo() {
            const info = {
                platform: navigator.platform || 'unknown',
                language: navigator.language || 'unknown',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
                online: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled
            };

            // Detectar tipo de dispositivo de forma básica
            const width = window.innerWidth;
            if (width <= 768) {
                info.deviceType = 'mobile';
            } else if (width <= 1024) {
                info.deviceType = 'tablet';
            } else {
                info.deviceType = 'desktop';
            }

            return info;
        }

        /**
         * Adjuntar event listeners automáticos
         */
        attachEventListeners() {
            // Trackear clics en enlaces de resultados (usando delegation)
            document.addEventListener('click', (event) => {
                const link = event.target.closest('a[data-track-result]');
                if (link) {
                    this.trackResultInteraction({
                        resultId: link.dataset.trackResult,
                        action: 'click',
                        position: link.dataset.position,
                        searchQuery: link.dataset.searchQuery
                    });
                }
            });

            // Trackear envío de formularios de búsqueda
            document.addEventListener('submit', (event) => {
                const form = event.target;
                if (form.matches('[data-track-search]')) {
                    const formData = new FormData(form);
                    const query = formData.get('q') || formData.get('query') || formData.get('search');

                    if (query) {
                        this.trackSearch({
                            query: query,
                            type: form.dataset.searchType || 'general',
                            filters: this.extractFilters(formData)
                        });
                    }
                }
            });

            // Trackear tiempo en página (page visibility)
            let pageStartTime = Date.now();

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    const timeOnPage = Date.now() - pageStartTime;
                    this.trackCustomEvent('time_on_page', { 
                        duration: timeOnPage,
                        page_url: window.location.href
                    });
                } else {
                    pageStartTime = Date.now();
                }
            });

            // Flush eventos antes de que se cierre la página
            window.addEventListener('beforeunload', () => {
                if (this.eventQueue.length > 0) {
                    navigator.sendBeacon(
                        this.config.apiEndpoint,
                        JSON.stringify({
                            events: this.eventQueue,
                            session_id: this.sessionId
                        })
                    );
                }
            });
        }

        /**
         * Extraer filtros de FormData
         */
        extractFilters(formData) {
            const filters = {};

            for (const [key, value] of formData.entries()) {
                if (key !== 'q' && key !== 'query' && key !== 'search' && value) {
                    filters[key] = value;
                }
            }

            return filters;
        }

        /**
         * Iniciar timer para flush automático
         */
        startFlushTimer() {
            setInterval(() => {
                this.flush();
            }, this.config.flushInterval);
        }

        /**
         * Utility: Hash string para anonimización
         */
        hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return hash.toString(36);
        }

        /**
         * Utilidades de cookies
         */
        setCookie(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
        }

        getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }

        /**
         * Logging interno
         */
        log(message, data = {}) {
            if (this.config.debug) {
                console.log(`[SS Tracker] ${message}`, data);
            }
        }

        /**
         * API pública para desactivar tracking
         */
        disable() {
            this.enabled = false;
            this.eventQueue = [];
            this.log('Tracking disabled');
        }

        /**
         * API pública para activar tracking
         */
        enable() {
            if (this.shouldTrack()) {
                this.enabled = true;
                this.log('Tracking enabled');
            }
        }

        /**
         * Obtener estado actual
         */
        getStatus() {
            return {
                enabled: this.enabled,
                sessionId: this.sessionId,
                queueLength: this.eventQueue.length,
                retryCount: this.retryCount
            };
        }
    }

    // Autoinstanciación si se encuentra configuración global
    let tracker = null;

    if (window.SS_TRACKING_CONFIG || window.scholarssearchConfig) {
        const config = window.SS_TRACKING_CONFIG || window.scholarssearchConfig.tracking || {};
        tracker = new ScholarsSearchTracker(config);
    }

    // Exponer API global
    window.ScholarsSearchTracker = ScholarsSearchTracker;
    window.ssTracker = tracker;

    // API simplificada para uso directo
    window.trackSearch = function(searchData) {
        if (tracker) tracker.trackSearch(searchData);
    };

    window.trackResult = function(resultData) {
        if (tracker) tracker.trackResultInteraction(resultData);
    };

    window.trackEvent = function(eventName, eventData) {
        if (tracker) tracker.trackCustomEvent(eventName, eventData);
    };

})(window);
