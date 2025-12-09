const MAX_LOGS = 100;
const logs = [];

export const addLog = (type, args) => {
    const timestamp = new Date().toISOString();
    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    logs.push({ timestamp, type, message });
    if (logs.length > MAX_LOGS) {
        logs.shift();
    }
};

export const getLogs = () => {
    return logs;
};
