document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  const searchInput = document.getElementById("search");
  const sortSelect = document.getElementById("sortSelect");
  const consoleSelect = document.getElementById("consoleSelect");

  let currentView = "home";
  let searchTerm = "";
  let sortBy = "title";
  let filterConsole = "all";
  let selectedRelease = 0;
  const nameStats = {};

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderHome();
  });

  sortSelect.addEventListener("change", (e) => {
    sortBy = e.target.value;
    renderHome();
  });

  consoleSelect.addEventListener("change", (e) => {
    filterConsole = e.target.value;
    renderHome();
  });

  function computeNameStats() {
    gameCredits.forEach(game => {
      game.releases.forEach(release => {
release.credits.split('\n').forEach(rawLine => {
  const line = rawLine.replace(/\\+$/, '').trim();
          if (line.startsWith('\\') || line.startsWith('\\\\')) return;
          const parts = line.split(':');
          if (parts.length < 2) return;
          parts[1].split(',').forEach(name => {
            const cleanName = name.trim().replace(/\s*\(.+\)$/, ''); // strip anything in ( )
            if (!cleanName) return;
            if (!nameStats[cleanName]) {
              nameStats[cleanName] = { count: 0, games: new Set() };
            }
            nameStats[cleanName].count++;
            nameStats[cleanName].games.add(game.id);
          });
        });
      });
    });
  }

  function renderHome() {
    currentView = "home";
    selectedRelease = 0;

    const consoles = [...new Set(gameCredits.flatMap(g => g.releases.map(r => r.console)))].sort();

    consoleSelect.innerHTML = `
      <option value="all"${filterConsole === "all" ? " selected" : ""}>All Consoles</option>
      ${consoles.map(console => `
        <option value="${console}"${filterConsole === console ? " selected" : ""}>${console}</option>
      `).join("")}
    `;

    const filteredGames = getFilteredGames();
    app.innerHTML = `
      <ul class="game-list">
        ${filteredGames.map(game => {
          const date = game.releases[0].releaseDate;
          return `
            <li class="game-item" data-id="${game.id}">
              ${game.title} (${new Date(date).getFullYear()}) - ${game.releases.map(r => r.console).join(', ')}
            </li>
          `;
        }).join("")}
      </ul>
    `;

    document.querySelectorAll(".game-item").forEach(item => {
      item.addEventListener("click", () => renderGame(item.dataset.id));
    });
  }

  function getFilteredGames() {
    const query = searchTerm.toLowerCase();
    return [...gameCredits]
      .filter(g => g.title.toLowerCase().includes(query))
      .filter(g => filterConsole === "all" || g.releases.some(r => r.console === filterConsole))
      .sort((a, b) => {
        const aVal = sortBy === "releaseDate" ? new Date(a.releases[0].releaseDate) : a[sortBy];
        const bVal = sortBy === "releaseDate" ? new Date(b.releases[0].releaseDate) : b[sortBy];
        return aVal < bVal ? -1 : 1;
      });
  }

  function renderGame(id) {
    const game = gameCredits.find(g => g.id === id);
    if (!game) return;

    const releases = game.releases;
    const active = releases[selectedRelease];

    // Platform tabs
    let tabs = '<div class="tabs">';
    releases.forEach((r, i) => {
      tabs += `<button class="tab ${i === selectedRelease ? 'active' : ''}" onclick="selectRelease(${i}, '${id}')">${r.console}</button>`;
    });
    tabs += '</div>';

    // Credits block
    const lines = active.credits.trim().split('\n');
    let html = `
      <header onclick="renderHome()" style="cursor:pointer">← ${game.title} (${active.console})</header>
      ${tabs}
      <div class="credits-container">
    `;

    let alt = false;
    lines.forEach(line => {
      if (line.startsWith("\\\\")) {
        html += `<div class="credit-header">${line.slice(2).trim()}</div>`;
      } else if (line.startsWith("\\")) {
        html += `<div class="credit-header">${line.slice(1).trim()}</div>`;
      } else if (line.trim()) {
line = line.replace(/\\+$/, '').trim(); // 🧹 remove trailing backslashes

const [role, namesRaw] = line.split(':');
if (!namesRaw) return;

const nameSpans = namesRaw
  .split(',')
  .map(n => n.trim())
  .filter(n => n.length > 0)
  .map(name => {
    const match = name.match(/^(.+?)\s*(\(.+\))$/); // split at parentheses
    const realName = match ? match[1].trim() : name;
    const comment = match ? match[2] : '';
    return `<span class="name" data-name="${realName}"><span class="hoverable">${realName}</span></span>${comment ? ` ${comment}` : ''}`;
  })
  .join(', ');


html += `<div class="credit-line ${alt ? 'alt-line' : ''}"><strong>${role.trim()}:</strong> ${nameSpans}</div>`;
        alt = !alt;
      }
    });


    html += `</div>`;
    app.innerHTML = html;
    attachNameHover();
  }

  window.selectRelease = (idx, id) => {
    selectedRelease = idx;
    renderGame(id);
  };

  function attachNameHover() {
    document.querySelectorAll('.name').forEach(el => {
      el.addEventListener('mouseenter', () => {
        const name = el.dataset.name;
        const stats = nameStats[name];
        if (stats) {
          const gamesCount = stats.games.size;
          showTooltip(el, `${name}\n${stats.count} total credits\n${gamesCount} unique game${gamesCount > 1 ? 's' : ''}`);
        }
      });
      el.addEventListener('mouseleave', hideTooltip);
    });
  }

  let tooltip;
  function showTooltip(el, text) {
    hideTooltip();
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerText = text;
    document.body.appendChild(tooltip);
    const rect = el.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY - 90}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
  }

  function hideTooltip() {
    if (tooltip) tooltip.remove();
  }

  computeNameStats();
  renderHome();
});
