
import qz from 'qz-tray';
import api from '../services/API/api';

let connectPromise = null;

function configureSecurity() {
  qz.security.setCertificatePromise((resolve, reject) => {
    api
      .get('/print/cert', { responseType: 'text' })
      .then((res) => resolve(res.data))
      .catch(reject);
  });

  qz.security.setSignatureAlgorithm('SHA512');

  qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
    api
      .post(
        '/print/sign',
        { request: toSign },
        { responseType: 'text' }
      )
      .then((res) => resolve(res.data))
      .catch(reject);
  });
}

async function ensureConnected() {
  if (qz.websocket.isActive()) return;

  if (!connectPromise) {
    configureSecurity();
    connectPromise = qz.websocket.connect().catch((err) => {
      connectPromise = null;
      if (String(err?.message || err).includes('already exists')) {
        return; // another caller's connection beat us to it — fine
      }
      throw err;
    });
  }

  await connectPromise;
}

function getPrinterStatus(printerName, timeoutMs = 2500) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (status) => {
      if (settled) return;
      settled = true;
      resolve(status);
    };

    qz.printers.setPrinterCallbacks((evt) => {
      if (evt.printerName === printerName) finish(evt);
    });

    qz.printers
      .startListening(printerName)
      .then(() => qz.printers.getStatus())
      .catch(() => finish(null));

    setTimeout(() => finish(null), timeoutMs);
  });
}

async function assertPrinterOnline(printerName) {
  const status = await getPrinterStatus(printerName);
  if (status?.severity === 'FATAL') {
    throw new Error(`Printer "${printerName}" is offline or unreachable (${status.status || status.eventType}).`);
  }
}


export async function printZpl(zpl, printerName) {
  if (!printerName) throw new Error('printerName is required');
  await ensureConnected();
  await assertPrinterOnline(printerName);

  const config = qz.configs.create(printerName);
  await qz.print(config, [{ type: 'raw', format: 'plain', data: zpl }]);
}

export async function printZplRowsChunked(rows, printerName, opts = {}) {
  const { chunkRows = 40, onProgress, isCancelled } = opts;
  if (!printerName) throw new Error('printerName is required');
  if (!rows?.length) return { sentIds: [], cancelled: false };

  await ensureConnected();
  await assertPrinterOnline(printerName);

  const config = qz.configs.create(printerName);
  const sentIds = [];

  for (let i = 0; i < rows.length; i += chunkRows) {
    if (isCancelled?.()) {
      return { sentIds, cancelled: true };
    }

    const rowChunk = rows.slice(i, i + chunkRows);
    const zpl = rowChunk.map((r) => r.zpl).join('\n');
    await qz.print(config, [{ type: 'raw', format: 'plain', data: zpl }]);

    const chunkIds = rowChunk.flatMap((r) => r.ids);
    sentIds.push(...chunkIds);
    onProgress?.(chunkIds, sentIds.length, rows.length);
  }

  return { sentIds, cancelled: false };
}

export async function clearPrinterQueue(printerName) {
  if (!printerName) throw new Error('printerName is required');
  await ensureConnected();
  await qz.printers.clearQueue({ printerName });
}

/** For a printer-picker UI, if you want the user to choose a target. */
export async function listPrinters() {
  await ensureConnected();
  return qz.printers.find();
}

export async function disconnectQz() {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect();
  }
  connectPromise = null;
}