<script>
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useQuestionnaireStore } from '../stores/questionnaire';

export default {
    name: 'DebugView',
    setup() {
        return {
            authStore: useAuthStore(),
            questionnaireStore: useQuestionnaireStore()
        };
    },
    data() {
        return {
            debugInfo: [],
            testResult: null
        };
    },
    async mounted() {
        this.log('=== DEBUG API ===');

        this.log('1. Testando endpoints...');

        await this.testEndpoint('Health', () => api.health());
        await this.testEndpoint('Setores', () => api.listSetores());
        await this.testEndpoint('Perguntas opcoes', () => api.listPerguntasOpcoes());
        await this.testEndpoint('Perguntas preferencias', () => api.listPerguntasPreferencias());

        this.log('');
        this.log('2. Estado atual:');
        this.log('Senha ID: ' + this.authStore.senhaId);
        this.log('Setor ID: ' + this.authStore.setorId);
        this.log('Respostas: ' + JSON.stringify(this.questionnaireStore.respostas));
    },
    methods: {
        log(msg) {
            this.debugInfo.push(msg);
        },
        async testEndpoint(label, fn) {
            try {
                const data = await fn();
                const total = Array.isArray(data) ? data.length : 1;
                this.log(`OK ${label}: ${total} registro(s)`);
            } catch (e) {
                this.log(`ERRO ${label}: ${e.message}`);
            }
        },
        async testStatus() {
            if (!this.authStore.senhaId) {
                alert('Faça login primeiro');
                return;
            }

            this.log('');
            this.log('3. Testando status do respondente...');

            try {
                const data = await api.getRespondenteStatus(this.authStore.senhaId);
                this.log('OK Status: ' + JSON.stringify(data));
            } catch (error) {
                this.log('ERRO Status: ' + error.message);
            }
        }
    }
};
</script>

<template>
    <div style="background: #1a1a1a; color: #0f0; padding: 20px; font-family: monospace; font-size: 12px; min-height: 100vh;">
        <h2 style="color: #fff;">Debug - Teste de Banco</h2>

        <button
            @click="testStatus"
            style="padding: 12px 24px; background: #2c5282; color: #fff; border: none; cursor: pointer; font-size: 14px;"
        >
            Testar Status
        </button>

        <pre style="background: #000; padding: 16px; border-radius: 4px; overflow-x: auto;">
{{ debugInfo.join('\n') }}
        </pre>

        <p style="color: #666;">
            Abra o console do navegador (F12) para ver mais logs.
        </p>
    </div>
</template>
