const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const commits = git('rev-list', '--all').trim().split(/\s+/).filter(Boolean);
const patterns = '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16}|sk-proj-[A-Za-z0-9_-]{40,}';
const candidates = [];
for (const commit of commits) {
  try {
    const paths = git('grep', '-I', '-l', '-E', '-e', patterns, commit).trim();
    if (paths) candidates.push(...paths.split('\n'));
  } catch (error) { if (error.status !== 1) throw error; }
}
const envHistory = git('log', '--all', '--format=%h', '--', '.env', '**/.env').trim();
const report = {
  checkedAt: new Date().toISOString(), commits: commits.length,
  patterns: 'Private-key headers, GitHub classic tokens, AWS access-key IDs, OpenAI project keys',
  candidatePaths: candidates, envHistoryCommits: envHistory ? envHistory.split('\n') : [],
  limitations: 'Pattern-based check, not proof of absence of custom passwords/tokens. Only reachable local Git history. Example/test credentials require manual review.',
};
fs.writeFileSync('docs/evidence/secret-history-scan.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ commits: commits.length, candidates: candidates.length, envCommits: report.envHistoryCommits.length }));
