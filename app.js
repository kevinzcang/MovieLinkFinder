
const OMDB_API_KEY = '7289b58';

const qInput = document.getElementById('q');
const searchBtn = document.getElementById('searchBtn');
const resultsEl = document.getElementById('results');
const detailsEl = document.getElementById('details');
const baseUrlInput = document.getElementById('baseUrlInput');

searchBtn.addEventListener('click', () => { console.log('Search clicked!'); });

function el(name, attrs = {}, ...children) {
  const e = document.createElement(name);
  Object.entries(attrs).forEach(([k,v])=>{ if(k==='class') e.className=v; else if(k==='html') e.innerHTML=v; else e.setAttribute(k,v); });
  children.forEach(c=>{ if(typeof c==='string') e.appendChild(document.createTextNode(c)); else if(c) e.appendChild(c); });
  return e;
}

async function search(query) {
  resultsEl.innerHTML = 'Searching...';
  detailsEl.classList.add('hidden');

  // If switch is checked, search TV series, else movies
  const searchType = typeSwitch.checked ? 'series' : 'movie';

  try {
    const resp = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=${searchType}&apikey=${OMDB_API_KEY}`);
    const data = await resp.json();
    if (data.Response === 'True') return data.Search;
    return [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function fetchDetails(imdbID){
  try{
    const r = await fetch(`https://www.omdbapi.com/?i=${imdbID}&plot=short&apikey=${OMDB_API_KEY}`);
    return await r.json();
  }catch(e){return null}
}

function makeResultCard(movie) {
  const img = el('img', { class: 'poster', src: movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.png', alt: `Poster ${movie.Title}` });
  const meta = el('div', { class: 'meta' }, el('h3', {}, `${movie.Title} (${movie.Year})`), el('p', {}, movie.Type || ''));

  const openBtn = el('button', { class: 'btn primary' }, 'Open IMDb');
  const copyBtn = el('button', { class: 'btn' }, 'Copy ID');
  const watchBtn = el('button', { class: 'btn primary' }, 'Watch');

  let seasonInput, episodeInput;
  if (movie.Type === 'series' || movie.Type === 'tv') {
    seasonInput = el('input', {
      type: 'number',
      min: '1',
      value: '1',
      placeholder: 'Season',
      style: 'width: 60px; margin-right: 6px;'
    });
    episodeInput = el('input', {
      type: 'number',
      min: '1',
      value: '1',
      placeholder: 'Episode',
      style: 'width: 60px; margin-right: 6px;'
    });
  }

  openBtn.addEventListener('click', () => {
    const url = `https://www.imdb.com/title/${movie.imdbID}/`;
    window.open(url, '_blank');
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard?.writeText(movie.imdbID).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy ID'), 1200);
    }).catch(() => alert(movie.imdbID));
  });

 watchBtn.addEventListener('click', () => {
  let baseURL = baseUrlInput.value.trim();
  if (!baseURL) {
    alert('Please enter the Free Movie Site base URL.');
    return;
  }
  // Remove trailing slash if any
  if (baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1);
  }

  let fullURL = '';

  if (movie.Type === 'movie') {
    fullURL = `${baseURL}/movie/${movie.imdbID}`;
  } else if (movie.Type === 'series' || movie.Type === 'tv') {
    const season = seasonInput ? seasonInput.value || '1' : '1';
    const episode = episodeInput ? episodeInput.value || '1' : '1';
    fullURL = `${baseURL}/tv/${movie.imdbID}/${season}/${episode}`;
  } else {
    fullURL = `${baseURL}/movie/${movie.imdbID}`;
  }

  window.open(fullURL, '_blank');
});

  const actions = el('div', { class: 'actions' }, copyBtn, openBtn, watchBtn);

  if (movie.Type === 'series' || movie.Type === 'tv') {
    const inputsContainer = el('div', { style: 'margin-top: 8px; display: flex; align-items: center;' }, seasonInput, episodeInput);
    const card = el('div', { class: 'card' }, img, meta, actions, inputsContainer);
    return card;
  } else {
    const card = el('div', { class: 'card' }, img, meta, actions);
    return card;
  }
}

searchBtn.addEventListener('click', async ()=>{
  const q = qInput.value.trim();
  if(!q) return;
  const results = await search(q);
  resultsEl.innerHTML='';
  if(results.length===0){ resultsEl.textContent = 'No results found.'; return; }
  results.forEach(r=> resultsEl.appendChild(makeResultCard(r)));
});

qInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') searchBtn.click(); });

// small placeholder image generation for cases when poster is missing
// you can replace with a data URL or host a placeholder.png file