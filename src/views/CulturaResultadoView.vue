<script>
import { useAuthStore } from '../stores/auth';
import { api } from '../services/api';

export default {
    name: 'CulturaResultadoView',
    components: {},
    setup() { return { authStore: useAuthStore() }; },
    data() { return { resultado: null, loading: true, erro: '' }; },
    computed: {
        scores() { return this.resultado?.scores || []; },
        perfilDominanteAtual() { return this.resultado?.perfil_dominante_atual || ''; }
    },
    async mounted() {
        this.authStore.checkSession();
        if (!this.authStore.isLoggedIn) { this.$router.push('/login-respondente'); return; }
        if (!this.authStore.formularioCulturaConcluido) { this.$router.push('/cultura'); return; }
        try { this.resultado = await api.getResultadoCultura(this.authStore.senhaId); } catch (e) { this.erro = e.message || 'Erro ao carregar resultados.'; } finally { this.loading = false; }
    }
};
</script>

<template>
    <div class="res-root">
        <header class="navbar">
            <div class="navbar-row">
                <button class="navbar-btn" @click="$router.push('/participante')">← Voltar</button>
                <span class="navbar-badge">Resultado</span>
            </div>
        </header>
        <main class="res-main">
            <div v-if="loading" class="empty">Carregando resultados...</div>
            <div v-else-if="erro" class="empty">{{ erro }}</div>
            <div v-else class="res-content">
                <div class="chart-box">
                    <h3 class="sec-title">Perfil cultural atual</h3>
                    <div class="radar-wrap">
                        <svg :viewBox="'-120 -120 240 240'" class="radar">
                            <circle cx="0" cy="0" r="100" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
                            <circle cx="0" cy="0" r="75" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
                            <circle cx="0" cy="0" r="50" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
                            <circle cx="0" cy="0" r="25" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
                            <template v-for="(p, i) in points" :key="'a'+i">
                                <line x1="0" y1="0" :x2="p.cx" :y2="p.cy" stroke="#ddd" stroke-width="0.5" />
                                <text :x="p.cx" :y="p.cy" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="600" fill="#333">{{ p.label }}</text>
                            </template>
                            <polygon :points="atualPath" fill="rgba(44,82,130,0.15)" stroke="#2c5282" stroke-width="1.5" />
                            <circle v-for="(p,i) in points" :key="'d'+i" :cx="p.ax" :cy="p.ay" r="3" fill="#2c5282" />
                        </svg>
                    </div>
                    <div class="radar-legend"><span class="ldot at"></span> Atual</div>
                </div>
                <div class="scores-box">
                    <h3 class="sec-title">Pontuações</h3>
                    <table class="s-table">
                        <thead><tr><th>Perfil</th><th>Média</th></tr></thead>
                        <tbody>
                            <tr v-for="s in scores" :key="s.perfil">
                                <td><span class="sdot" :class="s.perfil"></span>{{ s.nome }}</td>
                                <td><strong :class="{ hi: s.atual === maxAtual }">{{ s.atual.toFixed(1) }}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    <p class="s-interp" v-if="perfilDominanteAtual">{{ interp }}</p>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
.res-root { min-height: 100vh; background: #f8f9fa; }
.navbar { background: #2c5282; color: #fff; padding: 6px 24px; }
.navbar-row { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.navbar-badge { flex-shrink: 0; padding: 2px 6px; font-size: 8px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.35); border-radius: 2px; }
.navbar-btn { flex-shrink: 0; padding: 3px 8px; background: rgba(255,255,255,0.12); color: #fff; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; font-family: inherit; }
.navbar-btn:hover { background: rgba(255,255,255,0.2); }
.res-main { max-width: 800px; margin: 0 auto; padding: 24px 32px 48px; }
.empty { text-align: center; padding: 48px; color: #888; }
.sec-title { font-size: 16px; font-weight: 600; color: #333; margin: 0 0 8px 0; }
.chart-box { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.radar-wrap { display: flex; justify-content: center; }
.radar { width: 260px; height: 260px; }
.radar-legend { display: flex; justify-content: center; gap: 16px; margin-top: 8px; font-size: 12px; color: #555; align-items: center; }
.ldot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.ldot.at { background: #2c5282; }
.scores-box { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; }
.s-table { width: 100%; border-collapse: collapse; }
.s-table th, .s-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.s-table th { font-size: 11px; color: #888; text-transform: uppercase; }
.sdot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.sdot.colaborar { background: #d4a017; } .sdot.criar { background: #2e7d32; }
.sdot.competir { background: #1565c0; } .sdot.controlar { background: #c62828; }
.hi { color: #2c5282; }
.s-interp { margin-top: 12px; font-size: 13px; color: #555; line-height: 1.5; }
@media (max-width: 640px) { .res-main { padding: 16px; } }
</style>
