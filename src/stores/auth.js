import { defineStore } from 'pinia';
import { api } from '../services/api';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        isLoggedIn: false,
        senhaId: null,
        senhaCodigo: '',
        setorId: null,
        setorNome: '',
        formularioOpcoesConcluido: false,
        formularioPreferenciasConcluido: false,
        formularioCulturaConcluido: false
    }),

    actions: {
        async login(cpf) {
            const data = await api.loginRespondente(cpf);

            this.isLoggedIn = true;
            this.senhaId = data.senha_id;
            this.senhaCodigo = data.senha_codigo;
            this.setorId = data.setor_id;
            this.setorNome = data.setor_nome || '';
            this.formularioOpcoesConcluido = Boolean(data.formulario_opcoes_concluido);
            this.formularioPreferenciasConcluido = Boolean(data.formulario_preferencias_concluido);
            this.formularioCulturaConcluido = Boolean(data.formulario_cultura_concluido);

            localStorage.setItem('respondenteLogado', 'true');
            localStorage.setItem('senhaId', data.senha_id);
            localStorage.setItem('senhaCodigo', data.senha_codigo);
            localStorage.setItem('setorId', data.setor_id);
            localStorage.setItem('setorNome', this.setorNome);
            this.limparStatusFormulariosPersistidos();

            return data;
        },

        checkSession() {
            const loggedIn = localStorage.getItem('respondenteLogado');
            if (loggedIn) {
                this.isLoggedIn = true;
                this.senhaId = localStorage.getItem('senhaId');
                this.senhaCodigo = localStorage.getItem('senhaCodigo') || '';
                this.setorId = localStorage.getItem('setorId');
                this.setorNome = localStorage.getItem('setorNome') || '';
                this.formularioOpcoesConcluido = false;
                this.formularioPreferenciasConcluido = false;
                this.formularioCulturaConcluido = false;
                this.limparStatusFormulariosPersistidos();
            }
        },

        async refreshStatus() {
            if (!this.senhaId) {
                return;
            }

            let data = null;
            try {
                data = await api.getRespondenteStatus(this.senhaId);
            } catch (error) {
                return;
            }

            this.senhaCodigo = data.senha_codigo || this.senhaCodigo;
            this.setorNome = data.setor_nome || this.setorNome;
            this.setorId = data.setor_id || this.setorId;
            this.formularioOpcoesConcluido = Boolean(data.formulario_opcoes_concluido);
            this.formularioPreferenciasConcluido = Boolean(data.formulario_preferencias_concluido);
            this.formularioCulturaConcluido = Boolean(data.formulario_cultura_concluido);

            localStorage.setItem('senhaCodigo', this.senhaCodigo);
            localStorage.setItem('setorId', this.setorId);
            localStorage.setItem('setorNome', this.setorNome);
            this.limparStatusFormulariosPersistidos();
        },

        setFormularioStatus(formulario, concluido) {
            if (formulario === 'opcoes') {
                this.formularioOpcoesConcluido = concluido;
            }

            if (formulario === 'preferencias') {
                this.formularioPreferenciasConcluido = concluido;
            }

            if (formulario === 'cultura') {
                this.formularioCulturaConcluido = concluido;
            }
        },

        limparStatusFormulariosPersistidos() {
            localStorage.removeItem('formularioOpcoesConcluido');
            localStorage.removeItem('formularioPreferenciasConcluido');
            localStorage.removeItem('formularioCulturaConcluido');
        },

        logout() {
            const sid = this.senhaId;

            this.isLoggedIn = false;
            this.senhaId = null;
            this.senhaCodigo = '';
            this.setorId = null;
            this.setorNome = '';
            this.formularioOpcoesConcluido = false;
            this.formularioPreferenciasConcluido = false;
            this.formularioCulturaConcluido = false;

            localStorage.removeItem('respondenteLogado');
            localStorage.removeItem('senhaId');
            localStorage.removeItem('senhaCodigo');
            localStorage.removeItem('setorId');
            localStorage.removeItem('setorNome');
            this.limparStatusFormulariosPersistidos();
            localStorage.removeItem('progressoFormulario');

            if (sid) {
                for (const fid of ['cultura', 'opcoes', 'preferencias']) {
                    localStorage.removeItem(`progresso_${sid}_${fid}`);
                }
            }
        }
    }
});
