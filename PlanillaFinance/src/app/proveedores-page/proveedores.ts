import { Component, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    isSearchingRuc: boolean = false;
    isSaving: boolean = false;
    
    proveedoresList: any[] = [];

    nuevoProveedor: any = {
        ruc: '',
        razonSocial: '',
        tipoProveedor: '',
        fechaPago: '',
        estado: 'PENDIENTE'
    };

    tiposProveedor = ['Servicios', 'Productos', 'Suscripciones', 'Otros'];

    constructor() {}

    ngOnInit() {
        this.cargarProveedores();
    }

    async cargarProveedores() {
        try {
            const response = await fetch(`${API_URL}/api/finance/proveedores`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                this.proveedoresList = await response.json();
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
        }
    }

    abrirModal() {
        this.showModal = true;
        this.nuevoProveedor = {
            ruc: '',
            razonSocial: '',
            tipoProveedor: '',
            fechaPago: '',
            estado: 'PENDIENTE'
        };
    }

    cerrarModal() {
        this.showModal = false;
    }

    async consultarRUC() {
        if (!this.nuevoProveedor.ruc || this.nuevoProveedor.ruc.length !== 11) {
            alert('Por favor ingrese un RUC válido de 11 dígitos.');
            return;
        }

        this.isSearchingRuc = true;
        try {
            // Consulta al BACKEND propio, que hace de proxy hacia la SUNAT
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

    verMas() {
        alert('Este botón abrirá otro modal en el futuro.');
    }

    async guardarProveedor() {
        this.isSaving = true;
        try {
            const response = await fetch(`${API_URL}/api/finance/proveedores`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(this.nuevoProveedor)
            });

            if (response.ok) {
                // Volvemos a cargar la tabla para ver el nuevo registro
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