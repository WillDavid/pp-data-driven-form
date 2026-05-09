<script>
export default {
    name: 'CultureRadarChart',
    props: {
        scores: { type: Array, required: true }
    },
    computed: {
        viewBox() {
            return '-120 -120 240 240';
        },
        points() {
            const order = ['colaborar', 'criar', 'competir', 'controlar'];
            const scoreMap = {};
            for (const s of this.scores) {
                scoreMap[s.perfil] = s;
            }
            return order.map((perfil, i) => {
                const s = scoreMap[perfil] || { atual: 0, futuro: 0 };
                const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
                return {
                    perfil,
                    label: s.nome || perfil,
                    atual: {
                        x: Math.cos(angle) * (s.atual || 0),
                        y: Math.sin(angle) * (s.atual || 0),
                    },
                    futuro: {
                        x: Math.cos(angle) * (s.futuro || 0),
                        y: Math.sin(angle) * (s.futuro || 0),
                    },
                    cx: Math.cos(angle) * 105,
                    cy: Math.sin(angle) * 105,
                };
            });
        },
        atualPath() {
            return this.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.atual.x} ${p.atual.y}`).join(' ') + ' Z';
        },
        futuroPath() {
            return this.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.futuro.x} ${p.futuro.y}`).join(' ') + ' Z';
        },
        gridLines() {
            const levels = [25, 50, 75, 100];
            return levels.map(level => {
                const pts = this.points.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
                    return `${Math.cos(angle) * level} ${Math.sin(angle) * level}`;
                });
                return pts.join(' ');
            });
        }
    }
};
</script>

<template>
    <div class="radar-container">
        <svg :viewBox="viewBox" class="radar-chart">
            <circle cx="0" cy="0" r="100" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
            <circle cx="0" cy="0" r="75" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
            <circle cx="0" cy="0" r="50" fill="none" stroke="#e0e0e0" stroke-width="0.5" />
            <circle cx="0" cy="0" r="25" fill="none" stroke="#e0e0e0" stroke-width="0.5" />

            <line v-for="(p, i) in points" :key="'axis-' + i"
                x1="0" y1="0" :x2="p.cx" :y2="p.cy"
                stroke="#ddd" stroke-width="0.5" />

            <polygon :points="atualPath" fill="rgba(44, 82, 130, 0.15)" stroke="#2c5282" stroke-width="1.5" />
            <polygon :points="futuroPath" fill="rgba(46, 125, 50, 0.15)" stroke="#2e7d32" stroke-width="1.5" />

            <circle v-for="(p, i) in points" :key="'dot-a-' + i"
                :cx="p.atual.x" :cy="p.atual.y" r="3" fill="#2c5282" />
            <circle v-for="(p, i) in points" :key="'dot-f-' + i"
                :cx="p.futuro.x" :cy="p.futuro.y" r="3" fill="#2e7d32" />

            <text v-for="(p, i) in points" :key="'label-' + i"
                :x="p.cx" :y="p.cy"
                text-anchor="middle" dominant-baseline="middle"
                font-size="10" font-weight="600" fill="#333">
                {{ p.label }}
            </text>
        </svg>
        <div class="radar-legend">
            <span class="legend-item"><span class="legend-color atual-color"></span> Atual</span>
            <span class="legend-item"><span class="legend-color futuro-color"></span> Desejada / Futura</span>
        </div>
    </div>
</template>

<style scoped>
.radar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
}

.radar-chart {
    width: 280px;
    height: 280px;
}

.radar-legend {
    display: flex;
    gap: 20px;
    margin-top: 12px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #555;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}

.atual-color { background: #2c5282; }
.futuro-color { background: #2e7d32; }
</style>
