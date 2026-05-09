<script>
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useQuestionnaireStore } from '../stores/questionnaire';

export default {
    name: 'PreferenciasView',
    components: {},
    setup() {
        return {
            authStore: useAuthStore(),
            questionnaireStore: useQuestionnaireStore()
        };
    },
    data() {
        return {
            loading: true,
            saving: false,
            showingSuccess: false,
            perguntas: [],
            rounds: [[], [], [], []],
            roundIndex: 0,
            selectedIds: [],
            savingMessage: 'Salvando classificacao...',
            showModal: true,
        };
    },
    computed: {
        roundLabel() {
            const labels = ['Rodada 1 de 4', 'Rodada 2 de 4', 'Rodada 3 de 4', 'Rodada 4 de 4'];
            return labels[this.roundIndex] || '';
        },
        roundTitle() {
            if (this.roundIndex === 0) return 'Para o seu setor ser orientado a dados ele deve:';
            if (this.roundIndex === 1) return 'Dentre as que você marcou, quais são as mais importantes?';
            if (this.roundIndex === 2) return 'Para o seu setor ser orientado a dados ele deve:';
            return 'Dentre as que você marcou, quais são as menos importantes?';
        },
        roundDescription() {
            if (this.roundIndex === 0) {
                return 'Na sua visão, para você e seus colegas de trabalhos tomarem decisões na empresa considerando as três sentenças acima, quais afirmações são mais importantes para a Tutiplast implementar nos próximos meses?';
            }
            if (this.roundIndex === 1) {
                return `Agora refine: dentre as que você marcou, destaque as ${this.requiredCount.min} mais importantes.`;
            }
            if (this.roundIndex === 2) {
                return 'Na sua visão, quais práticas terão o menor impacto na Tutiplast?';
            }
            return `Por fim, dentre as que você marcou, escolha as ${this.requiredCount.min} menos relevantes.`;
        },
        availableQuestions() {
            if (this.roundIndex === 0 || this.roundIndex === 2) {
                return this.perguntas;
            }
            const source = this.rounds[this.roundIndex - 1];
            return this.perguntas.filter((p) => source.includes(p.id));
        },
        requiredCount() {
            if (this.roundIndex === 0) return { min: 2, max: 20 };
            if (this.roundIndex === 1) return { min: Math.floor(this.rounds[0].length / 2), max: Math.floor(this.rounds[0].length / 2) };
            if (this.roundIndex === 2) return { min: 2, max: 20 };
            return { min: Math.floor(this.rounds[2].length / 2), max: Math.floor(this.rounds[2].length / 2) };
        },
        canAdvance() {
            const len = this.selectedIds.length;
            const req = this.requiredCount;
            return len >= req.min && len <= req.max;
        },
        totalSelecionadas() {
            return this.selectedIds.length;
        },
        reachedMax() {
            return (this.roundIndex === 0 || this.roundIndex === 2) && this.selectedIds.length >= this.requiredCount.max;
        },
        stepRequiredDisplay() {
            if (this.roundIndex === 0 || this.roundIndex === 2) return '';
            return `${this.requiredCount.min}`;
        },
        buttonText() {
            if (this.saving) return '';
            if (this.roundIndex === 3) return 'Finalizar Pesquisa';
            return 'Continuar';
        },
        weightMap() {
            const w = {};
            for (const p of this.perguntas) w[p.id] = 3;
            if (this.roundIndex >= 1) {
                for (const id of this.rounds[0]) if (id in w) w[id] = 4;
            }
            if (this.roundIndex >= 2) {
                for (const id of this.rounds[1]) if (id in w) w[id] = 5;
            }
            if (this.roundIndex >= 3) {
                for (const id of this.rounds[2]) {
                    if (id in w) w[id] = w[id] !== 3 ? 0 : 2;
                }
            }
            if (this.roundIndex >= 4) {
                for (const id of this.rounds[3]) {
                    if (id in w) w[id] = w[id] === 0 ? 0 : 1;
                }
            }
            return w;
        },
        progresso() {
            if (this.showingSuccess) return 100;
            return Math.round(((this.roundIndex) / 4) * 100);
        },
    },
    async mounted() {
        this.authStore.checkSession();
        if (!this.authStore.isLoggedIn) {
            this.$router.push('/login-respondente');
            return;
        }
        await this.authStore.refreshStatus();
        if (this.authStore.formularioPreferenciasConcluido) {
            this.$router.push('/participante');
            return;
        }
        await this.loadQuestions();
        this.restoreProgress();
        this.loading = false;
    },
    methods: {
        progressKey() {
            return `preferencias_${this.authStore.senhaId}`;
        },
        async loadQuestions() {
            let data = [];
            try { data = await api.listPerguntasPreferencias(); } catch (e) { /* ignore */ }
            this.perguntas = (data || []).map((item, index) => ({
                id: item.id, descricao: item.pergunta || item.descricao, ordem: item.ordem || index + 1
            }));
        },
        restoreProgress() {
            const saved = localStorage.getItem(this.progressKey());
            if (!saved) return;
            try {
                const p = JSON.parse(saved);
                this.rounds = p.rounds || [[], [], [], []];
                this.roundIndex = p.roundIndex || 0;
                this.selectedIds = p.selectedIds || [];
            } catch (e) { /* ignore */ }
        },
        persistProgress() {
            localStorage.setItem(this.progressKey(), JSON.stringify({
                rounds: this.rounds, roundIndex: this.roundIndex, selectedIds: this.selectedIds,
            }));
        },
        toggleSelection(id) {
            if (this.saving || this.showingSuccess) return;
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter((item) => item !== id);
                this.persistProgress();
                return;
            }
            if (this.selectedIds.length >= this.requiredCount.max) {
                return;
            }
            this.selectedIds = [...this.selectedIds, id];
            this.persistProgress();
        },
        async advanceStep() {
            if (!this.canAdvance || this.saving) return;

            this.rounds[this.roundIndex] = [...this.selectedIds];
            this.rounds = [...this.rounds];

            if (this.roundIndex === 3) {
                await this.finalizeSurvey();
                return;
            }

            this.roundIndex += 1;
            this.selectedIds = [];
            this.showModal = true;
            this.persistProgress();
        },
        async finalizeSurvey() {
            this.saving = true;
            this.savingMessage = 'Salvando classificacao final...';
            try {
                await api.submitPreferenciasClassificacao({
                    senha_id: Number(this.authStore.senhaId),
                    setor_id: Number(this.authStore.setorId),
                    rounds: this.rounds,
                });
                this.savingMessage = 'Verificando gravacao...';
                let verified = false;
                try {
                    await this.authStore.refreshStatus();
                    verified = this.authStore.formularioPreferenciasConcluido;
                } catch (e) { /* retry */ }
                if (!verified) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    await this.authStore.refreshStatus();
                }
                this.authStore.setFormularioStatus('preferencias', true);
                localStorage.removeItem(this.progressKey());
                this.questionnaireStore.resetFormulario();
                this.$router.push(this.questionnaireStore.getProximoFormularioPendente());
            } catch (error) {
                console.error(error);
                alert(error?.message || 'Erro ao salvar preferencias.');
            } finally {
                this.saving = false;
            }
        },
        goToParticipante() {
            this.questionnaireStore.resetFormulario();
            this.$router.push(this.questionnaireStore.getProximoFormularioPendente());
        },
        closeModal() { this.showModal = false; },
        closeMaxAlert() { this.showMaxAlert = false; },
        sair() { this.authStore.logout(); this.$router.push('/'); },
        voltar() { this.$router.push('/participante'); }
    }
};
</script>

<template>
    <div class="preferencias-container">
        <header class="navbar">
            <div class="navbar-row">
                <button class="navbar-btn" @click="voltar" :disabled="saving">← Voltar</button>
                <span class="navbar-badge">Preferencias</span>
            </div>
        </header>

        <main class="preferencias-main">
            <div v-if="loading" class="loading-state">Carregando pesquisa...</div>

            <template v-else>
                <Teleport to="body">
                    <div v-if="showModal && !showingSuccess" class="modal-overlay" @click.self="closeModal">
                        <div class="modal-content">
                            <span class="modal-badge badge-ranking">{{ roundLabel }}</span>
                            <template v-if="roundIndex === 0">
                                <h3 class="modal-title">Na sua visão, quais afirmações são mais relevantes para a organização?</h3>
                                <p class="modal-description">Marque as afirmações que, na sua percepção, mais representam as prioridades da organização.</p>
                                <p class="modal-instruction">Marque as afirmações que você considera mais relevantes. Depois, refinaremos juntos.</p>
                            </template>
                            <template v-else>
                                <h3 class="modal-title">{{ roundTitle }}</h3>
                                <p class="modal-description">{{ roundDescription }}</p>
                            </template>
                            <p v-if="roundIndex !== 0" class="modal-instruction">
                                <template v-if="roundIndex === 1">Agora destaque as {{ requiredCount.min }} mais importantes dentre as que você marcou.</template>
                                <template v-else-if="roundIndex === 2">Agora o olhar muda: marque as afirmações que você considera menos prioritárias.</template>
                                <template v-else>Escolha as {{ requiredCount.min }} menos relevantes dentre as que você marcou.</template>
                            </p>
                            <button class="modal-btn" @click="closeModal">Entendi</button>
                        </div>
                    </div>
                </Teleport>

                <section v-if="!showingSuccess" class="step-card">
                    <div class="title-row">
                        <div>
                            <span class="step-phase">{{ roundLabel }}</span>
                            <template v-if="roundIndex === 0 || roundIndex === 2">
                                <h2 class="step-title">{{ roundTitle }}</h2>
                                <ol class="step-list">
                                    <li>Ter todas as informações e dados disponíveis para tomar a decisão;</li>
                                    <li>Dedicar um tempo significativo na análise de dados;</li>
                                    <li>Tomar decisões a partir de dados ao invés de intuições e palpites;</li>
                                </ol>
                            </template>
                            <h2 v-else class="step-title">{{ roundTitle }}</h2>
                        </div>
                        <button class="primary-btn" :disabled="!canAdvance || saving" @click="advanceStep">
                            <span v-if="saving" class="spinner"></span>
                            <span v-else>{{ buttonText }}</span>
                        </button>
                    </div>
                    <p class="step-description">{{ roundDescription }}</p>

                    <div class="selection-summary">
                        <span>Marcadas: <strong>{{ totalSelecionadas }}</strong><span v-if="stepRequiredDisplay"> de {{ stepRequiredDisplay }}</span></span>
                        <span v-if="reachedMax" class="max-hint">Você já marcou várias — se quiser trocar, desmarque alguma.</span>
                    </div>

                    <div class="question-grid">
                        <button
                            v-for="pergunta in availableQuestions"
                            :key="pergunta.id + '_' + roundIndex"
                            type="button"
                            :class="['question-card', saving ? 'disabled' : '', reachedMax && !selectedIds.includes(pergunta.id) ? 'dimmed' : '']"
                            @click="toggleSelection(pergunta.id)"
                            :disabled="saving"
                        >
                            <span class="card-dot" :class="{ checked: selectedIds.includes(pergunta.id) }"></span>
                            <span class="card-text">{{ pergunta.descricao }}</span>
                        </button>
                    </div>

                    <div v-if="saving" class="saving-box">{{ savingMessage }}</div>
                </section>

                <section v-else class="success-card">
                    <div class="success-icon">✓</div>
                    <h2 class="success-title">Pesquisa de Preferencias concluida</h2>
                    <p class="success-text">Sua classificação foi registrada com sucesso. Obrigado por participar!</p>
                    <button class="primary-btn" @click="goToParticipante">Voltar para Participante</button>
                </section>
            </template>
        </main>
    </div>
</template>

<style scoped>
.preferencias-container { min-height: 100vh; background: #f8f9fa; }
.navbar { background: #2c5282; color: #fff; padding: 6px 24px; }
.navbar-row { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.navbar-badge { flex-shrink: 0; padding: 2px 6px; font-size: 8px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.35); border-radius: 2px; line-height: 1.4; }
.navbar-btn { flex-shrink: 0; padding: 3px 8px; background: rgba(255,255,255,0.12); color: #fff; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; line-height: 1.3; font-family: inherit; }
.navbar-btn:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
.preferencias-main { margin: 0 auto; }
.loading-state, .step-card, .success-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; }
.step-phase { display: inline-block; margin-bottom: 6px; padding: 3px 8px; background: #eef3ff; color: #2c5282; border-radius: 999px; font-size: 11px; font-weight: 600; }
.step-title, .success-title { margin: 0; font-family: 'Georgia', serif; font-size: 18px; color: #1a1a1a; }
.step-description, .success-text { margin: 4px 0 10px; color: #555; font-size: 13px; line-height: 1.5; }
.title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
.selection-summary { font-size: 13px; color: #555; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.max-hint { font-size: 11px; color: #b8860b; background: #fffdf0; padding: 3px 8px; border-radius: 3px; }
.question-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.question-card { display: flex; align-items: flex-start; gap: 12px; min-height: 72px; padding: 12px; border: 1px solid #e4e7ec; border-radius: 8px; background: #fff; text-align: left; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
.question-card:hover:not(.disabled):not(.dimmed) { border-color: #34a853; box-shadow: 0 2px 12px rgba(52, 168, 83, 0.08); }
.question-card.disabled { opacity: 0.5; cursor: not-allowed; }
.question-card.dimmed { opacity: 0.35; cursor: not-allowed; }
.card-dot { flex-shrink: 0; width: 20px; height: 20px; margin-top: 2px; border-radius: 50%; border: 2px solid #d0d5dd; background: #fff; transition: all 0.15s ease; }
.card-dot.checked { border-color: #34a853; background: #34a853; }
.card-text { flex: 1; font-size: 13px; color: #222; line-height: 1.5; }
.primary-btn { min-width: 180px; padding: 12px 18px; background: #2c5282; color: #fff; font-size: 14px; font-weight: 600; }
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.saving-box { margin-top: 16px; padding: 12px 14px; background: #f8fbff; border: 1px solid #d9e6ff; color: #2c5282; border-radius: 4px; }
.success-card { text-align: center; }
.success-icon { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e6f4ea; color: #34a853; font-size: 28px; font-weight: 700; }
.spinner { width: 16px; height: 16px; display: inline-block; border: 2px solid rgba(255, 255, 255, 0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@media (max-width: 720px) { .preferencias-main { padding: 12px; } .question-grid { grid-template-columns: 1fr; } .actions { justify-content: stretch; } .primary-btn { width: 100%; min-width: 0; } }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
.modal-content { background: #fff; border-radius: 12px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2); }
.modal-badge { display: inline-block; margin-bottom: 16px; padding: 8px 16px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.badge-ranking { background: #eef3ff; color: #2c5282; border: 2px solid #2c5282; }
.modal-title { margin: 0 0 12px; font-family: 'Georgia', serif; font-size: 24px; color: #1a1a1a; }
.modal-description { margin: 0 0 20px; color: #555; line-height: 1.6; font-size: 15px; }
.modal-instruction { margin: 0 0 28px; padding: 14px; background: #f8fbff; border-radius: 8px; color: #2c5282; font-size: 14px; }
.modal-btn { width: 100%; max-width: 280px; padding: 14px 24px; background: #2c5282; color: #fff; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s ease; }
.modal-btn:hover { background: #1a365d; }
</style>
