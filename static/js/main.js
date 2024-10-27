// Função para calcular o MRC total
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
        console.log("MRC Total atualizado:", total);
    }

    return total;
};

// Função para validar o formulário
function validateForm() {
    const form = document.getElementById('miopatiaForm');
    let isValid = true;

    // Validar campos obrigatórios
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value) {
            isValid = false;
            field.classList.add('is-invalid');
        } else {
            field.classList.remove('is-invalid');
        }
    });

    return isValid;
}

// Função para carregar pacientes
async function loadPatients() {
    try {
        console.log('Iniciando carregamento de pacientes...');
        
        const response = await fetch('/api/patients');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const patients = await response.json();
        console.log(`Pacientes carregados: ${patients.length}`);
        
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
        document.getElementById('modalMrcTotal').textContent = patient.mrc_total || '0';

        // Atualizar exames laboratoriais
        document.getElementById('modalCpk').textContent = 
            `${patient.cpkMinimo || '0'} - ${patient.cpkMaximo || '0'}`;
        document.getElementById('modalLactato').textContent = 
            `${patient.lactatoMinimo || '0'} - ${patient.lactatoMaximo || '0'}`;

        // Mostrar o modal
        const modal = new bootstrap.Modal(document.getElementById('patientDetailsModal'));
        modal.show();
    } catch (error) {
        console.error('Erro ao mostrar detalhes:', error);
        alert('Erro ao mostrar detalhes do paciente');
    }
};

// Função para exportar dados para CSV
async function exportToCSV() {
    try {
        const response = await fetch('/api/export/csv');
        if (!response.ok) {
            throw new Error('Erro ao exportar dados');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `miopatias_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        alert('Erro ao exportar dados: ' + error.message);
    }
}

// Evento principal quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('miopatiaForm');

    // Configurar MRC selects
    const mrcSelects = document.querySelectorAll('.mrc-muscle');
    mrcSelects.forEach(select => {
        select.addEventListener('change', calculateMRCTotal);
    });

    // Configurar botões
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }

    const refreshButton = document.getElementById('refreshPatientsButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadPatients);
    }

    // Configurar formulário
    if (form) {
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

                    if (!response.ok) {
                        throw new Error('Erro ao salvar os dados');
                    }

                    const result = await response.json();
                    alert(result.message);
                    form.reset();
                    calculateMRCTotal();
                    loadPatients();
                } catch (error) {
                    console.error('Erro ao salvar:', error);
                    alert('Erro ao salvar os dados: ' + error.message);
                }
            }
        });

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
    }

    // Carregar pacientes inicialmente
    loadPatients();
    calculateMRCTotal();
});
