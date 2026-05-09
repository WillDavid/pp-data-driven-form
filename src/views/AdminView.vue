<script>
import { api } from '../services/api';

export default {
    name: 'AdminView',
    data() {
        return {
            dashboard: null,
            setores: [],
            loading: true,
            activeTab: 'dashboard',
            form: { nome: '', cpf: '', setor_id: '', funcao: '', matricula: '', data_contratacao: '', unidade: '', sexo: '' },
            saving: false,
            msg: '',
            modal: { show: false, setorNome: '', respondentes: [], loadingResp: false },
            respondentesTab: { setorId: '', loading: false, data: [], total: 0, page: 1, pageSize: 10, expanded: {}, busca: '' },
            pesoLegenda: [
                { peso: 0, cor: '#c62828', label: '0 — Desclassificado' },
                { peso: 1, cor: '#e65100', label: '1 — Ultima camada' },
                { peso: 2, cor: '#f57c00', label: '2 — Entrou na regra 3' },
                { peso: 3, cor: '#888', label: '3 — Padrao (nao selecionado)' },
                { peso: 4, cor: '#2c5282', label: '4 — Regra 1' },
                { peso: 5, cor: '#2e7d32', label: '5 — Regra 2' },
            ]
        };
    },
    computed: {
        totalPendentesOpcoes() {
            if (!this.dashboard) return 0;
            return this.dashboard.setores.reduce((a, s) => a + s.pendentes_opcoes, 0);
        },
        totalPendentesPreferencias() {
            if (!this.dashboard) return 0;
            return this.dashboard.setores.reduce((a, s) => a + s.pendentes_preferencias, 0);
        },
        totalPendentesCultura() {
            if (!this.dashboard) return 0;
            return this.dashboard.setores.reduce((a, s) => a + s.pendentes_cultura, 0);
        }
    },
    async mounted() {
        const isAdmin = localStorage.getItem('adminLogado');
        if (!isAdmin) {
            this.$router.push('/login-admin');
            return;
        }
        await this.loadData();
        this.loading = false;
    },
    methods: {
        async loadData() {
            try {
                const [dash, setores] = await Promise.all([
                    api.getDashboard(),
                    api.listSetores()
                ]);
                this.dashboard = dash;
                this.setores = setores.filter(s => s.id !== null);
            } catch (e) {
                console.error('Erro ao carregar dados:', e);
            }
        },
        async registerUser() {
            if (!this.form.nome || !this.form.cpf || !this.form.setor_id) {
                this.msg = 'Preencha nome, CPF e setor.';
                return;
            }
            this.saving = true;
            this.msg = '';
            try {
                await api.criarUsuario({
                    nome: this.form.nome,
                    cpf: this.form.cpf,
                    setor_id: Number(this.form.setor_id),
                    funcao: this.form.funcao || null,
                    matricula: this.form.matricula || null,
                    data_contratacao: this.form.data_contratacao || null,
                    unidade: this.form.unidade || null,
                    sexo: this.form.sexo || null
                });
                this.msg = 'Usuario cadastrado com sucesso!';
                this.form = { nome: '', cpf: '', setor_id: '', funcao: '', matricula: '', data_contratacao: '', unidade: '', sexo: '' };
                await this.loadData();
            } catch (e) {
                this.msg = e?.message || 'Erro ao cadastrar.';
            } finally {
                this.saving = false;
            }
        },
        async abrirModal(setor) {
            this.modal = { show: true, setorNome: setor.setor_nome, respondentes: [], loadingResp: true };
            try {
                this.modal.respondentes = await api.getRespondentes(setor.setor_id);
            } catch (e) {
                console.error(e);
            } finally {
                this.modal.loadingResp = false;
            }
        },
        fecharModal() {
            this.modal.show = false;
        },
        async loadRespondentes() {
            this.respondentesTab.loading = true;
            try {
                const res = await api.getAdminDetalhado(
                    this.respondentesTab.setorId || null,
                    this.respondentesTab.page,
                    this.respondentesTab.pageSize,
                    this.respondentesTab.busca
                );
                this.respondentesTab.data = res.data || [];
                this.respondentesTab.total = res.total || 0;
                this.respondentesTab.expanded = {};
            } catch (e) {
                console.error(e);
                this.respondentesTab.data = [];
            } finally {
                this.respondentesTab.loading = false;
            }
        },
        toggleExpand(idx) {
            this.respondentesTab.expanded = {
                ...this.respondentesTab.expanded,
                [idx]: !this.respondentesTab.expanded[idx]
            };
        },
        respPagina(p) {
            this.respondentesTab.page = p;
            this.loadRespondentes();
        },
        respSetorChange() {
            this.respondentesTab.page = 1;
            this.loadRespondentes();
        },
        respTotalPaginas() {
            return Math.ceil(this.respondentesTab.total / this.respondentesTab.pageSize);
        },
        async exportarXlsx() {
            try {
                const data = await api.exportTabs();
                const XLSX = await import('xlsx');
                const workbook = XLSX.utils.book_new();

                const headerStyle = {
                    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                    fill: { fgColor: { rgb: "2C5282" } },
                    alignment: { horizontal: "center", vertical: "center", wrapText: true },
                    border: {
                        top: { style: "thin", color: { rgb: "1A3A5C" } },
                        bottom: { style: "thin", color: { rgb: "1A3A5C" } },
                        left: { style: "thin", color: { rgb: "1A3A5C" } },
                        right: { style: "thin", color: { rgb: "1A3A5C" } },
                    },
                };
                const cellStyle = {
                    alignment: { vertical: "center", wrapText: true },
                    border: {
                        top: { style: "thin", color: { rgb: "D0D0D0" } },
                        bottom: { style: "thin", color: { rgb: "D0D0D0" } },
                        left: { style: "thin", color: { rgb: "D0D0D0" } },
                        right: { style: "thin", color: { rgb: "D0D0D0" } },
                    },
                };
                const dateStyle = {
                    ...cellStyle,
                    alignment: { horizontal: "center", vertical: "center" },
                    numFmt: "yyyy-mm-dd",
                };

                const formatSheet = (sheet, columns, dateCols) => {
                    const range = XLSX.utils.decode_range(sheet['!ref']);
                    const colWidths = columns.map(c => c.length + 4);

                    for (let R = range.s.r; R <= range.e.r; R++) {
                        for (let C = range.s.c; C <= range.e.c; C++) {
                            const addr = XLSX.utils.encode_cell({ r: R, c: C });
                            if (!sheet[addr]) continue;
                            if (R === 0) {
                                sheet[addr].s = headerStyle;
                            } else {
                                const colName = columns[C];
                                sheet[addr].s = dateCols.includes(colName) ? dateStyle : cellStyle;
                            }
                            const val = String(sheet[addr].v || '');
                            colWidths[C] = Math.min(50, Math.max(colWidths[C], val.length + 4));
                        }
                    }

                    sheet['!cols'] = colWidths.map(w => ({ wch: w }));
                    sheet['!autofilter'] = { ref: sheet['!ref'] };
                    sheet['!freeze'] = { xsplit: 0, ysplit: 1, topLeftCell: "A2" };
                };

                const tabs = [
                    { key: 'opcoes', name: 'Opcoes', dateCols: ['data_contratacao', 'data_resposta'] },
                    { key: 'preferencias', name: 'Preferencias', dateCols: ['data_contratacao', 'data_resposta'] },
                    { key: 'cultura', name: 'Cultura', dateCols: ['data_contratacao', 'data_resposta'] },
                ];

                for (const tab of tabs) {
                    if (data[tab.key] && data[tab.key].length > 0) {
                        const ws = XLSX.utils.json_to_sheet(data[tab.key]);
                        const columns = Object.keys(data[tab.key][0]);
                        formatSheet(ws, columns, tab.dateCols);
                        XLSX.utils.book_append_sheet(workbook, ws, tab.name);
                    }
                }

                const dataArquivo = new Date().toISOString().slice(0, 10);
                const nomeBase = `pesquisa-corporativa-${dataArquivo}`;
                XLSX.writeFile(workbook, `${nomeBase}.xlsx`);
            } catch (error) {
                console.error('Erro ao exportar:', error);
                alert(error?.message || 'Erro ao exportar.');
            }
        },

        async exportarCsv() {
            try {
                const data = await api.exportTabs();
                const XLSX = await import('xlsx');

                const tabNames = { opcoes: 'Opcoes', preferencias: 'Preferencias', cultura: 'Cultura' };
                let allRows = [];

                const flat = data.flat || data;
                for (const [key, name] of Object.entries(tabNames)) {
                    const rows = flat[key] || [];
                    for (const row of rows) {
                        allRows.push({ pesquisa: name, ...row });
                    }
                }

                const ws = XLSX.utils.json_to_sheet(allRows);
                const csv = XLSX.utils.sheet_to_csv(ws);
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const dataArquivo = new Date().toISOString().slice(0, 10);
                a.download = `pesquisa-corporativa-${dataArquivo}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Erro ao exportar CSV:', error);
                alert(error?.message || 'Erro ao exportar.');
            }
        },
        logout() {
            localStorage.removeItem('adminLogado');
            this.$router.push('/');
        }
    }
};
</script>

<template>
    <div class="admin-container">
        <div v-if="loading" class="loading-screen"><div class="spinner"></div></div>
        <div v-else>
            <header class="admin-header">
                <div class="header-left">
                    <div class="header-badge">Admin</div>
                    <h1 class="admin-title">Painel de Controle</h1>
                </div>
                <div class="header-actions">
                    <button class="export-btn" @click="exportarXlsx">Baixar Excel</button>
                    <button class="export-btn csv" @click="exportarCsv">Baixar CSV</button>
                    <button class="logout-btn" @click="logout">Sair</button>
                </div>
            </header>

            <div class="admin-content">
                <nav class="admin-tabs">
                    <button :class="['tab-btn', { active: activeTab === 'dashboard' }]" @click="activeTab = 'dashboard'">Dashboard</button>
                    <button :class="['tab-btn', { active: activeTab === 'cadastro' }]" @click="activeTab = 'cadastro'">Cadastrar Usuario</button>
                    <button :class="['tab-btn', { active: activeTab === 'respondentes' }]" @click="activeTab = 'respondentes'; if(!respondentesTab.data.length) loadRespondentes()">Respondentes</button>
                </nav>

                <div v-if="activeTab === 'dashboard' && dashboard" class="tab-content">
                    <div class="stats-row">
                        <div class="stat-card">
                            <span class="stat-value">{{ dashboard.total_usuarios }}</span>
                            <span class="stat-label">Total de Usuarios</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">{{ dashboard.total_respostas_opcoes }}</span>
                            <span class="stat-label">Responderam Opcoes</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">{{ dashboard.total_respostas_preferencias }}</span>
                            <span class="stat-label">Responderam Preferencias</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value">{{ dashboard.total_respostas_cultura }}</span>
                            <span class="stat-label">Responderam Cultura</span>
                        </div>
                        <div class="stat-card warn">
                            <span class="stat-value">{{ totalPendentesOpcoes }}</span>
                            <span class="stat-label">Pendentes Opcoes</span>
                        </div>
                        <div class="stat-card warn">
                            <span class="stat-value">{{ totalPendentesPreferencias }}</span>
                            <span class="stat-label">Pendentes Preferencias</span>
                        </div>
                        <div class="stat-card warn">
                            <span class="stat-value">{{ totalPendentesCultura }}</span>
                            <span class="stat-label">Pendentes Cultura</span>
                        </div>
                    </div>

                    <div class="setor-grid">
                        <div v-for="s in dashboard.setores" :key="s.setor_id" class="setor-card" @click="abrirModal(s)" style="cursor:pointer">
                            <h3 class="setor-nome">{{ s.setor_nome }}</h3>
                            <div class="setor-stats">
                                <div class="setor-stat">
                                    <span class="setor-stat-value">{{ s.total_usuarios }}</span>
                                    <span class="setor-stat-label">cadastrados</span>
                                </div>
                                <div class="setor-stat ok">
                                    <span class="setor-stat-value">{{ s.respostas_opcoes }}</span>
                                    <span class="setor-stat-label">resp. opcoes</span>
                                </div>
                                <div class="setor-stat ok">
                                    <span class="setor-stat-value">{{ s.respostas_preferencias }}</span>
                                    <span class="setor-stat-label">resp. preferencias</span>
                                </div>
                                <div class="setor-stat ok">
                                    <span class="setor-stat-value">{{ s.respostas_cultura }}</span>
                                    <span class="setor-stat-label">resp. cultura</span>
                                </div>
                                <div class="setor-stat pending" v-if="s.pendentes_opcoes > 0">
                                    <span class="setor-stat-value">{{ s.pendentes_opcoes }}</span>
                                    <span class="setor-stat-label">faltam opcoes</span>
                                </div>
                                <div class="setor-stat pending" v-if="s.pendentes_preferencias > 0">
                                    <span class="setor-stat-value">{{ s.pendentes_preferencias }}</span>
                                    <span class="setor-stat-label">faltam preferencias</span>
                                </div>
                                <div class="setor-stat pending" v-if="s.pendentes_cultura > 0">
                                    <span class="setor-stat-value">{{ s.pendentes_cultura }}</span>
                                    <span class="setor-stat-label">faltam cultura</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else-if="activeTab === 'respondentes'" class="tab-content">
                    <h2 class="form-title">Rastreio de Respostas</h2>

                    <div class="pref-controls">
                        <input
                            v-model="respondentesTab.busca"
                            type="text"
                            class="form-input"
                            placeholder="Buscar por nome ou CPF..."
                            @input="respSetorChange"
                        />
                        <select v-model="respondentesTab.setorId" class="form-input form-select" @change="respSetorChange">
                            <option value="">Todos os setores</option>
                            <option v-for="s in dashboard.setores" :key="s.setor_id" :value="s.setor_id">{{ s.setor_nome }}</option>
                        </select>
                        <span class="pref-total" v-if="respondentesTab.total > 0">{{ respondentesTab.total }} usuarios</span>
                    </div>

                    <div v-if="respondentesTab.loading" class="modal-loading">Carregando...</div>
                    <div v-else-if="respondentesTab.data.length === 0" class="modal-empty">
                        {{ respondentesTab.busca || respondentesTab.setorId ? 'Nenhum usuario encontrado com os filtros atuais.' : 'Nenhum usuario respondeu a pesquisa ainda.' }}
                    </div>
                    <div v-else class="resp-list">
                        <div v-for="(user, idx) in respondentesTab.data" :key="user.cpf" class="resp-card">
                            <div class="resp-card-header" @click="toggleExpand(idx)">
                                <div class="resp-user-info">
                                    <span class="resp-nome">{{ user.nome }}</span>
                                    <span class="resp-cpf mono">{{ user.cpf }}</span>
                                    <span v-if="user.funcao" class="resp-setor">{{ user.funcao }}</span>
                                    <span v-if="!respondentesTab.setorId && user.setor" class="resp-setor">{{ user.setor }}</span>
                                    <span v-if="user.unidade" class="resp-tag">Unid. {{ user.unidade }}</span>
                                    <span v-if="user.sexo" class="resp-tag">{{ user.sexo === 'M' ? 'Masc' : 'Fem' }}</span>
                                    <span v-if="user.data_contratacao" class="resp-tag">Adm. {{ user.data_contratacao }}</span>
                                </div>
                                <div class="resp-status-badges">
                                    <span :class="['resp-badge', user.formulario_opcoes_concluido ? 'ok' : 'pend']">Opcoes</span>
                                    <span :class="['resp-badge', user.formulario_preferencias_concluido ? 'ok' : 'pend']">Preferencias</span>
                                    <span :class="['resp-badge', user.formulario_cultura_concluido ? 'ok' : 'pend']">Cultura</span>
                                </div>
                                <span class="resp-arrow" :class="{ open: respondentesTab.expanded[idx] }">&#9660;</span>
                            </div>

                            <div v-if="respondentesTab.expanded[idx]" class="resp-card-body">
                                <div class="resp-section">
                                    <h4 class="resp-section-title">
                                        Opcoes
                                        <span v-if="user.formulario_opcoes_concluido_em" class="resp-date">{{ new Date(user.formulario_opcoes_concluido_em).toLocaleString('pt-BR') }}</span>
                                        <span v-else class="resp-date pend">Nao respondido</span>
                                    </h4>
                                    <table v-if="user.opcoes.length" class="resp-table">
                                        <thead><tr><th>#</th><th>Pergunta</th><th>Resposta</th></tr></thead>
                                        <tbody>
                                            <tr v-for="(o, oi) in user.opcoes" :key="o.pergunta_id">
                                                <td class="mono">{{ oi + 1 }}</td>
                                                <td>{{ o.pergunta }}</td>
                                                <td>
                                                    <span v-if="o.resposta != null" class="resp-answer">{{ o.resposta }} — {{ o.texto_resposta }}</span>
                                                    <span v-else class="resp-answer empty">—</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div v-else class="resp-empty">Nenhuma resposta.</div>
                                </div>

                                <div class="resp-section">
                                    <h4 class="resp-section-title">
                                        Preferencias
                                        <span v-if="user.formulario_preferencias_concluido_em" class="resp-date">{{ new Date(user.formulario_preferencias_concluido_em).toLocaleString('pt-BR') }}</span>
                                        <span v-else class="resp-date pend">Nao respondido</span>
                                    </h4>
                                    <div v-if="user.preferencias && user.preferencias.length" class="pesos-inline">
                                        <span v-for="p in user.preferencias" :key="p.pergunta_id"
                                            v-show="p.peso != null"
                                            class="peso-chip"
                                            :style="{ background: pesoLegenda.find(l => l.peso === p.peso)?.cor || '#888' }"
                                            :title="p.pergunta"
                                        >{{ p.peso }}</span>
                                        <span v-if="!user.preferencias.some(p => p.peso != null)" class="resp-empty">Nenhuma resposta.</span>
                                    </div>
                                    <div v-else class="resp-empty">Nenhuma resposta.</div>
                                </div>

                                <div class="resp-section">
                                    <h4 class="resp-section-title">
                                        Cultura
                                        <span v-if="user.formulario_cultura_concluido_em" class="resp-date">{{ new Date(user.formulario_cultura_concluido_em).toLocaleString('pt-BR') }}</span>
                                        <span v-else class="resp-date pend">Nao respondido</span>
                                    </h4>
                                    <div v-if="user.cultura && user.cultura.length" class="cultura-grid">
                                        <div v-for="c in user.cultura" :key="c.pergunta_id" class="cultura-row">
                                            <span class="cultura-q">{{ c.pergunta_id }}</span>
                                            <span class="cultura-bars">
                                                <span v-for="cod in ['A','B','C','D']" :key="cod" class="cultura-bar">
                                                    <span class="cultura-cod">{{ cod }}</span>
                                                    <span class="cultura-track"><span class="cultura-fill" :style="{ width: (c.resposta[cod]?.atual || 0) + '%' }"></span></span>
                                                    <span class="cultura-val">{{ c.resposta[cod]?.atual || 0 }}</span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <div v-else class="resp-empty">Nenhuma resposta.</div>
                                </div>
                            </div>
                        </div>

                        <div v-if="respTotalPaginas() > 1" class="pagination">
                            <button :disabled="respondentesTab.page <= 1" @click="respPagina(respondentesTab.page - 1)">Anterior</button>
                            <span v-for="p in respTotalPaginas()" :key="p"
                                :class="['page-num', { active: p === respondentesTab.page }]"
                                @click="respPagina(p)">{{ p }}</span>
                            <button :disabled="respondentesTab.page >= respTotalPaginas()" @click="respPagina(respondentesTab.page + 1)">Proximo</button>
                        </div>
                    </div>
                </div>

                <div v-else-if="activeTab === 'cadastro'" class="tab-content">
                    <h2 class="form-title">Cadastrar Novo Usuario</h2>
                    <form @submit.prevent="registerUser" class="user-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nome</label>
                                <input v-model="form.nome" type="text" class="form-input" required />
                            </div>
                            <div class="form-group">
                                <label>CPF</label>
                                <input v-model="form.cpf" type="text" class="form-input" placeholder="000.000.000-00" required />
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Setor</label>
                                <select v-model="form.setor_id" class="form-input form-select" required>
                                    <option value="" disabled>Selecione</option>
                                    <option v-for="s in setores" :key="s.id" :value="s.id">{{ s.nome }}</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Funcao</label>
                                <input v-model="form.funcao" type="text" class="form-input" />
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Matricula</label>
                                <input v-model="form.matricula" type="text" class="form-input" />
                            </div>
                            <div class="form-group">
                                <label>Unidade</label>
                                <input v-model="form.unidade" type="text" class="form-input" />
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Sexo</label>
                                <select v-model="form.sexo" class="form-input form-select">
                                    <option value="">Selecione</option>
                                    <option value="M">M</option>
                                    <option value="F">F</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Data de Contratacao</label>
                                <input v-model="form.data_contratacao" type="date" class="form-input" />
                            </div>
                        </div>
                        <p v-if="msg" :class="['form-msg', msg.includes('sucesso') ? 'success' : 'error']">{{ msg }}</p>
                        <button type="submit" class="primary-btn" :disabled="saving">
                            {{ saving ? 'Salvando...' : 'Cadastrar' }}
                        </button>
                    </form>
                </div>

                <Teleport to="body">
                    <div v-if="modal.show" class="modal-overlay" @click.self="fecharModal">
                        <div class="modal-box">
                            <header class="modal-header">
                                <h3>{{ modal.setorNome }}</h3>
                                <button class="modal-close" @click="fecharModal">&times;</button>
                            </header>
                            <div v-if="modal.loadingResp" class="modal-loading">Carregando...</div>
                            <div v-else-if="modal.respondentes.length === 0" class="modal-empty">Nenhum registro.</div>
                            <div v-else class="modal-table-wrap">
                                <table class="modal-table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>CPF</th>
                                            <th>Opcoes</th>
                                            <th>Data Opcoes</th>
                                            <th>Preferencias</th>
                                            <th>Data Preferencias</th>
                                            <th>Cultura</th>
                                            <th>Data Cultura</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="r in modal.respondentes" :key="r.cpf">
                                            <td>{{ r.nome }}</td>
                                            <td class="mono">{{ r.cpf }}</td>
                                            <td>
                                                <span :class="r.formulario_opcoes_concluido ? 'badge-ok' : 'badge-pend'">
                                                    {{ r.formulario_opcoes_concluido ? 'Sim' : 'Nao' }}
                                                </span>
                                            </td>
                                            <td class="mono">{{ r.formulario_opcoes_concluido_em ? new Date(r.formulario_opcoes_concluido_em).toLocaleString('pt-BR') : '-' }}</td>
                                            <td>
                                                <span :class="r.formulario_preferencias_concluido ? 'badge-ok' : 'badge-pend'">
                                                    {{ r.formulario_preferencias_concluido ? 'Sim' : 'Nao' }}
                                                </span>
                                            </td>
                                            <td class="mono">{{ r.formulario_preferencias_concluido_em ? new Date(r.formulario_preferencias_concluido_em).toLocaleString('pt-BR') : '-' }}</td>
                                            <td>
                                                <span :class="r.formulario_cultura_concluido ? 'badge-ok' : 'badge-pend'">
                                                    {{ r.formulario_cultura_concluido ? 'Sim' : 'Nao' }}
                                                </span>
                                            </td>
                                            <td class="mono">{{ r.formulario_cultura_concluido_em ? new Date(r.formulario_cultura_concluido_em).toLocaleString('pt-BR') : '-' }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </Teleport>
            </div>
        </div>
    </div>
</template>

<style scoped>
.admin-container { min-height: 100vh; background: #f8f9fa; }
.loading-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.spinner { width: 32px; height: 32px; border: 3px solid #eee; border-top: 3px solid #333; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.admin-header {
    background: #fff; padding: 16px 32px;
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid #e0e0e0;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-badge {
    font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
    color: #666; padding: 4px 8px; border: 1px solid #ccc; background: #fafafa;
}
.admin-title { font-family: 'Georgia', serif; font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0; }
.header-actions { display: flex; align-items: center; gap: 10px; }
.export-btn {
    padding: 8px 14px; background: #2c5282; border: 1px solid #2c5282;
    border-radius: 3px; font-size: 13px; font-weight: 500; color: #fff;
    cursor: pointer; font-family: inherit;
}
.export-btn.csv { background: #e65100; border-color: #e65100; }
.export-btn.excel { background: #1f6f43; border-color: #1f6f43; }
.logout-btn {
    display: flex; align-items: center; gap: 8px; padding: 8px 16px;
    background: #fff; border: 1px solid #ccc; border-radius: 3px;
    font-size: 13px; font-weight: 500; color: #555; cursor: pointer; font-family: inherit;
}
.logout-btn:hover { background: #f5f5f5; }
.admin-content { max-width: 1200px; margin: 0 auto; padding: 32px; }
.admin-tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #e0e0e0; padding-bottom: 16px; }
.tab-btn {
    padding: 10px 18px; background: #fff; border: 1px solid #ccc;
    border-radius: 3px; font-size: 13px; font-weight: 500; color: #555;
    cursor: pointer; font-family: inherit;
}
.tab-btn.active { background: #333; color: #fff; border-color: #333; }
.tab-content { background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 24px; }

/* stats */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card {
    background: #f8fbff; border: 1px solid #d9e6ff; border-radius: 6px;
    padding: 16px; text-align: center;
}
.stat-card.warn { background: #fffbe6; border-color: #ffe58f; }
.stat-value { display: block; font-size: 28px; font-weight: 700; color: #2c5282; }
.stat-card.warn .stat-value { color: #b8860b; }
.stat-label { display: block; font-size: 11px; color: #666; margin-top: 4px; }

/* setor cards */
.setor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.setor-card {
    border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px;
}
.setor-nome { margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #1a1a1a; }
.setor-stats { display: flex; flex-wrap: wrap; gap: 8px; }
.setor-stat {
    flex: 1; min-width: 100px; background: #f8fbff; border-radius: 4px;
    padding: 8px; text-align: center;
}
.setor-stat.ok { background: #e6f4ea; }
.setor-stat.pending { background: #fffbe6; }
.setor-stat-value { display: block; font-size: 18px; font-weight: 700; color: #2c5282; }
.setor-stat.ok .setor-stat-value { color: #1f6f43; }
.setor-stat.pending .setor-stat-value { color: #b8860b; }
.setor-stat-label { display: block; font-size: 10px; color: #666; margin-top: 2px; }

/* form */
.form-title { font-size: 18px; font-weight: 600; margin: 0 0 20px; color: #1a1a1a; }
.user-form { max-width: 600px; }
.form-row { display: flex; gap: 16px; margin-bottom: 16px; }
.form-row .form-group { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 12px; font-weight: 500; color: #333; }
.form-input {
    padding: 8px 12px; border: 1px solid #ccc; border-radius: 3px;
    font-size: 13px; font-family: inherit; background: #fafafa;
}
.form-input:focus { outline: none; border-color: #2c5282; background: #fff; }
.form-select { appearance: auto; cursor: pointer; }
.form-msg { font-size: 13px; margin: 0 0 12px; }
.form-msg.success { color: #1f6f43; }
.form-msg.error { color: #b00020; }
.primary-btn {
    padding: 10px 24px; background: #2c5282; color: #fff;
    border: none; border-radius: 3px; font-size: 13px; font-weight: 500;
    cursor: pointer; font-family: inherit;
}
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;
}
.modal-box {
    background: #fff; border-radius: 8px; width: 100%; max-width: 900px;
    max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 20px; border-bottom: 1px solid #e0e0e0;
}
.modal-header h3 { margin: 0; font-size: 16px; }
.modal-close {
    background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0 4px;
}
.modal-loading, .modal-empty { padding: 40px; text-align: center; color: #888; font-size: 14px; }
.modal-table-wrap { overflow-y: auto; padding: 0; }
.modal-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.modal-table th {
    position: sticky; top: 0; background: #f8f9fa; padding: 10px 12px;
    text-align: left; font-weight: 600; color: #555; border-bottom: 2px solid #e0e0e0;
}
.modal-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
.modal-table tr:hover { background: #f8fbff; }
.mono { font-family: 'Courier New', monospace; font-size: 12px; }
.badge-ok { color: #1f6f43; font-weight: 600; }
.badge-pend { color: #b8860b; font-weight: 600; }

.pref-controls { display: flex; gap: 10px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.pref-controls .form-input { min-width: 200px; }
.pref-controls .form-select { min-width: 180px; }
.legenda-box { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 16px; padding: 10px 14px; background: #fafafa; border-radius: 6px; }
.legenda-title { font-weight: 600; font-size: 12px; color: #555; margin-right: 4px; }
.legenda-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #666; }
.peso-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.peso-chip { width: 20px; height: 20px; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; cursor: default; }
.pesos-inline { display: flex; flex-wrap: wrap; gap: 3px; }
.pref-total { font-size: 13px; color: #555; font-weight: 500; }
.pagination { display: flex; gap: 6px; align-items: center; justify-content: center; margin-top: 16px; }
.pagination button, .page-num { padding: 6px 12px; border: 1px solid #ccc; border-radius: 3px; background: #fff; cursor: pointer; font-size: 12px; font-family: inherit; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.page-num.active { background: #2c5282; color: #fff; border-color: #2c5282; }

.resp-list { display: flex; flex-direction: column; gap: 12px; }
.resp-card { border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
.resp-card-header {
    display: flex; align-items: center; gap: 12px; padding: 12px 16px;
    background: #fafafa; cursor: pointer; user-select: none;
}
.resp-card-header:hover { background: #f0f4ff; }
.resp-user-info { flex: 1; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.resp-nome { font-weight: 600; font-size: 14px; color: #1a1a1a; }
.resp-cpf { font-size: 12px; color: #666; }
.resp-setor { font-size: 11px; color: #888; background: #f0f0f0; padding: 2px 8px; border-radius: 3px; }
.resp-tag { font-size: 11px; color: #2c5282; background: #e8f0fe; padding: 2px 8px; border-radius: 3px; }
.resp-status-badges { display: flex; gap: 6px; flex-shrink: 0; }
.resp-badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 3px; text-transform: uppercase; }
.resp-badge.ok { background: #e6f4ea; color: #2e7d32; }
.resp-badge.pend { background: #fff5f5; color: #c62828; }
.resp-arrow { font-size: 12px; color: #999; transition: transform 0.2s; flex-shrink: 0; }
.resp-arrow.open { transform: rotate(180deg); }
.resp-card-body { padding: 16px; border-top: 1px solid #f0f0f0; display: flex; flex-direction: column; gap: 20px; }
.resp-section { border: 1px solid #f0f0f0; border-radius: 4px; padding: 12px; }
.resp-section-title { font-size: 13px; font-weight: 600; color: #2c5282; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
.resp-date { font-size: 11px; font-weight: 400; color: #888; }
.resp-date.pend { color: #c62828; }
.resp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.resp-table th { background: #f8f9fa; padding: 6px 8px; text-align: left; font-weight: 600; color: #555; border-bottom: 1px solid #e0e0e0; }
.resp-table td { padding: 5px 8px; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
.resp-table tr:last-child td { border-bottom: none; }
.resp-answer { color: #1a1a1a; }
.resp-answer.empty { color: #bbb; font-style: italic; }
.resp-empty { font-size: 12px; color: #bbb; font-style: italic; padding: 4px 0; }
.cultura-grid { display: flex; flex-direction: column; gap: 8px; }
.cultura-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.cultura-q { font-weight: 600; color: #2c5282; width: 36px; flex-shrink: 0; }
.cultura-bars { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.cultura-bar { display: flex; align-items: center; gap: 6px; }
.cultura-cod { width: 16px; font-weight: 600; color: #555; font-size: 11px; flex-shrink: 0; }
.cultura-track { flex: 1; height: 5px; background: #e8ecf1; border-radius: 3px; overflow: hidden; }
.cultura-fill { height: 100%; background: #2c5282; border-radius: 3px; transition: width 0.2s; }
.cultura-val { width: 24px; text-align: right; font-weight: 600; color: #2c5282; font-size: 11px; flex-shrink: 0; }
</style>
