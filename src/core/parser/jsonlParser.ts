import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TokenEvent } from '../../shared/types';

const filePositions: Map<string, number> = new Map();

export function getClaudeLogPaths(): string[] {
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');
  const paths: string[] = [];

  const projectsDir = path.join(claudeDir, 'projects');
  if (fs.existsSync(projectsDir)) {
    findJsonlFiles(projectsDir, paths, 0);
  }

  return paths;
}

function findJsonlFiles(dir: string, results: string[], depth: number): void {
  if (depth > 4) return; // Prevent excessive recursion
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        results.push(fullPath);
      } else if (entry.isDirectory()) {
        findJsonlFiles(fullPath, results, depth + 1);
      }
    }
  } catch {
    // Skip inaccessible directories
  }
}

export async function parseTokenEvents(filePath: string, lastPosition?: number): Promise<TokenEvent[]> {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const stats = fs.statSync(filePath);
    const currentPosition = lastPosition ?? filePositions.get(filePath) ?? 0;

    if (stats.size <= currentPosition) {
      return [];
    }

    const stream = fs.createReadStream(filePath, {
      start: currentPosition,
      encoding: 'utf8'
    });

    const events: TokenEvent[] = [];
    let buffer = '';

    return new Promise((resolve) => {
      stream.on('data', (chunk) => {
        const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
        buffer += text;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = parseLine(line);
              if (event) {
                events.push(event);
              }
            } catch {
              // Skip invalid lines
            }
          }
        }
      });

      stream.on('end', () => {
        filePositions.set(filePath, stats.size);
        resolve(events);
      });

      stream.on('error', () => {
        resolve([]);
      });
    });
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return [];
  }
}

function sumUsageTokens(usage: Record<string, unknown>): number {
  let total = 0;
  total += Number(usage.input_tokens || 0);
  total += Number(usage.output_tokens || 0);
  total += Number(usage.cache_creation_input_tokens || 0);
  total += Number(usage.cache_read_input_tokens || 0);
  return total;
}

function parseLine(line: string): TokenEvent | null {
  try {
    const data = JSON.parse(line);

    // Check for message.usage format (Claude Code format)
    if (data.type === 'assistant' && data.message && data.message.usage) {
      const usage = data.message.usage;
      const tokens = sumUsageTokens(usage);
      if (tokens === 0) return null;
      const timestamp = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();

      return {
        type: 'output',
        tokens,
        timestamp,
        sessionId: data.sessionId
      };
    }

    // Check for direct usage object
    if (data.usage) {
      const tokens = sumUsageTokens(data.usage);
      if (tokens === 0) return null;
      return {
        type: 'output',
        tokens,
        timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
        sessionId: data.sessionId
      };
    }

    // Check for token counts at top level
    if (typeof data.input_tokens === 'number' || typeof data.output_tokens === 'number') {
      const tokens = sumUsageTokens(data);
      if (tokens === 0) return null;
      return {
        type: 'output',
        tokens,
        timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
        sessionId: data.sessionId
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function parseAllFiles(): Promise<TokenEvent[]> {
  const paths = getClaudeLogPaths();
  const allEvents: TokenEvent[] = [];

  for (const filePath of paths) {
    const events = await parseTokenEvents(filePath, 0);
    allEvents.push(...events);
  }

  return allEvents;
}

export function resetFilePositions(): void {
  filePositions.clear();
}

export function getClaudeUserInfo(): { email?: string; plan?: string } {
  try {
    const credentialsPath = path.join(os.homedir(), '.claude/.credentials.json');
    if (fs.existsSync(credentialsPath)) {
      const data = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      if (data.claudeAiOauth) {
        const oauth = data.claudeAiOauth;
        return {
          plan: oauth.subscriptionType || oauth.rateLimitTier || 'unknown'
        };
      }
    }
  } catch {
    // Ignore errors
  }
  return { plan: 'unknown' };
}
