import { execSync, spawn } from 'child_process';
import { existsSync, unlinkSync, statSync } from 'fs';

const SERVER = 'root@jiangjiang0123.cn';
const REMOTE_PATH = '/var/front-end/nuxt';
const LOCAL_OUTPUT = '.output';
const ARCHIVE_NAME = 'output.tar.gz';

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  brightGreen: '\x1b[92m',
  gray: '\x1b[90m',
};

function log(step: string, message: string, type: 'info' | 'success' | 'warn' = 'info') {
  const stepColor = colors.cyan;
  const msgColor = type === 'success' ? colors.green : type === 'warn' ? colors.yellow : colors.reset;
  console.log(`\n${stepColor}[${step}]${colors.reset} ${msgColor}${message}${colors.reset}`);
}

function exec(cmd: string, silent = false): string {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
    });
  } catch (error) {
    throw new Error(`命令执行失败: ${cmd}`);
  }
}

async function uploadWithProgress(localFile: string, remotePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileSize = statSync(localFile).size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    log('上传', `开始上传 ${ARCHIVE_NAME} (${fileSizeMB} MB) 到服务器...`, 'warn');

    // 使用 scp 上传，-o 选项启用压缩传输
    const scp = spawn('scp', ['-o', 'Compression=yes', localFile, `${SERVER}:${remotePath}`], {
      stdio: 'inherit',
      shell: true,
    });

    scp.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}✓ 上传完成 (${fileSizeMB} MB)${colors.reset}`);
        resolve();
      } else {
        reject(new Error(`SCP 上传失败，退出码: ${code}`));
      }
    });

    scp.on('error', (err) => {
      reject(err);
    });
  });
}

async function deploy() {
  const startTime = Date.now();

  try {
    // 步骤 1: 构建
    log('1/6', '执行 pnpm run build 构建项目...', 'warn');
    exec('pnpm run build');
    log('1/6', '✓ 构建完成', 'success');

    // 检查 .output 目录是否存在
    if (!existsSync(LOCAL_OUTPUT)) {
      throw new Error('.output 目录不存在，构建可能失败');
    }

    // 步骤 2: 压缩
    log('2/6', '压缩 .output 目录内容...', 'warn');
    exec(`tar -czf ${ARCHIVE_NAME} -C ${LOCAL_OUTPUT} .`);
    const archiveSize = (statSync(ARCHIVE_NAME).size / 1024 / 1024).toFixed(2);
    log('2/6', `✓ 压缩完成，文件大小: ${archiveSize} MB`, 'success');

    // 步骤 3: 清理服务器目录
    log('3/6', '清理服务器目录...', 'warn');
    exec(`ssh ${SERVER} "rm -rf ${REMOTE_PATH}/* && mkdir -p ${REMOTE_PATH}"`, true);
    log('3/6', '✓ 服务器目录已清理', 'success');

    // 步骤 4: 上传
    log('4/6', '上传压缩文件到服务器...', 'warn');
    await uploadWithProgress(ARCHIVE_NAME, REMOTE_PATH);
    log('4/6', '✓ 上传完成', 'success');

    // 步骤 5: 解压并清理
    log('5/6', '服务器解压文件并清理...', 'warn');
    exec(`ssh ${SERVER} "cd ${REMOTE_PATH} && tar -xzf ${ARCHIVE_NAME} && rm -f ${ARCHIVE_NAME}"`, true);
    log('5/6', '✓ 服务器解压完成，已删除压缩文件', 'success');

    // 清理本地压缩文件
    if (existsSync(ARCHIVE_NAME)) {
      unlinkSync(ARCHIVE_NAME);
      console.log(`${colors.gray}本地压缩文件已删除${colors.reset}`);
    }

    // 步骤 6: 重启服务
    log('6/6', '重启 PM2 服务...', 'warn');
    exec(`ssh ${SERVER} "pm2 reload \\"nuxt前端\\""`, true);
    log('6/6', '✓ PM2 服务已重启', 'success');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${colors.brightGreen}========================================`);
    console.log(`🎉 部署成功! 总耗时: ${duration} 秒`);
    console.log(`========================================${colors.reset}\n`);
  } catch (error) {
    // 清理本地压缩文件
    if (existsSync(ARCHIVE_NAME)) {
      unlinkSync(ARCHIVE_NAME);
    }
    console.error(`\n${colors.red}✗ 部署失败:${colors.reset}`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

deploy();
