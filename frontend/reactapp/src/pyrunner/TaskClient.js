import MyPyodideWorker from "./Worker.js?worker";
import {makeChannel} from "sync-message";
import * as Comlink from 'comlink';
import {PyodideClient} from "pyodide-worker-runner";

const channel = makeChannel({serviceWorker: {scope: "/"}});

export const taskClient = new PyodideClient(() => new MyPyodideWorker(), channel);

export async function runCodeTask(entry, outputCallback, inputCallback) {
  let running = true;

  function wrappedOutputCallback(...args) {
    if (running) {
      outputCallback(...args);
    }
  }

  try {
    return await taskClient.call(
      taskClient.workerProxy.runCode,
      entry,
      Comlink.proxy(wrappedOutputCallback),
      Comlink.proxy(inputCallback),
    );
  } catch (e) {
    if (e.type === "InterruptError") {
      return {
        interrupted: true,
        error: null,
        passed: false,
        message_sections: [],
      }
    }
    throw e;
  } finally {
    running = false;
  }
}