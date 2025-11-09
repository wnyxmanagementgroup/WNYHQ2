// src/js/app.js
import AuthManager from './auth.js';
import Router from './router.js';
import NotificationManager from './notifications.js';
import { API_BASE_URL } from './config.js';

class WNYApp {
    constructor() {
        this.auth = new AuthManager();
        this.router = new Router();
        this.notifications = new NotificationManager();
        this.currentUser = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 Initializing WNY App...');
            
            // Initialize modules
            await this.auth.init();
            await this.router.init();
            this.notifications.init();
            
            // Check authentication
            this.currentUser = this.auth.getCurrentUser();
            
            if (this.currentUser) {
                await this.loadMainApp();
            } else {
                this.showLoginScreen();
            }
            
            this.isInitialized = true;
            console.log('✅ WNY App initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.notifications.show('เกิดข้อผิดพลาดในการเริ่มต้นแอปพลิเคชัน', 'error');
        }
    }

    async loadMainApp() {
        try {
            // Load main app structure
            await this.router.loadComponent('main-app', 'src/pages/main-app.html');
            
            // Load initial page
            const initialPage = this.getInitialPage();
            await this.router.navigate(initialPage);
            
        } catch (error) {
            console.error('Failed to load main app:', error);
        }
    }

    getInitialPage() {
        const userRole = this.currentUser?.role;
        
        if (userRole === 'admin') {
            return '/admin/dashboard';
        } else {
            return '/dashboard';
        }
    }

    showLoginScreen() {
        this.router.loadComponent('login-screen', 'src/pages/login.html')
            .then(() => {
                // Initialize login form events
                this.initializeLoginForm();
            })
            .catch(error => {
                console.error('Failed to load login screen:', error);
            });
    }

    initializeLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const result = await this.auth.login(credentials);
            
            if (result.success) {
                this.currentUser = result.user;
                await this.loadMainApp();
                this.notifications.show('เข้าสู่ระบบสำเร็จ', 'success');
            } else {
                this.notifications.show(result.message || 'เข้าสู่ระบบล้มเหลว', 'error');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.notifications.show('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
        }
    }

    async logout() {
        try {
            await this.auth.logout();
            this.currentUser = null;
            this.showLoginScreen();
            this.notifications.show('ออกจากระบบสำเร็จ', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            this.notifications.show('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
        }
    }

    // Global error handler
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.notifications.show('เกิดข้อผิดพลาดในระบบ', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.notifications.show('เกิดข้อผิดพลาดในระบบ', 'error');
        });
    }
}

// Initialize the app when DOM is ready
const app = new WNYApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for global access
window.WNYApp = app;
