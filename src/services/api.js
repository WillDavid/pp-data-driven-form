const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
        const detail = typeof data === 'object' && data !== null ? data.detail : data;
        throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg).join(', ') : detail || 'Erro na API');
    }

    return data;
}

export const api = {
    loginRespondente(cpf) {
        return request('/auth/respondente/login', {
            method: 'POST',
            body: JSON.stringify({ cpf })
        });
    },

    getRespondenteStatus(senhaId) {
        return request(`/auth/respondente/${senhaId}/status`);
    },

    loginAdmin(email, password) {
        return request('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    listSetores() {
        return request('/setores');
    },

    createSetor(nome) {
        return request('/setores', {
            method: 'POST',
            body: JSON.stringify({ nome })
        });
    },

    updateSetor(id, nome) {
        return request(`/setores/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nome })
        });
    },

    deleteSetor(id) {
        return request(`/setores/${id}`, { method: 'DELETE' });
    },

    listSenhasBySetor(setorId) {
        return request(`/senhas/setor/${setorId}`);
    },

    generateSenhas(setorId, quantidade) {
        return request('/senhas/gerar', {
            method: 'POST',
            body: JSON.stringify({ setor_id: setorId, quantidade })
        });
    },

    deleteSenha(id) {
        return request(`/senhas/${id}`, { method: 'DELETE' });
    },

    listPerguntasOpcoes() {
        return request('/formularios/opcoes/perguntas');
    },

    listPerguntasPreferencias() {
        return request('/formularios/preferencias/perguntas');
    },

    submitOpcoes(payload) {
        return request('/formularios/opcoes/respostas', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    submitPreferenciasClassificacao(payload) {
        return request('/formularios/preferencias/classificacao', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    listPerguntasCultura() {
        return request('/formularios/cultura/perguntas');
    },

    submitCultura(payload) {
        return request('/formularios/cultura/respostas', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    getResultadoCultura(senhaId) {
        return request(`/formularios/cultura/resultado/${senhaId}`);
    },

    getCulturaRespostas(senhaId) {
        return request(`/formularios/cultura/respostas/${senhaId}`);
    },

    salvarRespostaCultura(senhaId, setorId, perguntaId, resposta) {
        return request('/formularios/cultura/respostas/salvar', {
            method: 'POST',
            body: JSON.stringify({
                senha_id: Number(senhaId),
                setor_id: Number(setorId),
                pergunta_id: perguntaId,
                resposta: resposta
            })
        });
    },

    getAdminCulturaResultados(setorId) {
        const params = setorId ? `?setor_id=${setorId}` : '';
        return request(`/admin/cultura/resultados${params}`);
    },

    getAdminDetalhado(setorId, page = 1, pageSize = 10, busca = '') {
        const params = new URLSearchParams();
        if (setorId) params.set('setor_id', setorId);
        params.set('page', page);
        params.set('page_size', pageSize);
        if (busca) params.set('busca', busca);
        return request(`/admin/respondentes/detalhado?${params}`);
    },

    getAdminPreferencias(setorId, page = 1) {
        const params = setorId ? `?setor_id=${setorId}&page=${page}&page_size=10` : `?page=${page}&page_size=10`;
        return request(`/admin/preferencias${params}`);
    },

    exportRespostas() {
        return request('/admin/export/respostas');
    },

    exportTabs() {
        return request('/admin/export/tabs');
    },

    getDashboard() {
        return request('/admin/dashboard');
    },

    getRespondentes(setorId) {
        return request(`/admin/setor/${setorId}/respondentes`);
    },

    criarUsuario(payload) {
        return request('/admin/usuarios', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    health() {
        return request('/health');
    }
};
