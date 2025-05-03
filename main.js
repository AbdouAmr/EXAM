let dataEmployes = [];

document.getElementById('input-excel').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) {
    alert("Aucun fichier sélectionné. Veuillez choisir un fichier.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.SheetNames[0];
      dataEmployes = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
      console.log("Données chargées :", dataEmployes);

      const requiredColumns = ['Service', 'DateEmbauche', 'Salaire'];
      const missingColumns = requiredColumns.filter(col => !dataEmployes[0] || !(col in dataEmployes[0]));
      if (missingColumns.length > 0) {
        alert(`Colonnes manquantes dans le fichier : ${missingColumns.join(', ')}`);
        return;
      }

      initialiserDashboard();
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier :", error);
      alert("Le fichier sélectionné n'est pas valide ou est mal formaté.");
    }
  };
  reader.readAsArrayBuffer(file);
});

function remplirSelectService(data) {
  const services = [...new Set(data.map(row => row.Service))];
  const select = document.getElementById('select-service');
  select.innerHTML = '<option value="">Tous</option>';
  services.forEach(service => {
    const option = document.createElement("option");
    option.value = service;
    option.textContent = service;
    select.appendChild(option);
  });
}

function filtrerParService(data, service) {
  return service ? data.filter(row => row.Service === service) : data;
}

function afficherAnnees(data) {
  const parAnnee = {};
  data.forEach(row => {
    if (row.DateEmbauche) {
      const annee = new Date(row.DateEmbauche).getFullYear();
      parAnnee[annee] = (parAnnee[annee] || 0) + 1;
    }
  });
  Plotly.newPlot('graph-annees', [{
    x: Object.keys(parAnnee),
    y: Object.values(parAnnee),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Embauches'
  }]);
}

function afficherParService(data) {
  const parService = {};
  data.forEach(row => {
    parService[row.Service] = (parService[row.Service] || 0) + 1;
  });
  Plotly.newPlot('graph-services', [{
    x: Object.keys(parService),
    y: Object.values(parService),
    type: 'bar',
    name: 'Employés par service'
  }]);
}

function afficherSalaires(data) {
  const parSalaire = data
    .map(row => parseFloat(row.Salaire))
    .filter(salaire => !isNaN(salaire));
  Plotly.newPlot('graph-salaires', [{
    x: parSalaire,
    type: 'histogram',
    name: 'Distribution des salaires'
  }]);
}

function initialiserDashboard() {
  remplirSelectService(dataEmployes);
  document.getElementById('select-service').addEventListener('change', mettreAJourDashboard);
  mettreAJourDashboard();
}

function mettreAJourDashboard() {
  const service = document.getElementById('select-service').value;
  const dataFiltrée = filtrerParService(dataEmployes, service);
  afficherAnnees(dataFiltrée);
  afficherParService(dataFiltrée);
  afficherSalaires(dataFiltrée);
}
