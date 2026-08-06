document.addEventListener('DOMContentLoaded', () => {
  const levels = [
    { name: 'Not Entered', class: 'notEntered' },
    { name: 'Fetish', class: 'fetish' },
    { name: 'Favorite', class: 'favorite' },
    { name: 'Like', class: 'like' },
    { name: 'Indifferent', class: 'indifferent' },
    { name: 'Not Really', class: 'notReally' },
    { name: 'Negotiable', class: 'negotiable' },
    { name: 'Hard Stop', class: 'hardStop' }
  ];

  let kinksData = {};

  const strToClass = (str) => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Parse Text Format
  const parseKinksText = (text) => {
    const lines = text.replace(/\r/g, '').split('\n');
    const newKinks = {};
    let currentCat = null;
    let currentCatName = null;

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      if (line.startsWith('#')) {
        currentCatName = line.substring(1).trim();
        currentCat = { fields: [], kinks: [] };
        newKinks[currentCatName] = currentCat;
      } else if (currentCat) {
        if (line.startsWith('(') && line.endsWith(')')) {
          currentCat.fields = line.substring(1, line.length - 1).split(',').map(s => s.trim());
        } else if (line.startsWith('*')) {
          currentCat.kinks.push({ kinkName: line.substring(1).trim() });
        } else if (line.startsWith('?') && currentCat.kinks.length > 0) {
          currentCat.kinks[currentCat.kinks.length - 1].kinkDesc = line.substring(1).trim();
        }
      }
    });

    return newKinks;
  };

  // Build UI Tables
  const renderList = () => {
    const container = document.getElementById('InputList');
    container.innerHTML = '';

    Object.keys(kinksData).forEach(catName => {
      const category = kinksData[catName];
      const catDiv = document.createElement('div');
      catDiv.className = `kinkCategory cat-${strToClass(catName)}`;

      const h2 = document.createElement('h2');
      h2.textContent = catName;
      catDiv.appendChild(h2);

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const trHead = document.createElement('tr');

      category.fields.forEach(field => {
        const th = document.createElement('th');
        th.className = 'choicesCol';
        th.textContent = field;
        trHead.appendChild(th);
      });

      const thBlank = document.createElement('th');
      trHead.appendChild(thBlank);
      thead.appendChild(trHead);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');

      category.kinks.forEach(kink => {
        const tr = document.createElement('tr');
        tr.className = `kinkRow kink-${strToClass(kink.kinkName)}`;

        category.fields.forEach(field => {
          const td = document.createElement('td');
          const choicesDiv = document.createElement('div');
          choicesDiv.className = `choices choice-${strToClass(field)}`;

          levels.forEach((lvl, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `choice ${lvl.class}`;
            if (idx === 0) btn.classList.add('selected');

            btn.addEventListener('click', () => {
              choicesDiv.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
              btn.classList.add('selected');
              updateHash();
            });

            choicesDiv.appendChild(btn);
          });

          td.appendChild(choicesDiv);
          tr.appendChild(td);
        });

        const tdLabel = document.createElement('td');
        tdLabel.textContent = kink.kinkName;

        if (kink.kinkDesc) {
          const descBtn = document.createElement('button');
          descBtn.type = 'button';
          descBtn.className = 'KinkDesc';
          descBtn.addEventListener('click', () => {
            document.getElementById('Description').textContent = kink.kinkDesc;
            document.getElementById('DescriptionOverlay').classList.add('active');
          });
          tdLabel.appendChild(descBtn);
        }

        tr.appendChild(tdLabel);
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      catDiv.appendChild(table);
      container.appendChild(catDiv);
    });
  };

  // URL Hash State Management
  const updateHash = () => {
    const selectedIndices = [];
    document.querySelectorAll('#InputList .choices').forEach(group => {
      const selected = group.querySelector('.choice.selected');
      const index = Array.from(group.children).indexOf(selected);
      selectedIndices.push(index >= 0 ? index : 0);
    });
    window.location.hash = selectedIndices.join('');
  };

  const applyHash = () => {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const choicesGroups = document.querySelectorAll('#InputList .choices');
    Array.from(hash).forEach((char, idx) => {
      const levelIdx = parseInt(char, 10);
      if (choicesGroups[idx] && !isNaN(levelIdx)) {
        const buttons = choicesGroups[idx].querySelectorAll('.choice');
        buttons.forEach(b => b.classList.remove('selected'));
        if (buttons[levelIdx]) buttons[levelIdx].classList.add('selected');
      }
    });
  };

  // Load Preset List Files
  const loadPreset = (presetName) => {
    fetch(`${presetName}.txt`)
      .then(res => res.text())
      .then(text => {
        document.getElementById('Kinks').value = text;
        kinksData = parseKinksText(text);
        renderList();
        applyHash();
      })
      .catch(() => {
        kinksData = parseKinksText(document.getElementById('Kinks').value);
        renderList();
        applyHash();
      });
  };

  // Event Listeners & Modals
  document.getElementById('listType').addEventListener('change', (e) => {
    loadPreset(e.target.value);
  });

  document.getElementById('Edit').addEventListener('click', () => {
    document.getElementById('EditOverlay').classList.add('active');
  });

  document.getElementById('KinksOK').addEventListener('click', () => {
    const text = document.getElementById('Kinks').value;
    kinksData = parseKinksText(text);
    renderList();
    updateHash();
    document.getElementById('EditOverlay').classList.remove('active');
  });

  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  document.getElementById('CloseInputOverlay').addEventListener('click', () => {
    document.getElementById('InputOverlay').classList.remove('active');
  });

  // Initial Boot
  loadPreset(document.getElementById('listType').value);
});