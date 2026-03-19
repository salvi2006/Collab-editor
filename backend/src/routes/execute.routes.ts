import { Router } from 'express';
import axios from 'axios';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execPromise = util.promisify(exec);
const router = Router();

router.post('/', async (req, res) => {
  const { language, sourceCode, version } = req.body;
  
  if (!language || !sourceCode) {
    return res.status(400).json({ error: 'Language and source code are required' });
  }

  try {
    const pistonRes = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language,
      version: version || "*",
      files: [{ name: "main", content: sourceCode }]
    });

    if (pistonRes.data?.message?.includes('whitelist only')) {
      throw new Error('whitelist only');
    }

    return res.json(pistonRes.data);
  } catch (error: any) {
    const errorData = error?.response?.data || {};
    const errorMessage = errorData.message || error.message || '';

    // Fallback if Piston API is blocked/whitelist-only
    if (errorMessage.includes('whitelist') || error?.response?.status === 403 || error?.response?.status === 400 || error?.response?.status === 401) {
      const lang = language.toLowerCase();
      
      if (lang === 'javascript' || lang === 'js' || lang === 'node') {
        const tmpFile = path.join(os.tmpdir(), `exec-${Date.now()}.js`);
        try {
          await fs.writeFile(tmpFile, sourceCode);
          const { stdout, stderr } = await execPromise(`node "${tmpFile}"`, { timeout: 5000 });
          await fs.unlink(tmpFile).catch(() => {});
          return res.json({ run: { output: stdout || stderr || '\n' } });
        } catch (localErr: any) {
          await fs.unlink(tmpFile).catch(() => {});
          return res.json({ run: { output: localErr.stderr || localErr.stdout || localErr.message || 'Execution failed.' } });
        }
      } else if (lang === 'python' || lang === 'py') {
        const tmpFile = path.join(os.tmpdir(), `exec-${Date.now()}.py`);
        try {
          await fs.writeFile(tmpFile, sourceCode);
          const { stdout, stderr } = await execPromise(`python "${tmpFile}"`, { timeout: 5000 });
          await fs.unlink(tmpFile).catch(() => {});
          return res.json({ run: { output: stdout || stderr || '\n' } });
        } catch (localErr: any) {
          await fs.unlink(tmpFile).catch(() => {});
          return res.json({ run: { output: localErr.stderr || localErr.stdout || localErr.message || 'Execution failed.' } });
        }
      }
      
      return res.json({ 
        run: { 
          output: `[System Alert]: The public Piston API is now whitelist-only.\n[Fallback Alert]: Cannot locally execute '${language}'. Native fallback currently supported for JavaScript and Python only within this demo.\n`
        } 
      });
    }

    console.error('Piston Execution Error', errorData);
    res.status(500).json({ 
      error: 'Execution failed', 
      details: errorMessage 
    });
  }
});

export default router;
