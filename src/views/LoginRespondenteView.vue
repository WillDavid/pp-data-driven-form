<script>
import { useAuthStore } from '../stores/auth';

function isValidCPF(cpf) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    let sum, rest;

    sum = 0;
    for (let i = 1; i <= 9; i++) sum += parseInt(digits[i - 1]) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(digits[9])) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(digits[i - 1]) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(digits[10])) return false;

    return true;
}

function formatCPF(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    let result = digits;
    if (digits.length > 3) result = digits.slice(0, 3) + '.' + digits.slice(3);
    if (digits.length > 6) result = result.slice(0, 7) + '.' + result.slice(7);
    if (digits.length > 9) result = result.slice(0, 11) + '-' + result.slice(11);
    return result;
}

export default {
    name: 'LoginRespondenteView',
    setup() {
        return { authStore: useAuthStore() };
    },
    data() {
        return {
            cpf: '',
            loading: false,
            error: ''
        };
    },
    computed: {
        cpfValido() {
            return this.cpf.replace(/\D/g, '').length === 11 && isValidCPF(this.cpf);
        }
    },
    methods: {
        onCpfInput(e) {
            this.cpf = formatCPF(e.target.value);
            this.error = '';
        },
        async login() {
            if (!this.cpfValido) {
                this.error = 'CPF invalido. Informe um CPF valido.';
                return;
            }

            this.loading = true;
            this.error = '';

            try {
                await this.authStore.login(this.cpf);
                this.$router.push('/participante');
            } catch (e) {
                const msg = e?.message || '';
                if (msg.includes('403') || msg.includes('nao cadastrado') || msg.includes('nao encontrado')) {
                    this.error = 'CPF nao cadastrado. Apenas funcionarios da empresa podem participar.';
                } else {
                    this.error = msg || 'Erro ao acessar. Verifique os dados.';
                }
            } finally {
                this.loading = false;
            }
        },
        goBack() {
            this.$router.push('/');
        }
    }
};
</script>

<template>
    <div class="login-container">
        <div class="login-card">
            <button class="back-btn" @click="goBack">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Voltar
            </button>

            <div class="login-header">
                <h1 class="login-title">Acesso Respondente</h1>
                <p class="login-subtitle">Informe seu CPF para comecar a pesquisa</p>
            </div>

            <form @submit.prevent="login" class="login-form">
                <div class="form-group">
                    <label for="cpf">CPF</label>
                    <input
                        id="cpf"
                        :value="cpf"
                        @input="onCpfInput"
                        type="text"
                        inputmode="numeric"
                        placeholder="000.000.000-00"
                        class="form-input"
                        maxlength="14"
                        autocomplete="off"
                    />
                    <p v-if="cpf.length > 0 && !cpfValido" class="form-hint error-hint">CPF invalido</p>
                    <p v-else-if="cpfValido" class="form-hint valid-hint">CPF valido</p>
                </div>

                <p v-if="error" class="error-message">{{ error }}</p>

                <button type="submit" class="login-btn" :disabled="loading || !cpfValido">
                    {{ loading ? 'Acessando...' : 'Acessar Formularios' }}
                </button>
            </form>
        </div>
    </div>
</template>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    padding: 20px;
}

.login-card {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 40px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    width: 100%;
    max-width: 380px;
    position: relative;
}

.back-btn {
    position: absolute;
    top: 16px;
    left: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    padding: 6px;
    font-family: inherit;
}

.back-btn:hover {
    color: #333;
}

.login-header {
    text-align: center;
    margin-bottom: 32px;
}

.login-title {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px 0;
}

.login-subtitle {
    font-size: 13px;
    color: #666;
    margin: 0;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 13px;
    font-weight: 500;
    color: #333;
}

.form-input {
    padding: 10px 14px;
    border: 1px solid #ccc;
    border-radius: 3px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s;
    background: #fafafa;
}

.form-input:focus {
    outline: none;
    border-color: #2c5282;
    background: #fff;
}

.form-hint {
    font-size: 11px;
    color: #888;
    margin: 4px 0 0 0;
}

.error-hint {
    color: #b00020;
}

.valid-hint {
    color: #1f6f43;
}

.error-message {
    color: #b00020;
    font-size: 13px;
    text-align: center;
    margin: 0;
}

.login-btn {
    padding: 12px;
    background: #2c5282;
    color: #ffffff;
    border: none;
    border-radius: 3px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    font-family: inherit;
    margin-top: 8px;
}

.login-btn:hover:not(:disabled) {
    background: #1a365d;
}

.login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
