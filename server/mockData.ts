export const MOCK_COMPANIES = [
  {
    id: 1,
    name: '삼성물산(건설부문)',
    established: 1970,
    sector: '건축, 토목, 플랜트, 주택(래미안)',
    location: '서울 강동구 상일로6길 26',
    employees: '9,500명',
    revenue: '31조 8,536억',
    description: '인재상: 창의, 성실, 도전, 전문성\n모집직무: 건축, 토목, 플랜트, IT, 안전, 경영지원',
    createdAt: 1712534400000,
    updatedAt: 1712534400000,
  },
  {
    id: 2,
    name: '현대건설',
    established: 1947,
    sector: '주택(힐스테이트), 플랜트, 인프라, 원자력',
    location: '서울 종로구 율곡로 75',
    employees: '6,500명',
    revenue: '17조 9,436억',
    description: '인재상: 정주영 정신, 도전적 실행, 창의적 사고\n모집직무: 건축, 토목, 플랜트, 전력, R&D',
    createdAt: 1712534400000,
    updatedAt: 1712534400000,
  }
];

export const MOCK_JOB_POSTINGS = [
  {
    id: 1,
    companyId: 1,
    title: '토목기술(석사)',
    position: '신입',
    description: '토목공학 전공자 모집, 대형 인프라 프로젝트 참여',
    requiredMajors: JSON.stringify(['토목공학', '건설공학']),
    salary: '3,500만원~4,200만원',
    location: '서울, 지방',
    postedAt: 1712534400000,
    deadline: 1715126400000,
    isActive: 1,
    createdAt: 1712534400000,
    updatedAt: 1712534400000,
  }
];
