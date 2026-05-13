
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { API_URL } from '../api-config';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class LoginComponent {
    loginForm: FormGroup;
    showPassword = false;
    errorMessage: string | null = null;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService
    ) {
        if (this.authService.isLoggedIn()) {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigateByUrl(returnUrl);
        }

        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
            rememberMe: [false]
        });



        const savedEmail = localStorage.getItem('rememberedEmail');
        const savedPassword = localStorage.getItem('rememberedPassword');
        if (savedEmail && savedPassword) {
            this.loginForm.patchValue({
                email: savedEmail,
                password: savedPassword,
                rememberMe: true
            });
        }
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    onForgotPassword(): void {
        this.errorMessage = 'Por favor, contacte con el administrador del sistema para restablecer su contraseña.';
    }

    async onSubmit() {
        console.log('--- INTENTO DE LOGIN INICIADO ---');
        if (this.loginForm.valid) {
            this.errorMessage = null;
            const { email, password } = this.loginForm.value;
            console.log('Credenciales válidas en formulario. Enviando a:', `${API_URL}/api/login`);
            
            try {
                const response = await fetch(`${API_URL}/api/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                console.log('Respuesta recibida del servidor. Status:', response.status);
                const data = await response.json();
                console.log('Datos del JSON recibidos:', data);

                if (response.ok && data.success) {
                    console.log('LOGIN EXITOSO. Guardando datos...');
                    const { email, password, rememberMe } = this.loginForm.value;
                    if (rememberMe) {
                        localStorage.setItem('rememberedEmail', email);
                        localStorage.setItem('rememberedPassword', password);
                    } else {
                        localStorage.removeItem('rememberedEmail');
                        localStorage.removeItem('rememberedPassword');
                    }

                    this.authService.login(data.user);
                    console.log('Navegando al dashboard...');
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
                    this.router.navigateByUrl(returnUrl);
                } else {
                    console.warn('Login rechazado por el servidor:', data.message);
                    this.errorMessage = data.message || 'Credenciales inválidas.';
                }
            } catch (error) {
                console.error('ERROR CRÍTICO EN LA PETICIÓN FETCH:', error);
                this.errorMessage = 'No se pudo conectar con el servidor.';
            }
        } else {
            console.warn('Formulario inválido. Campos requeridos vacíos.');
            this.loginForm.markAllAsTouched();
        }
    }
}
