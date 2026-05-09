<script>
import { useAuthStore } from '../stores/auth';
import { useQuestionnaireStore } from '../stores/questionnaire';
import CultureQuestionCard from '../components/culture/CultureQuestionCard.vue';

export default {
    name: 'CulturaView',
    components: { CultureQuestionCard },
    setup() {
        return { authStore: useAuthStore(), questionnaireStore: useQuestionnaireStore() };
    },
    data() { return { loading: false, errorMessage: '', enviado: false, showIntro: false }; },
    computed: {
        perguntas() {
            const form = this.questionnaireStore.formularios.find(f => f.id === 'cultura');
            return form?.perguntas || [];
        },
        perguntaAtual() {
            const form = this.questionnaireStore.formularios.find(f => f.id === 'cultura');
            return form?.perguntas?.[this.questionnaireStore.perguntaAtualIndex];
        },
        totalPerguntas() { return this.perguntas.length; },
        indiceAtual() { return this.questionnaireStore.perguntaAtualIndex; },
        isUltimaPergunta() { return this.indiceAtual >= this.totalPerguntas - 1; },
        isPrimeiraPergunta() { return this.indiceAtual === 0; },
        isQuestaoAtualValida() {
            const r = this.questionnaireStore.respostas[this.perguntaAtual?.id];
            if (!r?.resposta) return false;
            const v = r.resposta;
            return ((v.A?.atual||0)+(v.B?.atual||0)+(v.C?.atual||0)+(v.D?.atual||0)) === 100;
        },
        todasValidas() {
            if (!this.perguntas.length) return false;
            for (const p of this.perguntas) {
                const r = this.questionnaireStore.respostas[p.id];
                if (!r?.resposta) return false;
                const v = r.resposta;
                if (((v.A?.atual||0)+(v.B?.atual||0)+(v.C?.atual||0)+(v.D?.atual||0)) !== 100) return false;
            }
            return true;
        },
        respostaAtual: {
            get() { return this.questionnaireStore.respostas[this.perguntaAtual?.id]?.resposta || null; },
            set(val) { if (this.perguntaAtual) this.questionnaireStore.salvarRespostaCultura(this.perguntaAtual.id, val); }
        }
    },
    async mounted() {
        this.authStore.checkSession();
        if (!this.authStore.isLoggedIn) { this.$router.push('/login-respondente'); return; }
        if (this.authStore.formularioCulturaConcluido) { this.$router.push('/participante'); return; }
        this.loading = true;
        try {
            await this.questionnaireStore.iniciarFormulario('cultura');
            this.showIntro = true;
        } catch (e) { this.errorMessage = 'Erro ao carregar perguntas.'; }
        finally { this.loading = false; }
    },
    methods: {
        closeIntro() { this.showIntro = false; },
        anterior() { this.questionnaireStore.perguntaAnterior(); },
        proximo() { if (this.isQuestaoAtualValida) this.questionnaireStore.proximaPergunta(); },
        async finalizar() {
            if (!this.todasValidas) { this.errorMessage = 'Revise as questoes pendentes.'; return; }
            this.loading = true; this.errorMessage = '';
            try {
                await this.questionnaireStore.enviarFormularioCultura(this.authStore.senhaId, this.authStore.setorId);
                this.authStore.setFormularioStatus('cultura', true);
                this.questionnaireStore.resetFormulario();
                this.$router.push(this.questionnaireStore.getProximoFormularioPendente());
            } catch (e) { this.errorMessage = e.message || 'Erro ao enviar.'; }
            finally { this.loading = false; }
        }
    }
};
</script>

<template>
    <div class="cv-root">
        <header class="navbar">
            <div class="navbar-row">
                <button class="navbar-btn" @click="$router.push('/participante')">← Voltar</button>
                <span class="navbar-badge">Cultura</span>
            </div>
        </header>
        <main class="cv-main">
            <Teleport to="body">
                <div v-if="showIntro" class="intro-overlay" @click.self="closeIntro">
                    <div class="intro-modal">
                        <video class="intro-video" autoplay muted loop playsinline>
                            <source src="/videos/video_formulario_cultura.mp4" type="video/mp4" />
                        </video>
                        <p>Nas próximas seis perguntas, <strong>reflita como é a relação com seu chefe e colegas no seu setor</strong> atualmente.</p>
                        <p>Divida <strong>100 pontos</strong> entre as alternativas conforme cada descrição se parece com a sua empresa (100 = muito semelhante, 0 = nada semelhante). <strong>A soma deve ser sempre 100.</strong></p>
                        <button class="intro-btn" @click="closeIntro">Entendi</button>
                    </div>
                </div>
            </Teleport>
            <div v-if="loading && !perguntas.length" class="empty">Carregando...</div>
            <div v-else-if="perguntas.length" class="cv-form">
                <CultureQuestionCard v-if="perguntaAtual" :pergunta="perguntaAtual" :resposta="respostaAtual" :numero="indiceAtual+1" :total="totalPerguntas" @update:resposta="respostaAtual=$event" />
                <div v-if="errorMessage" class="cv-err">{{ errorMessage }}</div>
                <div class="cv-nav">
                    <button class="nv-btn" :disabled="isPrimeiraPergunta||loading" @click="anterior">Anterior</button>
                    <button v-if="!isUltimaPergunta" class="nv-btn nv-next" :disabled="!isQuestaoAtualValida||loading" @click="proximo">Próximo</button>
                    <button v-else class="nv-btn nv-finish" :disabled="!todasValidas||loading" @click="finalizar">Finalizar</button>
                </div>
                <div class="cv-status"><span v-if="isQuestaoAtualValida" class="ok">Questão válida</span><span v-else class="nok">Distribua 100 pontos entre as alternativas</span></div>
            </div>
            <div v-else class="empty">Nenhuma pergunta disponível.</div>
        </main>
    </div>
</template>

<style scoped>
.cv-root { min-height: 100vh; background: #f8f9fa; }
.navbar { background: #2c5282; color: #fff; padding: 6px 24px; }
.navbar-row { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.navbar-badge { flex-shrink: 0; padding: 2px 6px; font-size: 8px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.35); border-radius: 2px; }
.navbar-btn { flex-shrink: 0; padding: 3px 8px; background: rgba(255,255,255,0.12); color: #fff; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; font-family: inherit; }
.navbar-btn:hover { background: rgba(255,255,255,0.2); }
.cv-main { max-width: 800px; margin: 0 auto; padding: 16px 32px 48px; }
.empty { text-align: center; padding: 48px; color: #888; }
.cv-form { display: flex; flex-direction: column; }
.cv-err { background: #fff5f5; color: #c62828; padding: 12px 16px; border-radius: 6px; font-size: 13px; margin-bottom: 12px; }
.cv-nav { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }
.nv-btn { padding: 10px 28px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; cursor: pointer; font-family: inherit; background: #fff; color: #333; }
.nv-btn:hover:not(:disabled) { background: #f0f0f0; }
.nv-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.nv-next { background: #2c5282; color: #fff; border-color: #2c5282; }
.nv-next:hover:not(:disabled) { background: #234974; }
.nv-finish { background: #2e7d32; color: #fff; border-color: #2e7d32; }
.nv-finish:hover:not(:disabled) { background: #256d29; }
.cv-status { text-align: center; margin-top: 12px; font-size: 12px; }
.ok { color: #2e7d32; } .nok { color: #c62828; }
.intro-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0, 0, 0, 0.6); }
.intro-modal { width: 100%; max-width: 800px; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); color: #222; line-height: 1.5; }
.intro-modal p { margin: 0 0 10px; font-size: 13px; color: #444; }
.intro-video { width: 100%; border-radius: 8px; margin-bottom: 16px; }
.intro-btn { width: 100%; padding: 12px 18px; border: 0; border-radius: 6px; background: #2c5282; color: #fff; font-weight: 700; cursor: pointer; font-size: 14px; font-family: inherit; }
@media (max-width: 640px) { .cv-main { padding: 16px; } }
</style>
