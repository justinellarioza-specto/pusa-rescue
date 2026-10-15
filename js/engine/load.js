// Loads a text file (like a .glsl shader) relative to the engine folder.
export async function loadText(path) {
  const res = await fetch(new URL(path, import.meta.url));
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.text();
}
