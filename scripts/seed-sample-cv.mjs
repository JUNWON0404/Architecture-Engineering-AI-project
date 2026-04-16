
import "dotenv/config";
import postgres from "postgres";

async function seedSampleData() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    // 1. 첫 번째 사용자 찾기 (Raw SQL)
    const users = await sql`SELECT id, email FROM users LIMIT 1`;
    if (users.length === 0) {
      console.error("사용자가 없습니다. 먼저 회원가입을 해주세요.");
      return;
    }
    const user = users[0];
    console.log(`사용자 확인: ${user.email} (ID: ${user.id})`);

    const now = Date.now();
    const experiences = [
      {
        id: "exp_1",
        type: "intern",
        title: "OO건설 현장실습 (시공관리)",
        period: "2025.01 - 2025.02",
        role: "시공 관리 보조",
        keyAction: "현장 일일 안전 점검 및 도면 검토 보조. 마감 공정에서 벽체 수직도 오차를 발견하여 선제적 대응 건의.",
        result: "재시공 비용 약 500만 원 절감 및 현장 소장님 표창",
        learned: "현장에서의 '디테일'이 품질과 원가를 결정한다는 것을 배움"
      },
      {
        id: "exp_2",
        type: "project",
        title: "BIM 기반 스마트 건축 설계 프로젝트",
        period: "2024.09 - 2024.12",
        role: "BIM 모델링 및 간섭 체크 팀장",
        keyAction: "Revit을 활용하여 구조와 설비 간의 간섭 20여 건을 사전 발견하고 대안 제시.",
        result: "교내 캡스톤 디자인 경진대회 은상 수상",
        learned: "사전 시뮬레이션을 통한 리스크 관리의 중요성 체득"
      }
    ];

    const keyStory = `[S] 건축시공학 전공 프로젝트 중, 모듈러 공법을 적용한 소형 주택 설계 과제를 수행했습니다.
[T] 부재 간 결합 부위의 오차로 인해 구조적 안정성 확보에 어려움이 있었습니다.
[A] 저는 실제 현장 사례 10여 건을 분석하여 '슬라이딩 조인트' 방식을 제안하고, 이를 3D 시뮬레이션으로 검증했습니다.
[R] 최종 발표에서 실제 시공 가능성이 가장 높다는 평가를 받으며 A+ 학점을 기록했습니다.`;

    const sampleData = {
      userId: user.id,
      title: "나의 건설 마스터 초안 (샘플)",
      company: "현대건설",
      position: "건축 시공",
      major: "건축공학",
      gpa: "4.2 / 4.5",
      certifications: "건축기사, 건설안전기사, 토익 850",
      majorCourses: "건축시공학, 구조역학, BIM 통합설계, 건설관리학",
      experience: JSON.stringify(experiences),
      keyStory: keyStory,
      content: "이 문장은 샘플 데이터입니다. Step 4에서 AI 생성 버튼을 누르면 이 내용이 실제 AI가 작성한 초안으로 바뀝니다.",
      isMaster: 1,
      status: "draft",
      createdAt: now,
      updatedAt: now
    };

    // 기존 마스터 자소서 해제
    await sql`UPDATE cover_letters SET "isMaster" = 0 WHERE "userId" = ${user.id}`;

    // 샘플 데이터 삽입 (CamelCase 컬럼명은 큰따옴표 필수)
    await sql`
      INSERT INTO cover_letters (
        "userId", "title", "company", "position", "major", "gpa", "certifications", 
        "majorCourses", "experience", "keyStory", "content", "isMaster", "status", 
        "createdAt", "updatedAt"
      ) VALUES (
        ${user.id}, ${sampleData.title}, ${sampleData.company}, ${sampleData.position}, 
        ${sampleData.major}, ${sampleData.gpa}, ${sampleData.certifications}, 
        ${sampleData.majorCourses}, ${sampleData.experience}, ${sampleData.keyStory}, 
        ${sampleData.content}, ${sampleData.isMaster}, ${sampleData.status}, 
        ${sampleData.createdAt}, ${sampleData.updatedAt}
      )
    `;

    console.log("✅ 샘플 데이터 주입 완료!");
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await sql.end();
  }
}

seedSampleData();
