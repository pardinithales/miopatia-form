// Definir calculateMRCTotal no escopo global
window.calculateMRCTotal = function() {
    const mrcFields = [
        'mrcDeltoideDireito', 'mrcDeltoideEsquerdo',
        'mrcBicepsDireito', 'mrcBicepsEsquerdo',
        'mrcExtensorCarpoDireito', 'mrcExtensorCarpoEsquerdo',
        'mrcIliopsoasDireito', 'mrcIliopsoasEsquerdo',
        'mrcRetoFemoralDireito', 'mrcRetoFemoralEsquerdo',
        'mrcExtensorPeDireito', 'mrcExtensorPeEsquerdo'
    ];

    let total = 0;
    mrcFields.forEach(field => {
        const select = document.querySelector(`select[name="${field}"]`);
        if (select) {
            const value = parseInt(select.value);
            if (!isNaN(value)) {
                total += value;
            }
        }
    });

    const mrcTotalSpan = document.getElementById('mrcTotal');
    if (mrcTotalSpan) {
        mrcTotalSpan.textContent = total;
        console.log("MRC Total atualizado:", total); // Debug
    }

    return total;
};

// Função para configurar seções condicionais
function setupConditionalSection(triggerName, targetId) {
    const triggers = document.querySelectorAll(`input[name="${triggerName}"]`);
    const target = document.getElementById(targetId);
    
    if (triggers && target) {
        triggers.forEach(trigger => {
            trigger.addEventListener('change', function() {
                target.style.display = this.value === "1" ? "block" : "none";
                if (this.value !== "1") {
                    const inputs = target.querySelectorAll('input, select, textarea');
                    inputs.forEach(input => {
                        if (input.type === 'checkbox' || input.type === 'radio') {
                            input.checked = false;
                        } else {
                            input.value = '';
                        }
                    });
                }
            });
        });
    }
}

// Função para formatar data
function formatDate(dateString) {
    try {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (year && month && day) {
            return `${day}/${month}/${year}`;
        }
        return dateString;
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return dateString;
    }
}

// Função para carregar e exibir pacientes
async function loadPatients() {
    try {
        console.log('Iniciando carregamento de pacientes...'); // Debug
        const response = await fetch('/api/patients');
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao buscar pacientes');
        }
        
        const patients = await response.json();
        console.log(`Pacientes carregados: ${patients.length}`); // Debug
        
        const tbody = document.querySelector('#patientsTable tbody');
        if (!tbody) {
            console.error('Elemento tbody não encontrado');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">Nenhum paciente cadastrado</td>
                </tr>
            `;
            return;
        }
        
        patients.forEach(patient => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.registroHC || ''}</td>
                <td>${patient.dataAvaliacao || ''}</td>
                <td>${patient.mrc_total || 0}/60</td>
                <td>
                    <button class="btn btn-sm btn-info" 
                            onclick="showPatientDetails('${encodeURIComponent(JSON.stringify(patient))}')">
                        Ver Detalhes
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
        const tbody = document.querySelector('#patientsTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        Erro ao carregar pacientes: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Função para mostrar detalhes do paciente
window.showPatientDetails = function(patientData) {
    try {
        const patient = JSON.parse(decodeURIComponent(patientData));
        console.log("Dados do paciente:", patient); // Debug

        // Atualizar informações básicas
        document.getElementById('modalRegistroHC').textContent = patient.registroHC || '';
        document.getElementById('modalDataAvaliacao').textContent = patient.dataAvaliacao || '';

        // Atualizar valores MRC
        const mrcFields = [
            'DeltoideDireito', 'DeltoideEsquerdo',
            'BicepsDireito', 'BicepsEsquerdo',
            'ExtensorCarpoDireito', 'ExtensorCarpoEsquerdo',
            'IliopsoasDireito', 'IliopsoasEsquerdo',
            'RetoFemoralDireito', 'RetoFemoralEsquerdo',
            'ExtensorPeDireito', 'ExtensorPeEsquerdo'
        ];

        mrcFields.forEach(field => {
            const element = document.getElementById(`modal${field}`);
            if (element) {
                element.textContent = patient[`mrc${field}`] || '0';
            }
        });

        // Atualizar MRC Total
        const modalMrcTotal = document.getElementById('modalMrcTotal');
        if (modalMrcTotal) {
            modalMrcTotal.textContent = patient.mrc_total || '0';
        }

        // Atualizar exames laboratoriais
        const modalCpk = document.getElementById('modalCpk');
        if (modalCpk) {
            modalCpk.textContent = `${patient.cpkMinimo || '0'} - ${patient.cpkMaximo || '0'}`;
        }

        const modalLactato = document.getElementById('modalLactato');
        if (modalLactato) {
            modalLactato.textContent = `${patient.lactatoMinimo || '0'} - ${patient.lactatoMaximo || '0'}`;
        }

        // Mostrar o modal
        const modal = new bootstrap.Modal(document.getElementById('patientDetailsModal'));
        modal.show();
    } catch (error) {
        console.error('Erro ao mostrar detalhes:', error);
        console.error('Dados recebidos:', patientData);
        alert('Erro ao mostrar detalhes do paciente');
    }
};

// Função para exportar dados para CSV
async function exportToCSV() {
    try {
        const response = await fetch('/api/patients');
        if (!response.ok) {
            throw new Error('Erro ao buscar dados dos pacientes');
        }
        
        const patients = await response.json();
        
        if (!patients || patients.length === 0) {
            alert('Não há dados para exportar');
            return;
        }

        // Definir cabeçalhos do CSV
        const headers = [
            'Registro HC',
            'Data Avaliação',
            'MRC Total',
            'Deltóide Direito',
            'Deltóide Esquerdo',
            'Bíceps Direito',
            'Bíceps Esquerdo',
            'Extensor Carpo Direito',
            'Extensor Carpo Esquerdo',
            'Iliopsoas Direito',
            'Iliopsoas Esquerdo',
            'Reto Femoral Direito',
            'Reto Femoral Esquerdo',
            'Extensor Pé Direito',
            'Extensor Pé Esquerdo',
            'CPK Mínimo',
            'CPK Máximo',
            'Lactato Mínimo',
            'Lactato Máximo',
            'TGO Mínimo',
            'TGO Máximo',
            'TGP Mínimo',
            'TGP Máximo'
        ];

        // Criar linhas de dados
        const csvRows = [headers];

        patients.forEach(patient => {
            const row = [
                patient.registroHC,
                patient.dataAvaliacao,
                patient.mrc_total,
                patient.mrcDeltoideDireito,
                patient.mrcDeltoideEsquerdo,
                patient.mrcBicepsDireito,
                patient.mrcBicepsEsquerdo,
                patient.mrcExtensorCarpoDireito,
                patient.mrcExtensorCarpoEsquerdo,
                patient.mrcIliopsoasDireito,
                patient.mrcIliopsoasEsquerdo,
                patient.mrcRetoFemoralDireito,
                patient.mrcRetoFemoralEsquerdo,
                patient.mrcExtensorPeDireito,
                patient.mrcExtensorPeEsquerdo,
                patient.cpkMinimo,
                patient.cpkMaximo,
                patient.lactatoMinimo,
                patient.lactatoMaximo,
                patient.tgoMinimo,
                patient.tgoMaximo,
                patient.tgpMinimo,
                patient.tgpMaximo
            ];
            csvRows.push(row);
        });

        // Converter para formato CSV
        const csvContent = csvRows
            .map(row => row.map(cell => `"${cell || ''}"`).join(','))
            .join('\n');

        // Criar e baixar o arquivo
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `miopatias_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('CSV exportado com sucesso');
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        alert('Erro ao exportar dados: ' + error.message);
    }
}

// Evento principal quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('miopatiaForm');

    // Configurar seções condicionais
    setupConditionalSection('dorPresente', 'caracteristicasDor');
    setupConditionalSection('fadigaPresente', 'caracteristicasFadiga');
    setupConditionalSection('caibrasPresente', 'caracteristicasCaibras');
    setupConditionalSection('historicoFamiliar', 'detalhesHistoricoFamiliar');

    // Adicionar eventos aos selects MRC
    const mrcSelects = document.querySelectorAll('.mrc-muscle');
    mrcSelects.forEach(select => {
        select.addEventListener('change', calculateMRCTotal);
    });

    // Validação do formulário
    function validateForm() {
        const requiredFields = ['registroHC', 'dataAvaliacao'];
        let isValid = true;

        requiredFields.forEach(field => {
            const input = form.elements[field];
            if (!input.value) {
                isValid = false;
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
                
                if (field === 'dataAvaliacao') {
                    const selectedDate = new Date(input.value);
                    const today = new Date();
                    selectedDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDate > today) {
                        isValid = false;
                        input.classList.add('is-invalid');
                        alert('A data de avaliação não pode ser futura');
                    }
                }
            }
        });

        return isValid;
    }

    // Evento de submit do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            const formData = new FormData(form);
            const data = {};
            
            formData.forEach((value, key) => {
                data[key] = value || "0";
            });

            try {
                const response = await fetch('/api/mrc', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
                    alert(result.message);
                    form.reset();
                    calculateMRCTotal();
                    loadPatients();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erro ao salvar os dados');
                }
            } catch (error) {
                console.error('Erro ao salvar:', error);
                alert('Erro ao salvar os dados: ' + error.message);
            }
        }
    });

    // Configurar botões
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            data.mrc_total = calculateMRCTotal();
            exportToCSV(data);
        });
    }

    const refreshButton = document.getElementById('refreshPatientsButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadPatients);
    }

    // Configurar botão de reset
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            form.reset();
            calculateMRCTotal();
            form.querySelectorAll('.is-invalid').forEach(element => {
                element.classList.remove('is-invalid');
            });
        });
    }

    // Restrição de data máxima
    const dataAvaliacaoInput = document.querySelector('input[name="dataAvaliacao"]');
    if (dataAvaliacaoInput) {
        const today = new Date().toISOString().split('T')[0];
        dataAvaliacaoInput.setAttribute('max', today);
    }

    // Carregar pacientes inicialmente
    loadPatients();
    calculateMRCTotal();
});

// Adicionar evento para atualizar a lista
document.addEventListener('DOMContentLoaded', function() {
    const refreshButton = document.getElementById('refreshPatientsButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadPatients);
    }
    
    // Carregar pacientes inicialmente
    loadPatients();
});
