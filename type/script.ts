type Operacion = '+' | '-' | '*' | '/';

// Se ejecuta hasta que la página cargue completamente
window.addEventListener('DOMContentLoaded', () => {

  const inputNum1 = document.getElementById('num1') as HTMLInputElement;
  const inputNum2 = document.getElementById('num2') as HTMLInputElement;
  const selectOperacion = document.getElementById('operacion') as HTMLSelectElement;
  const btnCalcular = document.getElementById('btnCalcular') as HTMLButtonElement;
  const divResultado = document.getElementById('resultado') as HTMLDivElement;
  const listaHistorial = document.getElementById('historial') as HTMLUListElement;

  function calcular(): void {
    const n1: number = parseFloat(inputNum1.value);
    const n2: number = parseFloat(inputNum2.value);
    const operacion: Operacion = selectOperacion.value as Operacion;

    if (isNaN(n1) || isNaN(n2)) {
      alert('Por favor ingresa ambos números.');
      return;
    }

    let res: number = 0;

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

    const nuevoElemento: HTMLLIElement = document.createElement('li');
    nuevoElemento.textContent = `${n1} ${operacion} ${n2} = ${res}`;
    listaHistorial.appendChild(nuevoElemento);
  }

  // Escuchador de evento seguro
  if (btnCalcular) {
    btnCalcular.addEventListener('click', calcular);
  }

});