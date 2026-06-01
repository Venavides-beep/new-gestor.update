import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationComponent } from '../shared/notification.component';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NotificationComponent],
    templateUrl: './layout.html',
    styleUrl: './layout.css'
})
export class LayoutComponent {
    isSidebarCollapsed = false;
    isMobileMenuOpen = false;
    currentUser: any = null;
    isUserMenuOpen = false;
    showNotifications = false;

    notifications = [
        { id: 1, proveedor: 'Distribuidora Peruana S.A.', monto: 1500, fechaVence: '2026-06-03', leido: false },
        { id: 2, proveedor: 'Soluciones Tecnológicas E.I.R.L.', monto: 4200, fechaVence: '2026-06-05', leido: false },
        { id: 3, proveedor: 'Servicios Logísticos S.A.C.', monto: 850, fechaVence: '2026-06-10', leido: false }
    ];

    constructor(private authService: AuthService, private router: Router) {
        this.authService.currentUser.subscribe(user => {
            this.currentUser = user;
        });
    }

    get pendingNotificationsCount(): number {
        return this.notifications.filter(n => !n.leido).length;
    }

    toggleNotifications(event: Event) {
        event.stopPropagation();
        this.showNotifications = !this.showNotifications;
    }

    markAllAsRead(event: Event) {
        event.stopPropagation();
        this.notifications.forEach(n => n.leido = true);
    }

    toggleUserMenu(event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        this.isUserMenuOpen = !this.isUserMenuOpen;
    }

    @HostListener('document:click', ['$event'])
    closeUserMenu(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-dropdown-container')) {
            this.isUserMenuOpen = false;
            this.showNotifications = false;
        }
    }

    logout(event: Event) {
        event.preventDefault();
        this.authService.logout();
    }

    hasAccess(section: string): boolean {
        if (!this.currentUser) return false;
        const role = this.currentUser.rol?.toUpperCase();
        if (role === 'SUPER_ADMIN') return true;

        const permissions = this.currentUser.permissions || {};
        if (section === 'dashboard' && permissions[section] === undefined) return true;

        return !!permissions[section];
    }

    get isSuperAdmin(): boolean {
        return this.currentUser?.rol?.toUpperCase() === 'SUPER_ADMIN';
    }

    get pageTitle(): string {
        const url = this.router.url;
        if (url.includes('/finance') || url.includes('/whmcs-history') || url.includes('/proveedores')) {
            return 'Gestión de Finanzas';
        }
        return 'Gestión de Planilla';
    }

    get userName(): string {
        if (!this.currentUser) return 'Usuario';
        return this.currentUser.fullName || this.currentUser.email.split('@')[0];
    }

    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
        } else {
            this.isSidebarCollapsed = !this.isSidebarCollapsed;
        }
    }

    closeMobileMenu() {
        if (window.innerWidth <= 768) {
            this.isMobileMenuOpen = false;
        }
    }
}