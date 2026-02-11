// 测试 R2 连接的独立脚本
const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

async function testR2() {
  const config = {
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION || 'auto',
    bucket: process.env.STORAGE_BUCKET,
  };

  console.log('📋 R2 配置信息:');
  console.log('  Endpoint:', config.endpoint);
  console.log('  Region:', config.region);
  console.log('  Bucket:', config.bucket);
  console.log('  Access Key:', process.env.STORAGE_ACCESS_KEY ? '✅ 已配置' : '❌ 未配置');
  console.log('  Secret Key:', process.env.STORAGE_SECRET_KEY ? '✅ 已配置' : '❌ 未配置');
  console.log('');

  if (!config.endpoint || !config.bucket || !process.env.STORAGE_ACCESS_KEY || !process.env.STORAGE_SECRET_KEY) {
    console.error('❌ R2 配置不完整，请检查 .env.local');
    process.exit(1);
  }

  const s3 = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY,
      secretAccessKey: process.env.STORAGE_SECRET_KEY,
    },
  });

  // 测试 1: 检查存储桶是否存在
  console.log('🔍 测试 1: 检查存储桶...');
  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.bucket }));
    console.log('  ✅ 存储桶 "' + config.bucket + '" 存在且可访问');
  } catch (err) {
    console.error('  ❌ 存储桶检查失败:', err.message);
    process.exit(1);
  }

  // 测试 2: 上传测试文件
  console.log('📤 测试 2: 上传测试文件...');
  const testKey = `test/r2-test-${Date.now()}.txt`;
  const testContent = `R2 连接测试成功! 时间: ${new Date().toISOString()}`;
  
  try {
    await s3.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    }));
    console.log('  ✅ 文件上传成功!');
    console.log('  📁 Key:', testKey);
    
    const url = process.env.STORAGE_DOMAIN 
      ? `${process.env.STORAGE_DOMAIN}/${testKey}`
      : `${config.endpoint}/${config.bucket}/${testKey}`;
    console.log('  🔗 URL:', url);
  } catch (err) {
    console.error('  ❌ 文件上传失败:', err.message);
    process.exit(1);
  }

  console.log('');
  console.log('🎉 R2 存储连接测试全部通过！');
}

testR2().catch(console.error);
