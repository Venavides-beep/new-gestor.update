import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationComponent } from '../shared/notification.component';
import { API_URL, getAuthHeaders } from '../api-config';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NotificationComponent],
    templateUrl: './layout.html',
    styleUrl: './layout.css'
})
export class LayoutComponent implements OnInit {
    isSidebarCollapsed = false;
    isMobileMenuOpen = false;
    currentUser: any = null;
    isUserMenuOpen = false;
    showNotifications = false;

    notifications: any[] = [];

    constructor(private authService: AuthService, private router: Router) {
        this.authService.currentUser.subscribe(user => {
            this.currentUser = user;
        });
    }

    ngOnInit() {
        this.cargarNotificaciones();
    }

    async cargarNotificaciones() {
        try {
            const response = await fetch(`${API_URL}/api/finance/proveedores`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const providerNotifs = data
                    .filter((p: any) => {
                        if (!p.FechaPago || p.Estado !== 'PENDIENTE') return false;
                        const pDate = new Date(p.FechaPago);
                        const utcDate = new Date(pDate.getTime() + pDate.getTimezoneOffset() * 60000);
                        utcDate.setHours(0, 0, 0, 0);
                        return utcDate < today;
                    })
                    .map((p: any, idx: number) => {
                        const pDate = new Date(p.FechaPago);
                        const utcDate = new Date(pDate.getTime() + pDate.getTimezoneOffset() * 60000);
                        const dateStr = utcDate.toISOString().split('T')[0];
                        return {
                            id: p.Id || idx,
                            type: 'proveedor',
                            proveedor: p.RazonSocial || 'Proveedor sin nombre',
                            monto: 0,
                            montoText: 'No Pagado',
                            fechaVence: dateStr,
                            leido: false
                        };
                    });

                let domainNotifs: any[] = [];
                const puntoPeProvider = data.find((p: any) =>
                    p.RazonSocial?.toLowerCase().includes('punto') ||
                    p.TipoProveedor === 'Dominios' ||
                    (p.Url && p.Url.toLowerCase().includes('punto.pe'))
                );

                if (puntoPeProvider) {
                    try {
                        const domResponse = await fetch(`${API_URL}/api/whmcs/domains`, {
                            headers: getAuthHeaders()
                        });
                        if (domResponse.ok) {
                            const domData = await domResponse.json();
                            const allDomains = domData.dominios || [];
                            domainNotifs = allDomains
                                .filter((d: any) => {
                                    if (!d.dominio || !d.dominio.toLowerCase().endsWith('.pe')) return false;
                                    return d.diasRestantes !== null && d.diasRestantes <= 7 && d.diasRestantes >= -15 && (d.estado === 'Active' || d.estado === 'Expired');
                                })
                                .map((d: any) => {
                                    return {
                                        id: puntoPeProvider.Id,
                                        type: 'dominio',
                                        domain: d.dominio,
                                        proveedor: `Dom: ${d.dominio}`,
                                        monto: d.montoRecurrente || 0,
                                        montoText: d.diasRestantes === 0
                                            ? 'Vence hoy'
                                            : (d.diasRestantes < 0 ? `Venció hace ${Math.abs(d.diasRestantes)}d` : `Vence en ${d.diasRestantes}d`),
                                        fechaVence: d.fechaVencimiento,
                                        leido: false
                                    };
                                });
                        }
                    } catch (domErr) {
                        console.error('Error al obtener notificaciones de dominios:', domErr);
                    }
                }

                this.notifications = [...providerNotifs, ...domainNotifs];
            }
        } catch (error) {
            console.error('Error al cargar notificaciones de proveedores:', error);
        }
    }

    get pendingNotificationsCount(): number {
        return this.notifications.filter(n => !n.leido).length;
    }

    toggleNotifications(event: Event) {
        event.stopPropagation();
        this.showNotifications = !this.showNotifications;
    }

    irAProveedor(notif: any, event: Event) {
        event.stopPropagation();
        this.isUserMenuOpen = false;
        this.showNotifications = false;
        if (notif.type === 'dominio') {
            this.router.navigate(['/proveedores'], { queryParams: { highlight: notif.id, domain: notif.domain } });
        } else {
            this.router.navigate(['/proveedores'], { queryParams: { highlight: notif.id } });
        }
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
        if (!this.isUserMenuOpen) {
            this.showNotifications = false;
        }
    }

    @HostListener('document:click', ['$event'])
    closeUserMenu(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-dropdown-container')) {
            if (this.isUserMenuOpen) {
                this.isUserMenuOpen = false;
                this.showNotifications = false;
            }
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