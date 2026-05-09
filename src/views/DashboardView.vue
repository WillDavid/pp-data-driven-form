<script>
import { useAuthStore } from '../stores/auth';
import { useQuestionnaireStore } from '../stores/questionnaire';
import FormCard from '../components/common/FormCard.vue';

export default {
    name: 'ParticipanteView',
    components: { FormCard },
    setup() { return { authStore: useAuthStore(), questionnaireStore: useQuestionnaireStore() }; },
    data() { return { loadingStatus: true }; },
    computed: { formularios() { return this.questionnaireStore.getFormularios; } },
    async mounted() {
        this.authStore.checkSession();
        if (!this.authStore.isLoggedIn) { this.$router.push('/login-respondente'); return; }
        try {
            await this.authStore.refreshStatus();
            await this.questionnaireStore.carregarStatusFormularios(this.authStore.senhaId);
        } finally {
            this.loadingStatus = false;
        }
    },
    methods: {
        async iniciarFormulario(form) {
            if (form.emBreve) return;
            if (form.concluido) return;
            await this.questionnaireStore.iniciarFormulario(form.id);
            if (form.id === 'cultura') this.$router.push('/cultura');
            else if (form.id === 'preferencias') this.$router.push('/preferencias');
            else this.$router.push('/formulario');
        },
        logout() { this.authStore.logout(); this.$router.push('/'); },
        getProgresso(form) { return form.progressoRespondente || 0; }
    }
};
</script>

<template>
    <div class="dash-root">
        <header class="dash-bar">
            <img class="usp-logo" src="https://posproducao.eesc.usp.br/wp-content/uploads/2021/03/logo-escrito-po%CC%81s-eng-produc%CC%A7a%CC%83o_02.03.2021-scaled.jpg" alt="USP EESC Pós-Graduação em Engenharia de Produção" />
            <span class="dash-logo">Ferramenta de avaliação da cultura organizacional</span>
            <button class="dash-out" @click="logout">Sair</button>
        </header>
        <main class="dash-body">
            <section class="dash-intro">
                <p>Você está convidado(a) a participar da pesquisa “UMA PROPOSTA DE MODELO DE EMPRESA PARA CULTURA ORIENTADA A DADOS”, parte do projeto de mestrado de Phellipe Dinardi no programa de Pós-Graduação em Engenharia de Produção da USP. O estudo visa elaborar uma modelagem para induzir a cultura da Tutiplast para se tornar orientada a dados, impactando positivamente na vantagem competitiva, na inovação e na transformação digital. O projeto cumpre todas as exigências éticas legais e conta com a aprovação do Comitê de Ética em Pesquisa (CEP/Conep)</p>
                <p>A sua participação é totalmente voluntária, gratuita e anônima, podendo ser interrompida a qualquer momento sem justificativa ou prejuízos, com a garantia de exclusão dos dados coletados caso solicitado. Embora o preenchimento do questionário possa causar um leve cansaço, todas as informações serão tratadas com absoluto sigilo e confidencialidade pelos pesquisadores. Ao ler o termo e concordar em participar, você declara estar ciente dessas condições, mantendo o direito de entrar em contato com os responsáveis para esclarecer dúvidas a qualquer momento.</p>
                <p><strong>Pesquisador responsável:</strong></p>
                <p>EESC/USP - Av. Trab. São Carlense, 400. São Carlos (SP). CEP 13566-590<br>Telefone: (92) 98116-2381<br>e-mail: dinardi@usp.br ou guerrini@sc.usp.br</p>
            </section>
            <div v-if="loadingStatus" class="dash-loading">Carregando seus formulários...</div>
            <div v-else class="dash-grid">
                <FormCard v-for="f in formularios" :key="f.id" :titulo="f.titulo" :descricao="f.descricao" :concluido="f.concluido" :emBreve="f.emBreve" :progresso="getProgresso(f)" @click="iniciarFormulario(f)" />
            </div>
        </main>
    </div>
</template>

<style scoped>
.dash-root { min-height: 100vh; background: #f8f9fa; }
.dash-bar { background: #2c5282; padding: 6px 24px; display: flex; justify-content: space-between; align-items: center; position: relative; }
.usp-logo { height: 34px; max-width: 260px; object-fit: contain; background: #fff; padding: 3px 6px; border-radius: 3px; }
.dash-logo { color: #fff; font-family: Georgia, serif; font-size: 17px; font-weight: 600; position: absolute; left: 50%; transform: translateX(-50%); white-space: nowrap; }
.dash-out { padding: 4px 12px; background: rgba(255,255,255,0.12); color: #fff; border: none; border-radius: 3px; font-size: 11px; cursor: pointer; font-family: inherit; }
.dash-out:hover { background: rgba(255,255,255,0.2); }
.dash-body { max-width: 960px; margin: 0 auto; padding: 24px 32px; }
.dash-intro { background: #fff; border: 1px solid #e0e0e0; border-left: 4px solid #2c5282; border-radius: 6px; padding: 18px 22px; margin-bottom: 20px; color: #333; font-size: 14px; line-height: 1.65; }
.dash-intro p { margin: 0 0 12px; }
.dash-intro p:last-child { margin-bottom: 0; }
.dash-loading { text-align: center; padding: 32px; color: #666; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; }
.dash-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 750px) { .dash-bar { align-items: flex-start; flex-wrap: wrap; } .usp-logo { order: 3; width: 100%; max-width: 100%; } .dash-grid { grid-template-columns: 1fr; } }
</style>
