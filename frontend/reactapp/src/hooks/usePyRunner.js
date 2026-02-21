import { useState, useEffect, useRef, useCallback } from "react";
import { runCodeTask, taskClient } from "../pyrunner/TaskClient.js";

export function usePyRunner() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [plotSrc, setPlotSrc] = useState(null);
  const [errorLine, setErrorLine] = useState(null);
  
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  const clearConsole = useCallback(() => {
    setConsoleOutput([]);
  }, []);

const addConsoleEntry = useCallback((content, type = 'output', timestamp = new Date()) => {
    setConsoleOutput(prev => {
      const strippedContent = content.replace(/^\r+/, '');

      // If the chunk is literally just empty spaces or stray newlines, append it normally
      if (content.startsWith('\r') && strippedContent.trim() === '') {
        return [
          ...prev,
          { id: Date.now() + Math.random(), content: strippedContent, type, timestamp }
        ];
      }

      if (content.startsWith('\r') && prev.length > 0) {
        const lastEntry = prev[prev.length - 1];

        if (lastEntry.content.endsWith('\n')) {
          return [
            ...prev,
            { id: Date.now() + Math.random(), content: strippedContent, type, timestamp }
          ];
        }

        // Otherwise, overwrite the previous entry (this is the actual tqdm frame update)
        if (lastEntry.type === type) {
          return [
            ...prev.slice(0, -1),
            { ...lastEntry, content: strippedContent, timestamp }
          ];
        }
      }

      // Standard append for regular output
      return [
        ...prev,
        { id: Date.now() + Math.random(), content: strippedContent, type, timestamp }
      ];
    });
  }, []);

  // Initialize Pyodide
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      addConsoleEntry("Loading Python interpreter...", "system");
      try {
        await taskClient.call(taskClient.workerProxy.init);
        addConsoleEntry("Interpreter loaded.", "system");
      } catch (err) {
        addConsoleEntry(`Failed to load: ${err.message}`, "error");
        addConsoleEntry(`Please refresh your page and don't tab out.`, "error");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [addConsoleEntry]);

  // Configure callbacks
  useEffect(() => {
    terminalRef.current = {
      pushToStdout: (parts) => {
        parts.forEach(part => {
          if (part.type === 'show_image') {
            setPlotSrc(`data:image/${part.format};base64,${part.data}`);
          } else if (part.type === 'input_prompt') {
            addConsoleEntry(part.text, "system");
            setWaitingForInput(true);
          } 
          // Handle Errors and STDERR
          else if (part.type === 'internal_error' || part.type === 'stderr') {
            // lol
            if (part.text.includes("TqdmMonitorWarning")) return;

            if (!part.text.trim()) return;
            if (part.text.includes("SystemExit:")) return;

            const isProgressBar = part.text.startsWith('\r');
            const logType = isProgressBar ? 'output' : 'error';

            addConsoleEntry(part.text, logType);
            
            // Only parse line numbers if it's actually an error
            if (!isProgressBar) {
                const matches = [...part.text.matchAll(/File "\/main\.py", line (\d+)/g)];
                if (matches.length > 0) {
                    const lastMatch = matches[matches.length - 1];
                    setErrorLine(parseInt(lastMatch[1]));
                }
            }
          } else {
            // Standard Output
            addConsoleEntry(part.text, "output");
          }
        });
      },
      clearStdout: () => {
        setConsoleOutput([]);
        setPlotSrc(null);
      },
      focusTerminal: () => inputRef.current?.focus(),
    };
  }, [addConsoleEntry]);

  const runCode = async (codeString) => {
    if (isLoading || isRunning) return;
    setIsRunning(true);
    setErrorLine(null);
    setPlotSrc(null);
    addConsoleEntry(">>> Running...", "input");
    
    try {
      await runCodeTask(
        { input: codeString },
        (parts) => terminalRef.current.pushToStdout(parts),
        () => terminalRef.current.focusTerminal()
      );
      if (!waitingForInput) addConsoleEntry(">>> Completed", "system");
    } catch (err) {
      const errStr = err.toString();
      const isSystemExit = err.type === "SystemExit" || errStr.includes("SystemExit");
      const isInterrupt = err.type === "InterruptError" || errStr.includes("KeyboardInterrupt");

      if (isSystemExit) {
        addConsoleEntry(">>> Program exited", "system");
      } else if (!isInterrupt) {
        addConsoleEntry(errStr, "error");
      }
    } finally {
      if (!waitingForInput) setIsRunning(false);
    }
  };

  const stopCode = () => {
    taskClient.interrupt();
    setWaitingForInput(false);
    setIsRunning(false);
    addConsoleEntry(">>> Stopped by user", "system");
  };

  const submitInput = async (value) => {
    if (!waitingForInput) return;
    addConsoleEntry(value, "input");
    setWaitingForInput(false);
    await taskClient.writeMessage(value);
  };

  return {
    isLoading,
    isRunning,
    waitingForInput,
    consoleOutput,
    plotSrc,
    errorLine,
    inputRef,
    runCode,
    stopCode,
    submitInput,
    setConsoleOutput,
    clearConsole,
    setErrorLine
  };
}