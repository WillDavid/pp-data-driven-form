<script>
export default {
    name: 'CultureQuestionCard',
    props: {
        pergunta: { type: Object, required: true },
        resposta: { type: Object, default: () => ({}) },
        numero: { type: Number, required: true },
        total: { type: Number, required: true }
    },
    computed: {
        opcoes() {
            return this.pergunta?.opcoes || [];
        },
        somaAtual() {
            let s = 0;
            for (const key of ['A', 'B', 'C', 'D']) {
                const v = this.getValor(key);
                if (typeof v === 'number') s += v;
            }
            return s;
        },
        restantes() {
            return Math.max(0, 100 - this.somaAtual);
        },
        completo() {
            return this.somaAtual === 100;
        }
    },
    methods: {
        getValor(codigo) {
            return this.resposta?.[codigo]?.atual ?? 0;
        },
        updateValor(codigo, raw) {
            const currentValue = this.getValor(codigo);
            const otherTotal = this.somaAtual - currentValue;
            const maxAllowed = Math.max(0, 100 - otherTotal);
            const v = Math.max(0, Math.min(maxAllowed, parseInt(raw) || 0));
            const current = this.resposta ? { ...this.resposta } : {};
            if (!current[codigo]) current[codigo] = { atual: 0 };
            current[codigo] = { ...current[codigo], atual: v };
            this.$emit('update:resposta', current);
        },
        pct(codigo) {
            return (this.getValor(codigo) / 100) * 100;
        }
    }
};
</script>

<template>
    <div class="cq-card">
        <div class="cq-header">
            <span class="cq-num">Questão {{ numero }} de {{ total }}</span>
            <div class="cq-pool">
                <span class="cq-pool-label">Pontos</span>
                <span class="cq-pool-value" :class="{ ok: completo }">{{ somaAtual }}</span>
                <span class="cq-pool-sep">/</span>
                <span class="cq-pool-max">100</span>
            </div>
        </div>

        <div class="cq-question-box">
            <p class="cq-text">{{ pergunta.pergunta }}</p>
        </div>

        <div class="cq-table">
            <div v-for="opcao in opcoes" :key="opcao.codigo" class="cq-row">
                <div class="cq-row-body">
                    <label class="cq-label">{{ opcao.texto }}</label>
                    <div class="cq-controls">
                        <span class="cq-val" v-text="getValor(opcao.codigo)" />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            :value="getValor(opcao.codigo)"
                            @input="updateValor(opcao.codigo, $event.target.value)"
                            class="cq-range"
                            :style="{ '--pct': pct(opcao.codigo) + '%' }"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div v-if="!completo" class="cq-msg">
            Distribua os {{ restantes }} pontos restantes para avançar.
        </div>
    </div>
</template>

<style scoped>
.cq-card {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 32px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.cq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f0f0;
}

.cq-num {
    font-size: 13px;
    font-weight: 700;
    color: #2c5282;
    text-transform: uppercase;
    letter-spacing: 0.8px;
}

.cq-pool {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 700;
}

.cq-pool-label {
    font-size: 11px;
    font-weight: 500;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-right: 4px;
}

.cq-pool-value {
    color: #c62828;
    font-size: 20px;
}

.cq-pool-value.ok {
    color: #2e7d32;
}

.cq-pool-sep {
    color: #999;
    font-weight: 400;
}

.cq-pool-max {
    color: #333;
    font-size: 20px;
}

.cq-question-box {
    background: #f7f9fc;
    border-left: 4px solid #2c5282;
    padding: 16px 20px;
    border-radius: 0 6px 6px 0;
    margin-bottom: 16px;
}

.cq-text {
    font-size: 16px;
    color: #1a1a1a;
    line-height: 1.6;
    margin: 0;
    font-weight: 600;
}

.cq-msg {
    font-size: 12px;
    color: #c62828;
    background: #fff5f5;
    padding: 8px 14px;
    border-radius: 6px;
    margin-top: 16px;
    text-align: center;
    font-weight: 500;
}

.cq-table {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.cq-row {
    display: flex;
    align-items: stretch;
    gap: 0;
    border-bottom: 1px solid #f0f0f0;
}

.cq-row:last-child {
    border-bottom: none;
}

.cq-row-body {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    flex-wrap: wrap;
}

.cq-label {
    flex: 1;
    font-size: 13px;
    color: #333;
    line-height: 1.4;
    min-width: 200px;
}

.cq-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    width: 220px;
}

.cq-val {
    width: 36px;
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    color: #2c5282;
    flex-shrink: 0;
    padding: 4px 0;
    background: #eef3fb;
    border-radius: 4px;
}

.cq-range {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    background: linear-gradient(to right, #2c5282 var(--pct, 0%), #e8ecf1 var(--pct, 0%));
    border-radius: 3px;
    outline: none;
    cursor: pointer;
}

.cq-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #2c5282;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: transform 0.1s;
}

.cq-range::-webkit-slider-thumb:hover {
    transform: scale(1.2);
}

.cq-range::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #2c5282;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

@media (max-width: 640px) {
    .cq-card { padding: 20px 16px; }
    .cq-row-body { flex-direction: column; align-items: flex-start; gap: 8px; }
    .cq-label { min-width: 0; }
    .cq-controls { width: 100%; }
}
</style>
