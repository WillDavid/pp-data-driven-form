<script>
export default {
    name: 'CultureResultSummary',
    props: {
        scores: { type: Array, required: true },
        perfilDominanteAtual: { type: String, required: true },
        perfilDominanteFuturo: { type: String, required: true },
        maioresGaps: { type: Array, required: true }
    },
    computed: {
        interpretacoes() {
            const result = [];
            if (this.perfilDominanteAtual) {
                result.push(this.getInterpretacao(this.perfilDominanteAtual, 'atual'));
            }
            if (this.perfilDominanteFuturo) {
                result.push(this.getInterpretacao(this.perfilDominanteFuturo, 'futuro'));
            }
            for (const s of this.scores) {
                if (s.gap > 0) result.push(`${s.nome}: ha desejo de aumentar este perfil cultural (+${s.gap.toFixed(1)})`);
                if (s.gap < 0) result.push(`${s.nome}: ha desejo de reduzir a enfase neste perfil cultural (${s.gap.toFixed(1)})`);
            }
            return result;
        }
    },
    methods: {
        getInterpretacao(perfil, periodo) {
            const map = {
                colaborar: periodo === 'atual'
                    ? 'A cultura atual tende a valorizar relacoes, confianca, participacao e senso de pertencimento.'
                    : 'Ha desejo de fortalecer colaboracao, confianca e participacao.',
                criar: periodo === 'atual'
                    ? 'A cultura atual tende a valorizar inovacao, experimentacao, mudanca e visao de futuro.'
                    : 'Ha desejo de fortalecer inovacao, experimentacao e visao de futuro.',
                competir: periodo === 'atual'
                    ? 'A cultura atual tende a valorizar metas, resultados, desempenho e conquista de mercado.'
                    : 'Ha desejo de fortalecer metas, resultados e competitividade.',
                controlar: periodo === 'atual'
                    ? 'A cultura atual tende a valorizar processos, estabilidade, eficiencia e previsibilidade.'
                    : 'Ha desejo de fortalecer processos, estabilidade e eficiencia.',
            };
            return map[perfil] || '';
        }
    }
};
</script>

<template>
    <div class="result-summary">
        <div class="summary-cards">
            <div class="summary-card">
                <span class="card-label">Perfil dominante atual</span>
                <span class="card-value" :class="perfilDominanteAtual">{{ perfilDominanteAtual.charAt(0).toUpperCase() + perfilDominanteAtual.slice(1) }}</span>
            </div>
            <div class="summary-card">
                <span class="card-label">Perfil dominante desejado</span>
                <span class="card-value" :class="perfilDominanteFuturo">{{ perfilDominanteFuturo.charAt(0).toUpperCase() + perfilDominanteFuturo.slice(1) }}</span>
            </div>
        </div>

        <h4 class="table-title">Pontuacao por perfil</h4>
        <table class="scores-table">
            <thead>
                <tr>
                    <th>Perfil</th>
                    <th>Atual</th>
                    <th>Desejada / Futura</th>
                    <th>Gap</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="score in scores" :key="score.perfil">
                    <td>
                        <span class="perfil-dot" :class="score.perfil"></span>
                        {{ score.nome }}
                    </td>
                    <td>{{ score.atual.toFixed(1) }}</td>
                    <td>{{ score.futuro.toFixed(1) }}</td>
                    <td :class="{ positive: score.gap > 0, negative: score.gap < 0 }">
                        {{ score.gap > 0 ? '+' : '' }}{{ score.gap.toFixed(1) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="interpretacoes">
            <h4 class="table-title">Interpretacoes</h4>
            <div v-for="(text, i) in interpretacoes" :key="i" class="interpretacao-item">
                {{ text }}
            </div>
        </div>
    </div>
</template>

<style scoped>
.result-summary {
    margin-top: 16px;
}

.summary-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
}

.summary-card {
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 16px;
    text-align: center;
}

.card-label {
    display: block;
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    margin-bottom: 6px;
}

.card-value {
    font-size: 18px;
    font-weight: 700;
}

.card-value.colaborar { color: #d4a017; }
.card-value.criar { color: #2e7d32; }
.card-value.competir { color: #1565c0; }
.card-value.controlar { color: #c62828; }

.table-title {
    font-size: 14px;
    color: #333;
    margin: 16px 0 8px 0;
}

.scores-table {
    width: 100%;
    border-collapse: collapse;
}

.scores-table th,
.scores-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
}

.scores-table th {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    font-weight: 600;
}

.perfil-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
}

.perfil-dot.colaborar { background: #d4a017; }
.perfil-dot.criar { background: #2e7d32; }
.perfil-dot.competir { background: #1565c0; }
.perfil-dot.controlar { background: #c62828; }

.positive { color: #2e7d32; font-weight: 600; }
.negative { color: #c62828; font-weight: 600; }

.interpretacoes {
    margin-top: 16px;
}

.interpretacao-item {
    font-size: 13px;
    color: #555;
    padding: 6px 0;
    line-height: 1.5;
    border-bottom: 1px solid #f0f0f0;
}
</style>
