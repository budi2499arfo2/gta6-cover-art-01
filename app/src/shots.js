// Fixed scenes for screenshots and for anyone linking a demo.
//
//   ?shot=cover      the poster alone, canvas filling the window
//   ?shot=editor     the bench with a photo loaded and the rail open
//   ?shot=export     the poster alone with a small "exported" stamp
//
// Shared query parameters: photo=a,b (samples/<name>.jpg, in order), caption=,
// subtitle=, count=2..6, preset=<id>, frame=1:1|4:5|16:9, font=<percent>.

export async function runShot(shot, query, api) {
  const body = document.body;
  body.classList.add(`shot-${shot}`);

  const frame = query.get('frame') ?? '1:1';
  const preset = query.get('preset') ?? 'vice';
  const count = Number(query.get('count') ?? 4);
  const font = Number(query.get('font') ?? 100);
  const photoParam = query.get('photo') ?? 'boulevard,pier';
  const names = photoParam.split(',').map((s) => s.trim()).filter(Boolean);

  const photos = await api.loadSamples(names);

  api.applyState({
    photos,
    caption: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'a neon coast story',
    count: Number.isInteger(count) && count >= 2 ? count : 4,
    preset,
    frame,
    fontScale: Number.isFinite(font) ? font / 100 : 1,
    selected: 0,
  });

  if (shot === 'export') {
    const stamp = document.getElementById('stamp-size');
    if (stamp) {
      stamp.textContent = frame === '4:5' ? '1080 × 1350'
        : frame === '16:9' ? '1920 × 1080' : '1080 × 1080';
    }
    body.classList.add('is-exported');
  }
}
