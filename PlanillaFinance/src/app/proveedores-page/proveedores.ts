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
    isSearchingRuc: boolean = false;
    isSaving: boolean = false;
    highlightedId: number | null = null;

    proveedoresList: any[] = [];
    datsproveedor: any = {};

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

    tiposProveedor = ['Servicios', 'Productos', 'Suscripciones', 'Otros'];

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
            codigoProveedor: ''
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