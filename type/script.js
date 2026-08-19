"use strict";
// Se ejecuta hasta que la página cargue completamente
window.addEventListener('DOMContentLoaded', () => {
    const inputNum1 = document.getElementById('num1');
    const inputNum2 = document.getElementById('num2');
    const selectOperacion = document.getElementById('operacion');
    const btnCalcular = document.getElementById('btnCalcular');
    const divResultado = document.getElementById('resultado');
    const listaHistorial = document.getElementById('historial');
    function calcular() {
        const n1 = parseFloat(inputNum1.value);
        const n2 = parseFloat(inputNum2.value);
        const operacion = selectOperacion.value;
        if (isNaN(n1) || isNaN(n2)) {
            alert('Por favor ingresa ambos números.');
            return;
        }
        let res = 0;
        switch (operacion) {
            case '+':
                res = n1 + n2;
                break;
            case '-':
                res = n1 - n2;
                break;
            case '*':
                res = n1 * n2;
                break;
            case '/':
                if (n2 === 0) {
                    alert('No se puede dividir entre cero.');
                    return;
                }
                res = n1 / n2;
                break;
        }
        divResultado.innerText = `El Resultado es: ${res}`;
        const nuevoElemento = document.createElement('li');
        nuevoElemento.textContent = `${n1} ${operacion} ${n2} = ${res}`;
        listaHistorial.appendChild(nuevoElemento);
    }
    // Escuchador de evento seguro
    if (btnCalcular) {
        btnCalcular.addEventListener('click', calcular);
    }
});
