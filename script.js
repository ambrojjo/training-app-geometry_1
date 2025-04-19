// ---------------------------
// GLOBAL VARIABLES
// ---------------------------
let currentAttempts = [];     // Tentativi per ogni domanda del problema corrente
let currentSolutions = [];    // Soluzioni corrette per ogni domanda del problema corrente
let currentQuestions = [];    // Domande del problema corrente
let currentProblemData = null; // Dati del problema corrente
let problemsSolvedCount = 0;  // Numero di problemi risolti (per decidere il pool)
let solvedProblemsData = [];  // Array per registrare il riepilogo dei problemi svolti
let globalStats = {           // Statistiche globali (sessione corrente)
  problemsAttempted: 0,
  totalAttemptCount: 0,
  totalCorrect: 0
};

// ---------------------------
// DEFINIZIONE DEI MODELLI DI PROBLEMA
// Divisi in due gruppi: da 1 a 5 (semplici) e da 6 a 10 (avanzati)
// ---------------------------

const problemsSimple = [
  // Modello 1
  {
    model: 1,
    text: "Un cubo costituito da un materiale il cui peso specifico è {w} g/cm³, ha lo spigolo di {s} cm.",
    questions: [
      { text: "Calcolare la Superficie Laterale (cm²)", formula: s => 4 * Math.pow(s, 2) },
      { text: "Calcolare la Superficie Totale (cm²)", formula: s => 6 * Math.pow(s, 2) },
      { text: "Calcolare il Volume (cm³)", formula: s => Math.pow(s, 3) },
      { text: "Calcolare il peso in kg", formula: (s, w) => (w * Math.pow(s, 3)) / 1000 }
    ],
    parameters: () => ({
      s: Math.floor(Math.random() * (29 - 11 + 1)) + 11,
      w: parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1))
    })
  },
  // Modello 2
  {
    model: 2,
    text: "Un cubo costituito da un materiale il cui peso specifico è {w} g/cm³, ha una faccia con area di {s2} cm².",
    questions: [
      { text: "Calcolare lo spigolo (cm)", formula: s => s },
      { text: "Calcolare la Superficie Laterale (cm²)", formula: s => 4 * Math.pow(s, 2) },
      { text: "Calcolare la Superficie Totale (cm²)", formula: s => 6 * Math.pow(s, 2) },
      { text: "Calcolare il Volume (cm³)", formula: s => Math.pow(s, 3) },
      { text: "Calcolare il peso in kg", formula: (s, w) => (w * Math.pow(s, 3)) / 1000 }
    ],
    parameters: () => {
      let s = Math.floor(Math.random() * (29 - 11 + 1)) + 11;
      return { s: s, s2: s * s, w: parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1)) };
    }
  },
  // Modello 3
  {
    model: 3,
    text: "Un parallelepipedo a base rettangolare ha profondità di {x} cm e larghezza di {y} cm. L'altezza del solido è {mOverN} della larghezza. Il solido è costituito da un materiale il cui peso specifico è {w} g/cm³.",
    questions: [
      { text: "Calcolare la Superficie Laterale (cm²)", formula: (x, y, m, n) => 2 * (x + y) * (m * y / n) },
      { text: "Calcolare la Superficie Totale (cm²)", formula: (x, y, m, n) => 2 * (x + y) * (m * y / n) + 2 * x * y },
      { text: "Calcolare il Volume (cm³)", formula: (x, y, m, n) => x * y * (m * y / n) },
      { text: "Calcolare il peso in kg", formula: (x, y, m, n, w) => (w * x * y * (m * y / n)) / 1000 }
    ],
    parameters: () => ({
      x: Math.floor(Math.random() * (19 - 5 + 1)) + 5,
      y: Math.floor(Math.random() * (39 - 21 + 1)) + 21,
      m: [7, 11, 13][Math.floor(Math.random() * 3)],
      n: Math.floor(Math.random() * (6 - 2 + 1)) + 2,
      w: parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1)),
      mOverN: "" // verrà sostituito in postProcess
    }),
    postProcess: function(params) {
      params.mOverN = params.m + "/" + params.n;
      return params;
    }
  },
  // Modello 4
  {
    model: 4,
    // La stringa ora include il valore numerico "perimeter" (calcolato nei parametri) al posto di 2({x}+{y})
    text: "Un parallelepipedo a base rettangolare ha altezza di {z} cm, profondità di {x} cm e perimetro di base di {perimeter} cm. Il solido è costituito da un materiale il cui peso specifico è {w} g/cm³.",
    questions: [
      { text: "Calcolare la Superficie Laterale (cm²)", formula: (x, y, z) => 2 * z * (x + y) },
      { text: "Calcolare la Superficie Totale (cm²)", formula: (x, y, z) => 2 * z * (x + y) + 2 * x * y },
      { text: "Calcolare il Volume (cm³)", formula: (x, y, z) => x * y * z },
      { text: "Calcolare il peso in kg", formula: (x, y, z, w) => (w * x * y * z) / 1000 }
    ],
    parameters: () => {
      let x = Math.floor(Math.random() * (19 - 5 + 1)) + 5;
      let y = Math.floor(Math.random() * (35 - 21 + 1)) + 21;
      let z = Math.floor(Math.random() * (49 - 36 + 1)) + 36;
      let w = parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1));
      return { x: x, y: y, z: z, w: w, perimeter: 2 * (x + y) };
    }
  },
  // Modello 5
  {
    model: 5,
    // In questo modello, la traccia presenta il perimetro calcolato (anziché l'espressione)
    text: "Un parallelepipedo a base rettangolare ha altezza di {z} cm, larghezza di {y} cm e perimetro di base di {perimeter} cm. Il solido è costituito da un materiale il cui peso specifico è {w} g/cm³.",
    questions: [
      { text: "Calcolare la Superficie Laterale (cm²)", formula: (x, y, z) => 2 * z * (x + y) },
      { text: "Calcolare la Superficie Totale (cm²)", formula: (x, y, z) => 2 * z * (x + y) + 2 * x * y },
      { text: "Calcolare il Volume (cm³)", formula: (x, y, z) => x * y * z },
      { text: "Calcolare il peso in kg", formula: (x, y, z, w) => (w * x * y * z) / 1000 }
    ],
    parameters: () => {
      let x = Math.floor(Math.random() * (19 - 5 + 1)) + 5;
      let y = Math.floor(Math.random() * (35 - 21 + 1)) + 21;
      let z = Math.floor(Math.random() * (49 - 36 + 1)) + 36;
      let w = parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1));
      return { x: x, y: y, z: z, w: w, perimeter: 2 * (x + y) };
    }
  }
];

const problemsAdvanced = [
  // Modello 6
  {
    model: 6,
    text: "Un parallelepipedo a base rettangolare ha profondità di {x} cm e altezza di {z} cm, ed è equivalente in volume a un cubo avente spigolo di {s} cm. Il materiale ha un peso specifico di {w} g/cm³.",
    questions: [
      { text: "Calcolare la larghezza (cm)", formula: (x, z, s) => Math.pow(s, 3) / (x * z) },
      { text: "Calcolare la Superficie Laterale (cm²)", formula: (x, z, s) => 2 * z * ( x + (Math.pow(s, 3) / (x * z)) ) },
      { text: "Calcolare la Superficie Totale (cm²)", formula: (x, z, s) => 2 * z * ( x + (Math.pow(s, 3) / (x * z)) ) + 2 * (Math.pow(s, 3) / z) },
      { text: "Calcolare il peso in kg", formula: (s, w) => (w * Math.pow(s, 3)) / 1000 }
    ],
    parameters: () => ({
      x: Math.floor(Math.random() * (19 - 11 + 1)) + 11,
      z: Math.floor(Math.random() * (39 - 30 + 1)) + 30,
      s: Math.floor(Math.random() * (29 - 20 + 1)) + 20,
      w: parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1))
    })
  },
  // Modello 7
  {
    model: 7,
    text: "Un cubo avente spigolo di {s} cm è equivalente in volume a un parallelepipedo a base rettangolare la cui area di base è {xy} cm². La profondità del parallelepipedo è {x} cm. Il materiale ha un peso specifico di {w} g/cm³.",
    questions: [
      { text: "Calcolare l'altezza (cm)", formula: (x, y, s) => Math.pow(s, 3) / (x * y) },
      { text: "Calcolare la Superficie Laterale (cm²)", formula: (x, y, s) => 2 * (Math.pow(s, 3) / (x * y)) * (x + y) },
      { text: "Calcolare la Superficie Totale (cm²)", formula: (x, y, s) => 2 * (Math.pow(s, 3) / (x * y)) * (x + y) + 2 * x * y },
      { text: "Calcolare il peso in kg", formula: (s, w) => (w * Math.pow(s, 3)) / 1000 }
    ],
    parameters: () => {
      let x = Math.floor(Math.random() * (19 - 11 + 1)) + 11;
      let y = Math.floor(Math.random() * (29 - 20 + 1)) + 20;
      let s = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
      return {
        x: x,
        y: y,
        xy: x * y,
        s: s,
        w: parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1))
      };
    }
  },
  // Modello 8
  {
    model: 8,
    text: "Un parallelepipedo a base rettangolare le cui larghezza e altezza sono rispettivamente {y} cm e {z} cm è equivalente in volume ai {mOverN} di un cubo avente spigolo {s}. Il materiale ha un peso specifico di {w} g/cm³.",
    questions: [
        { text: "Calcolare il Volume del parallelepipedo (cm³)", formula: (s, m, n) => (m * Math.pow(s, 3)) / n },
        { text: "Calcolare la profondità (cm)", formula: (y, z, s, m, n) => ((m * Math.pow(s, 3)) / n) / (y * z) },
        { text: "Calcolare la Superficie Laterale (cm²)", formula: (y, z, s, m, n) => 2 * z * ( y + (((m * Math.pow(s, 3)) / n) / (y * z)) ) },
        { text: "Calcolare la Superficie Totale (cm²)", formula: (y, z, s, m, n) => 2 * z * ( y + (((m * Math.pow(s, 3)) / n) / (y * z)) ) + 2 * (((m * Math.pow(s, 3)) / n) / z) },
        { text: "Calcolare il peso in kg", formula: (s, m, n, w) => (w * (m * Math.pow(s, 3)) / n) / 1000 }
    ],
    parameters: () => {
        let s = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
        let y = Math.floor(Math.random() * (19 - 11 + 1)) + 11;
        let z = Math.floor(Math.random() * (49 - 35 + 1)) + 35;
        let m = [7, 11, 13][Math.floor(Math.random() * 3)];
        let n = Math.floor(Math.random() * (6 - 2 + 1)) + 2;
        return {
            s: s,
            y: y,
            z: z,
            m: m,
            n: n,
            mOverN: `${m}/${n}`,
            w: parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1))
        };
    }
},

  // Modello 9
  {
    model: 9,
    text: "Un cubo avente spigolo di {s} cm è esattamente sovrapposto ad un parallelepipedo a base quadrata con lato congruente a {s} cm. L'altezza del parallelepipedo è il triplo del lato. Il materiale ha un peso specifico di {w} g/cm³.",
    questions: [
      { text: "Calcolare il Volume del solido composto (cm³)", formula: s => 4 * Math.pow(s, 3) },
      { text: "Calcolare la Superficie Laterale (cm²)", formula: s => 16 * Math.pow(s, 2) },
      { text: "Calcolare la Superficie Totale (cm²)", formula: s => 18 * Math.pow(s, 2) },
      { text: "Calcolare il peso in kg", formula: (s, w) => 4 * w * Math.pow(s, 3) }
    ],
    parameters: () => ({
      s: Math.floor(Math.random() * (29 - 11 + 1)) + 11,
      w: parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1))
    })
  },
  // Modello 10
  {
    model: 10,
    // Il testo ora mostra il peso calcolato "pesoCalculato" anziché l'espressione
    text: "Un parallelepipedo a base quadrata, di altezza di {z} cm, è esattamente sovrapposto ad un cubo la cui faccia combacia con la base. Il peso del parallelepipedo è calcolato come {pesoCalculato} kg e il materiale ha peso specifico di {w} g/cm³.",
    questions: [
      { text: "Calcolare il Volume del cubo (cm³)", formula: s => Math.pow(s, 3) },
      { text: "Calcolare la Superficie Laterale del solido composto (cm²)", formula: (s, z) => 4 * s * (z + s) },
      { text: "Calcolare la Superficie Totale del solido composto (cm²)", formula: (s, z) => 4 * s * (z + s) + 2 * Math.pow(s, 2) }
    ],
    parameters: () => {
      let z = Math.floor(Math.random() * (49 - 35 + 1)) + 35;
      let s = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
      let w = parseFloat((Math.random() * (4.9 - 2.1) + 2.1).toFixed(1));
      let pesoCalculato = (w * Math.pow(s, 2) * z / 1000).toFixed(2);
      return { z: z, s: s, w: w, pesoCalculato: pesoCalculato };
    }
  }
];

// ---------------------------
// GENERAZIONE DEL PROBLEMA E GESTIONE DEI TENTATIVI
// ---------------------------

function generateProblem() {
  // Determina il pool in funzione del numero di problemi risolti
  let pool = (problemsSolvedCount < 5) ? problemsSimple : problemsAdvanced;
  let randomIndex = Math.floor(Math.random() * pool.length);
  currentProblemData = pool[randomIndex];

  // Genera i parametri e, se presente, applica eventuale postProcess
  let params = currentProblemData.parameters();
  if (currentProblemData.postProcess) {
    params = currentProblemData.postProcess(params);
  }
  currentProblemData.generatedParams = params;
  
  // Sostituisci le variabili nel testo della traccia
  let text = currentProblemData.text;
  for (let key in params) {
    let regex = new RegExp("{" + key + "}", "g");
    text = text.replace(regex, params[key]);
  }
  document.getElementById("problem-text").textContent = text;
  
  // Genera le caselle di risposta per ogni domanda
  let answerContainer = document.getElementById("answers");
  answerContainer.innerHTML = "";
  currentQuestions = currentProblemData.questions;
  currentAttempts = [];
  currentSolutions = [];
  
  currentQuestions.forEach((question, index) => {
    // Prepara gli argomenti per il calcolo della soluzione in base al modello
    let m = currentProblemData.model;
    let args = [];
    if (m === 1) {
      if (index < 3) args = [params.s];
      else args = [params.s, params.w];
    } else if (m === 2) {
      if (index === 0) args = [params.s];
      else if (index < 4) args = [params.s];
      else args = [params.s, params.w];
    } else if (m === 3) {
      if (index < 3) args = [params.x, params.y, params.m, params.n];
      else args = [params.x, params.y, params.m, params.n, params.w];
    } else if (m === 4 || m === 5) {
      if (index < 3) args = [params.x, params.y, params.z];
      else args = [params.x, params.y, params.z, params.w];
    } else if (m === 6) {
      if (index === 0) args = [params.x, params.z, params.s];
      else if (index === 1) args = [params.x, params.z, params.s];
      else if (index === 2) args = [params.x, params.z, params.s];
      else if (index === 3) args = [params.s, params.w];
    } else if (m === 7) {
      if (index === 0) args = [params.x, params.y, params.s];
      else if (index === 1) args = [params.x, params.y, params.s];
      else if (index === 2) args = [params.x, params.y, params.s];
      else if (index === 3) args = [params.s, params.w];
    } else if (m === 8) {
      if (index === 0) args = [params.s, params.m, params.n];
      else if (index === 1) args = [params.y, params.z, params.s, params.m, params.n];
      else if (index === 2) args = [params.y, params.z, params.s, params.m, params.n];
      else if (index === 3) args = [params.y, params.z, params.s, params.m, params.n];
      else if (index === 4) args = [params.s, params.m, params.n, params.w];
    } else if (m === 9) {
      if (index < 3) args = [params.s];
      else args = [params.s, params.w];
    } else if (m === 10) {
      if (index === 0) args = [params.s];
      else if (index === 1) args = [params.s, params.z];
      else if (index === 2) args = [params.s, params.z];
    }
    
    let solution = question.formula.apply(null, args);
    currentSolutions[index] = solution;
    currentAttempts[index] = 0;
    
    // Crea il contenitore per la domanda e l'input
    let div = document.createElement("div");
    div.className = "question-container";
    
    let label = document.createElement("label");
    label.textContent = question.text;
    label.htmlFor = "answer" + index;
    
    let inputField = document.createElement("input");
    inputField.type = "number";
    inputField.id = "answer" + index;
    inputField.placeholder = "Inserisci la risposta (usa 1 decimale se necessario)";
    
    div.appendChild(label);
    div.appendChild(document.createElement("br"));
    div.appendChild(inputField);
    answerContainer.appendChild(div);
  });
  
  // Pulisci il feedback
  document.getElementById("feedback").innerHTML = "";
  
  // Imposta l'evento del bottone "Verifica"
  document.getElementById("check-button").onclick = checkAnswers;
}

// Funzione per verificare le risposte e gestire i tentativi
function checkAnswers() {
  let allCorrect = true;
  let feedbackContainer = document.getElementById("feedback");
  feedbackContainer.innerHTML = "";
  
  currentQuestions.forEach((question, index) => {
    let input = document.getElementById("answer" + index);
    if (input.disabled) return;
    
    let userAnswer = parseFloat(input.value);
    let correctAnswer = currentSolutions[index];
    
    if (Math.abs(userAnswer - correctAnswer) <= 0.1) {
      let p = document.createElement("p");
      p.textContent = question.text + ": ✔️ Corretto!";
      p.className = "correct";
      feedbackContainer.appendChild(p);
      input.disabled = true;
    } else {
      allCorrect = false;
      currentAttempts[index]++;
      let p = document.createElement("p");
      if (currentAttempts[index] >= 5) {
        p.textContent = question.text + ": ❌ Errato! Hai superato il numero massimo di tentativi. Studia bene e riprova con un nuovo problema.";
        p.className = "wrong";
        input.disabled = true;
      } else {
        p.textContent = question.text + ": ❌ Errato! Riprova. Tentativi per questa domanda: " + currentAttempts[index] + "/5";
        p.className = "wrong";
      }
      feedbackContainer.appendChild(p);
    }
  });
  
  // Se tutte le risposte sono corrette, mostra il messaggio e il pulsante "Continua"
  if (allCorrect) {
    let p = document.createElement("p");
    p.textContent = "Tutte le risposte sono corrette!";
    p.className = "correct";
    feedbackContainer.appendChild(p);
    
    // Registra i dati del problema svolto
    solvedProblemsData.push({
      model: currentProblemData.model,
      attempts: currentAttempts.slice(),
      parameters: currentProblemData.generatedParams
    });
    problemsSolvedCount++;
    globalStats.problemsAttempted++;
    currentAttempts.forEach((attempt) => {
      globalStats.totalAttemptCount += attempt;
    });
    globalStats.totalCorrect += currentQuestions.length;
    
    // Bottone per passare al problema successivo
    let continueButton = document.createElement("button");
    continueButton.textContent = "Continua";
    continueButton.onclick = function() {
      generateProblem();
      updateSummary();
      updateGlobalStats();
    };
    feedbackContainer.appendChild(continueButton);
    
    updateSummary();
    updateGlobalStats();
  }
}

// Aggiorna il resoconto dei problemi svolti (dopo almeno 2 problemi)
function updateSummary() {
  let summaryDiv = document.getElementById("summary");
  if (solvedProblemsData.length < 2) {
    summaryDiv.style.display = "none";
    return;
  }
  summaryDiv.style.display = "block";
  let summaryHtml = "<h3>Resoconto dei problemi svolti</h3>";
  solvedProblemsData.forEach((data, index) => {
    summaryHtml += `<p><strong>Problema ${index + 1} (Modello ${data.model}):</strong> Tentativi per ogni domanda: [${data.attempts.join(", ")}]</p>`;
  });
  summaryDiv.innerHTML = summaryHtml;
}

// Aggiorna le statistiche globali nella sezione laterale
function updateGlobalStats() {
  let nickname = document.getElementById("nickname").value.trim();
  let statsDiv = document.getElementById("stats");
  
  // Mostriamo il nickname nel titolo delle statistiche
  statsDiv.innerHTML = `<h3>Statistiche (${nickname})</h3>
      <p>Problemi Tentati: ${globalStats.problemsAttempted}</p>
      <p>Tentativi Totali: ${globalStats.totalAttemptCount}</p>
      <p>Risposte Corrette: ${globalStats.totalCorrect}</p>`;
}

// Avvia il training dopo l'inserimento del nickname
function startTraining() {
  let nickname = document.getElementById("nickname").value.trim();
  if (nickname === "") {
    alert("Inserisci un nickname per iniziare!");
    return;
  }
  document.getElementById("login-container").style.display = "none";
  document.getElementById("training-container").style.display = "block";
  problemsSolvedCount = 0;
  solvedProblemsData = [];
  globalStats = { problemsAttempted: 0, totalAttemptCount: 0, totalCorrect: 0 };
  updateGlobalStats();
  generateProblem();
}
