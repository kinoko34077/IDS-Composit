const endpoint = 'https://api.chise.org/v0/character/ids-match';
const probes = [
  { label: 'Unicode response', ids: '⿰氵⿱木日' },
  { label: 'Position variant candidate', ids: '⿰水青' },
  { label: 'Position variant query', ids: '⿰氵青' },
  { label: 'No-match candidate', ids: '⿰龜龜' },
];

const status = document.querySelector<HTMLParagraphElement>('#status');
const results = document.querySelector<HTMLTableSectionElement>('#results');
if (status === null || results === null) throw new Error('Preflight elements are missing');

for (const probe of probes) {
  const row = document.createElement('tr');
  const labelCell = document.createElement('td');
  labelCell.textContent = probe.label;
  const idsCell = document.createElement('td');
  const idsCode = document.createElement('code');
  idsCode.textContent = probe.ids;
  idsCell.append(idsCode);
  const resultCell = document.createElement('td');
  resultCell.textContent = 'running';
  const bodyCell = document.createElement('td');
  row.append(labelCell, idsCell, resultCell, bodyCell);
  results.append(row);

  try {
    const url = new URL(endpoint);
    url.searchParams.set('ids', probe.ids);
    const response = await fetch(url);
    const body = await response.text();
    resultCell.textContent = `${response.status} ${response.type}`;
    resultCell.className = response.ok ? 'pass' : 'fail';
    bodyCell.textContent = body;
  } catch (error) {
    resultCell.textContent = 'CORS/fetch error';
    resultCell.className = 'fail';
    bodyCell.textContent = String(error);
  }
}

const failures = Array.from(results.querySelectorAll('.fail')).length;
status.textContent = failures === 0
  ? 'All browser probes completed with HTTP success.'
  : `${failures} browser probe(s) failed; see the response details below.`;
status.className = failures === 0 ? 'pass' : 'fail';
