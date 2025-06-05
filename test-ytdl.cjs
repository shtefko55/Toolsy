const { spawn } = require('child_process');

console.log('🧪 Testing yt-dlp directly...');

const url = 'https://www.youtube.com/watch?v=2wBiVh3kumY';

const ytdlArgs = [
  '--verbose',
  '--no-mtime',
  '--no-playlist',
  '--extractor-retries', '3',
  '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  '--socket-timeout', '60',
  '--retries', '3',
  '-f', 'best[height<=360]',
  '-o', '/tmp/test_%(id)s.%(ext)s',
  url
];

console.log('🔧 Command:', 'yt-dlp', ytdlArgs.join(' '));

const process = spawn('yt-dlp', ytdlArgs);

process.stdout.on('data', (data) => {
  console.log('📊 STDOUT:', data.toString());
});

process.stderr.on('data', (data) => {
  console.error('❌ STDERR:', data.toString());
});

process.on('close', (code) => {
  console.log(`🏁 Process exited with code: ${code}`);
});

process.on('error', (err) => {
  console.error('💥 Process error:', err);
}); 