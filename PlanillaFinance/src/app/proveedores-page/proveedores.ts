import { Component, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { API_URL, getAuthHeaders } from '../api-config';

@Component({
    selector: 'app-proveedores',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './proveedores.html',
    styleUrls: ['./proveedores.css'],
})
export class ProveedoresComponent implements OnInit {
    showModal: boolean = false;
    showModal2: boolean = false;
    showDominiosModal: boolean = false;
    isSearchingRuc: boolean = false;
    isSaving: boolean = false;
    loadingDominios: boolean = false;
    highlightedId: number | null = null;

    proveedoresList: any[] = [];
    datsproveedor: any = {};
    dominiosList: any[] = [];
    dominiosTotal: number = 0;
    selectedProveedorNombre: string = '';

    // Filtros del modal de dominios
    filtroDominio: string = '';
    filtroEstado: string = 'todos';
    filtroVencimiento: string = 'todos';
    ordenDias: 'asc' | 'desc' = 'asc';

    nuevoProveedor: any = {
        id: null,
        ruc: '',
        razonSocial: '',
        tipoProveedor: '',
        fechaPago: '',
        estado: 'PENDIENTE',
        url: '',
        codigoProveedor: ''
    };

    tiposProveedor = ['Servicios', 'Productos', 'Suscripciones', 'Dominios', 'Otros'];

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.cargarProveedores().then(() => {
            const highlightId = this.route.snapshot.queryParamMap.get('highlight');
            if (highlightId) {
                const id = Number(highlightId);
                this.highlightedId = id;
                // Scroll a la fila resaltada después de renderizar
                setTimeout(() => {
                    const el = document.getElementById(`prov-row-${id}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
                // Quitar el resaltado después de 2 segundos
                setTimeout(() => {
                    this.highlightedId = null;
                }, 2500);
            }
        });
    }

    async cargarProveedores() {
        try {
            const response = await fetch(`${API_URL}/api/finance/proveedores`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                this.proveedoresList = data.map((p: any) => ({
                    id: p.Id,
                    ruc: p.RUC,
                    razonSocial: p.RazonSocial,
                    tipoProveedor: p.TipoProveedor,
                    fechaPago: p.FechaPago ? p.FechaPago.split('T')[0] : '',
                    estado: p.Estado,
                    url: p.Url || '',
                    codigoProveedor: p.CodigoProveedor || ''
                }));
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
        }
    }

    generarCodigoProveedor(): string {
        let maxNumber = 0;
        const prefix = 'PROV';
        for (const p of this.proveedoresList) {
            const code = p.codigoProveedor;
            if (code && typeof code === 'string') {
                const match = code.match(/^[Pp][Rr][Oo][Vv](\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        }
        const nextNumber = maxNumber + 1;
        const paddedNumber = String(nextNumber).padStart(3, '0');
        return `${prefix}${paddedNumber}`;
    }

    abrirModal() {
        this.showModal = true;
        this.nuevoProveedor = {
            id: null,
            ruc: '',
            razonSocial: '',
            tipoProveedor: '',
            fechaPago: '',
            estado: 'PENDIENTE',
            url: '',
            codigoProveedor: this.generarCodigoProveedor()
        };
    }

    editarProveedor(data: any) {
        this.showModal = true;
        this.nuevoProveedor = {
            id: data.id,
            ruc: data.ruc,
            razonSocial: data.razonSocial,
            tipoProveedor: data.tipoProveedor,
            fechaPago: data.fechaPago,
            estado: data.estado,
            url: data.url,
            codigoProveedor: data.codigoProveedor
        };
    }

    verdatos(data: any) {
        this.showModal2 = true;
        this.datsproveedor = {
            id: data.id,
            ruc: data.ruc,
            razonSocial: data.razonSocial,
            tipoProveedor: data.tipoProveedor,
            fechaPago: data.fechaPago,
            estado: data.estado,
            url: data.url,
            codigoProveedor: data.codigoProveedor
        }
        console.log('El id a mostrar es :', data.id);
        console.log('El ruc a mostrar es : :', data.ruc);
        console.log('La razon social es :', data.razonSocial);
        console.log('El tipo de proveedor es :', data.tipoProveedor);
        console.log('La fecha de pago es :', data.fechaPago);
        console.log('El estado es :', data.estado);
        console.log('La URL es :', data.url);
        console.log('El codigo de proveedor es :', data.codigoProveedor);
    }

    cerrarModal() {
        this.showModal = false;
    }

    cerrarModal2() {
        this.showModal2 = false;
    }

    // ==================== DOMINIOS ====================
    async verDominios(proveedor: any) {
        this.showDominiosModal = true;
        this.loadingDominios = true;
        this.dominiosList = [];
        this.dominiosTotal = 0;
        this.selectedProveedorNombre = proveedor.razonSocial || proveedor.url || 'Proveedor';
        this.filtroDominio = '';
        this.filtroEstado = 'todos';
        this.filtroVencimiento = 'todos';

        try {
            const response = await fetch(`${API_URL}/api/whmcs/domains`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                let loadedDomains = data.dominios || [];
                const nombreLower = this.selectedProveedorNombre.toLowerCase();
                if (nombreLower.includes('punto')) {
                    loadedDomains = loadedDomains.filter((d: any) => 
                        d.dominio && d.dominio.toLowerCase().endsWith('.pe')
                    );
                }
                this.dominiosList = loadedDomains;
                this.dominiosTotal = loadedDomains.length;
            } else {
                console.error('Error al obtener dominios:', response.statusText);
            }
        } catch (error) {
            console.error('Error al cargar dominios:', error);
        } finally {
            this.loadingDominios = false;
        }
    }

    cerrarDominiosModal() {
        this.showDominiosModal = false;
        this.dominiosList = [];
    }

    get dominiosFiltrados(): any[] {
        let filtered = [...this.dominiosList];

        // Filtro por texto (nombre de dominio)
        if (this.filtroDominio) {
            const term = this.filtroDominio.toLowerCase();
            filtered = filtered.filter(d =>
                d.dominio?.toLowerCase().includes(term) ||
                d.clienteNombre?.toLowerCase().includes(term)
            );
        }

        // Filtro por estado
        if (this.filtroEstado !== 'todos') {
            filtered = filtered.filter(d =>
                d.estado?.toLowerCase() === this.filtroEstado.toLowerCase()
            );
        }

        // Filtro por vencimiento
        if (this.filtroVencimiento === 'mes') {
            const now = new Date();
            const mesActual = now.getMonth();
            const anioActual = now.getFullYear();
            filtered = filtered.filter(d => {
                if (!d.fechaVencimiento) return false;
                const exp = new Date(d.fechaVencimiento);
                return exp.getMonth() === mesActual && exp.getFullYear() === anioActual;
            });
        } else if (this.filtroVencimiento === 'vencidos') {
            filtered = filtered.filter(d => d.diasRestantes !== null && d.diasRestantes < 0);
        } else if (this.filtroVencimiento === 'proximos30') {
            filtered = filtered.filter(d => d.diasRestantes !== null && d.diasRestantes >= 0 && d.diasRestantes <= 30);
        }

        // Ordenar por días restantes (valor absoluto para ordenar por magnitud: 0d, luego 1d/-1d, luego -2d)
        filtered.sort((a, b) => {
            const diasA = a.diasRestantes !== null ? a.diasRestantes : 999999;
            const diasB = b.diasRestantes !== null ? b.diasRestantes : 999999;
            const absA = Math.abs(diasA);
            const absB = Math.abs(diasB);
            if (this.ordenDias === 'asc') {
                if (absA !== absB) {
                    return absA - absB;
                }
                return diasB - diasA; // Mostrar positivos (ej: 1d) antes que negativos (ej: -1d)
            } else {
                if (absA !== absB) {
                    return absB - absA;
                }
                return diasA - diasB;
            }
        });

        return filtered;
    }

    alternarOrdenDias() {
        this.ordenDias = this.ordenDias === 'asc' ? 'desc' : 'asc';
    }

    getEstadoClass(dominio: any): string {
        if (!dominio.diasRestantes && dominio.diasRestantes !== 0) return 'estado-desconocido';
        if (dominio.diasRestantes < 0) return 'estado-vencido';
        if (dominio.diasRestantes <= 7) return 'estado-critico';
        if (dominio.diasRestantes <= 30) return 'estado-pronto';
        return 'estado-activo';
    }

    getEstadoTexto(dominio: any): string {
        if (dominio.estado === 'Expired') return 'Expirado';
        if (dominio.estado === 'Active') {
            if (dominio.diasRestantes !== null && dominio.diasRestantes < 0) return 'Vencido';
            if (dominio.diasRestantes !== null && dominio.diasRestantes <= 7) return 'Crítico';
            if (dominio.diasRestantes !== null && dominio.diasRestantes <= 30) return 'Por vencer';
            return 'Activo';
        }
        if (dominio.estado === 'Pending') return 'Pendiente';
        if (dominio.estado === 'Cancelled') return 'Cancelado';
        return dominio.estado;
    }

    // Resumen rápido para el badge en la tabla de proveedores
    get contadorDominiosVencenMes(): number {
        const now = new Date();
        const mesActual = now.getMonth();
        const anioActual = now.getFullYear();
        return this.dominiosList.filter(d => {
            if (!d.fechaVencimiento) return false;
            const exp = new Date(d.fechaVencimiento);
            return exp.getMonth() === mesActual && exp.getFullYear() === anioActual;
        }).length;
    }

    // ==================== FIN DOMINIOS ====================

    async consultarRUC() {
        if (!this.nuevoProveedor.ruc || this.nuevoProveedor.ruc.length !== 11) {
            alert('Por favor ingrese un RUC válido de 11 dígitos.');
            return;
        }

        this.isSearchingRuc = true;
        try {
            const response = await fetch(`${API_URL}/api/sunat/ruc/${this.nuevoProveedor.ruc}`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                this.nuevoProveedor.razonSocial = data.nombre;
            } else {
                alert('No se pudo encontrar información para este RUC. Puedes ingresarlo manualmente.');
            }
        } catch (error) {
            console.error('Error consultando RUC:', error);
            alert('Error de conexión con el servidor. Verifica que el backend esté activo.');
        } finally {
            this.isSearchingRuc = false;
        }
    }

    async guardarProveedor() {
        this.isSaving = true;
        try {
            const isEditing = !!this.nuevoProveedor.id;
            const url = isEditing
                ? `${API_URL}/api/finance/proveedores/${this.nuevoProveedor.id}`
                : `${API_URL}/api/finance/proveedores`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(this.nuevoProveedor)
            });

            if (response.ok) {
                await this.cargarProveedores();
                this.cerrarModal();
            } else {
                const err = await response.json();
                alert(`Error al guardar: ${err.error}`);
            }
        } catch (error) {
            console.error('Error guardando en BD:', error);
            alert('Error de conexión con el servidor al intentar guardar.');
        } finally {
            this.isSaving = false;
        }
    }
}