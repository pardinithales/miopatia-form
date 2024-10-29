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

    // Validar valores numéricos
    const numberFields = form.querySelectorAll('input[type="number"]');
    numberFields.forEach(field => {
        if (field.value) {
            const value = parseFloat(field.value);
            
            // Validações específicas por campo
            switch(field.name) {
                case 'intensidadeDor':
                case 'intensidadeFadiga':
                    if (value < 0 || value > 10) {
                        isValid = false;
                        field.classList.add('is-invalid');
                    }
                    break;
                case 'cpkMinimo':
                case 'cpkMaximo':
                    if (value < 0) {
                        isValid = false;
                        field.classList.add('is-invalid');
                    }
                    break;
                // Adicionar outras validações específicas aqui
            }
        }
    });

    // Validar valores máximos e mínimos
    const validateMinMax = (minField, maxField) => {
        const min = parseFloat(minField.value);
        const max = parseFloat(maxField.value);
        
        if (min && max && min > max) {
            isValid = false;
            minField.classList.add('is-invalid');
            maxField.classList.add('is-invalid');
        }
    };

    // Aplicar validação min/max para cada par de campos
    validateMinMax(
        form.querySelector('[name="cpkMinimo"]'),
        form.querySelector('[name="cpkMaximo"]')
    );
    validateMinMax(
        form.querySelector('[name="lactatoMinimo"]'),
        form.querySelector('[name="lactatoMaximo"]')
    );
    // Adicionar outros pares de min/max aqui

    return isValid;
}
