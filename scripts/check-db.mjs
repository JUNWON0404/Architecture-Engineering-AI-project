import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../db.sqlite");
const db = new Database(dbPath);

// 테이블 조회
console.log("📊 데이터베이스 상태:\n");

const companiesCount = db.prepare("SELECT COUNT(*) as count FROM companies;").get();
console.log(`✓ 등록된 회사: ${companiesCount.count}개`);

const jobsCount = db.prepare("SELECT COUNT(*) as count FROM job_postings;").get();
console.log(`✓ 등록된 채용공고: ${jobsCount.count}개`);

// 회사 목록 조회
console.log("\n📋 회사 목록:");
const companies = db.prepare("SELECT id, name, sector FROM companies ORDER BY id;").all();
companies.forEach(company => {
  console.log(`  [${company.id}] ${company.name} (${company.sector})`);
});

// 채용공고 목록 조회
console.log("\n📢 채용공고:");
const jobs = db.prepare(`
  SELECT j.id, j.title, c.name as company_name 
  FROM job_postings j 
  JOIN companies c ON j.companyId = c.id 
  ORDER BY j.id
`).all();
jobs.forEach(job => {
  console.log(`  [${job.id}] ${job.title} (${job.company_name})`);
});

// 테이블 구조 확인
console.log("\n🏗️ 테이블 목록:");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
tables.forEach(table => {
  console.log(`  - ${table.name}`);
});

db.close();
