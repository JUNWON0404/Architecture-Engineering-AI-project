import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../db.sqlite");
const db = new Database(dbPath);

// 테스트 건설 기업 데이터
const companies = [
  {
    name: "현대건설",
    sector: "건설",
    established: 1947,
    employees: "5,000~10,000",
    revenue: "5조원대",
    location: "서울시 강남구",
    description: "국내 최대 건설사, 대형 프로젝트 전문",
    website: "https://www.hdec.kr",
  },
  {
    name: "삼성물산 건설부문",
    sector: "건설",
    established: 1938,
    employees: "3,000~5,000",
    revenue: "4조원대",
    location: "서울시 영등포구",
    description: "초고층 건축, 해외 프로젝트 전문",
    website: "https://www.samsungc.com",
  },
  {
    name: "GS건설",
    sector: "건설",
    established: 1968,
    employees: "2,000~3,000",
    revenue: "2조원대",
    location: "서울시 종로구",
    description: "주택, 상업용 건설 전문",
    website: "https://www.gsconstruction.co.kr",
  },
  {
    name: "롯데건설",
    sector: "건설",
    established: 1973,
    employees: "2,000+",
    revenue: "1.5조원대",
    location: "서울시 중구",
    description: "아파트, 상업시설 건설 전문",
    website: "https://www.lottenc.co.kr",
  },
  {
    name: "대우건설",
    sector: "건설",
    established: 1968,
    employees: "1,500~2,000",
    revenue: "1조원대",
    location: "서울시 강서구",
    description: "플랜트, 토목 건설 전문",
    website: "https://www.daewooc.co.kr",
  },
  {
    name: "포스코건설",
    sector: "건설",
    established: 1994,
    employees: "1,000~1,500",
    revenue: "8,000억원대",
    location: "인천시 남동구",
    description: "철강, 플랜트, 공기업 프로젝트 전문",
    website: "https://www.poscoenc.com",
  },
  {
    name: "현대E&C",
    sector: "건설",
    established: 1967,
    employees: "1,500+",
    revenue: "1.2조원대",
    location: "서울시 강남구",
    description: "엔지니어링, 플랜트 건설 전문",
    website: "https://www.hdec.co.kr",
  },
  {
    name: "SK건설",
    sector: "건설",
    established: 1975,
    employees: "800~1,000",
    revenue: "5,000억원대",
    location: "서울시 중림동",
    description: "주택, 인프라 건설 전문",
    website: "https://www.skec.co.kr",
  },
];

// 회사 데이터 삽입
const now = Date.now();
companies.forEach((company) => {
  try {
    db.prepare(`
      INSERT INTO companies 
      (name, sector, established, employees, revenue, location, description, website, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      company.name,
      company.sector,
      company.established,
      company.employees,
      company.revenue,
      company.location,
      company.description,
      company.website,
      now,
      now
    );
    console.log(`✓ ${company.name} 추가됨`);
  } catch (error) {
    console.error(`✗ ${company.name} 추가 실패:`, error.message);
  }
});

// 의도적 샘플 채용공고 ( 현대건설, 삼성물산용)
const jobPostings = [
  {
    companyId: 1,
    title: "토목기술(석사)",
    position: "신입",
    description: "토목공학 전공자 모집, 대형 인프라 프로젝트 참여",
    requiredMajors: JSON.stringify(["토목공학", "건설공학"]),
    salary: "3,500만원~4,200만원",
    location: "서울, 지방",
    deadline: now + 30 * 24 * 60 * 60 * 1000,
  },
  {
    companyId: 2,
    title: "건축설계 신입사원",
    position: "신입",
    description: "초고층 건축물 설계 참여",
    requiredMajors: JSON.stringify(["건축학", "건축공학"]),
    salary: "3,500만원~4,000만원",
    location: "서울",
    deadline: now + 25 * 24 * 60 * 60 * 1000,
  },
];

jobPostings.forEach((job) => {
  try {
    db.prepare(`
      INSERT INTO job_postings 
      (companyId, title, position, description, requiredMajors, salary, location, postedAt, deadline, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      job.companyId,
      job.title,
      job.position,
      job.description,
      job.requiredMajors,
      job.salary,
      job.location,
      now,
      job.deadline,
      1,
      now,
      now
    );
    console.log(`✓ 채용공고: ${job.title} 추가됨`);
  } catch (error) {
    console.error(`✗ 채용공고: ${job.title} 추가 실패:`, error.message);
  }
});

console.log("\n✅ 데이터 추가 완료!");
db.close();
