// @ts-nocheck
importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  await pyodideReadyPromise;
  const { id, python, data, ...context } = event.data;
  console.log("Python worker actually received a task")
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }
  try {
    if (data != undefined) {
      for (const key of Object.keys(data)) {
        self.pyodide.globals.set(key, data[key]);
      }
    }

    await self.pyodide.loadPackagesFromImports(python);
    console.log("preparing to run python")
    let results = await self.pyodide.runPythonAsync(python);
    console.log("python executed")

    // @ts-ignore
    if (results.toJs != undefined) {
      results = results.toJs();
    }

    self.postMessage({ results, id, data });
  } catch (error) {
    console.log(error)

    // @ts-ignore
    self.postMessage({ error: error.message, id });
  }
};
