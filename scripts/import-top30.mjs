import fs from 'fs';
import postgres from 'postgres';
import iconv from 'iconv-lite'; // 인코딩 처리를 위해 필요할 수 있음

// 연결 정보 (이미 .env에 등록된 정보 사용)
const sql = postgres(process.env.DATABASE_URL);

async function importData() {
  const filePath = 'C:\\Users\\지준원\\Documents\\카카오톡 받은 파일\\건축_기업_정보_Top30.csv';
  
  try {
    console.log('파일 읽는 중...');
    // 파일 읽기 (한글 인코딩 대응)
    const buffer = fs.readFileSync(filePath);
    // 보통 엑셀 저장 CSV는 CP949(EUC-KR)입니다.
    let content = iconv.decode(buffer, 'cp949');
    
    // 만약 깨진다면 UTF-8로 시도
    if (content.includes('')) {
      content = iconv.decode(buffer, 'utf8');
    }

    const rows = content.split('\n').filter(row => row.trim());
    const header = rows[0].split('\t'); // 탭 구분자 사용

    console.log(`총 ${rows.length - 1}개의 기업 데이터를 처리합니다...`);

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split('\t');
      if (values.length < 5) continue;

      // CSV 헤더 순서: 회사명(0) 순위(1) 시공능력평가액(2) 직원규모(3) 본사위치(4) 주요사업(5) 인재상(6) 모집직무(7) 필수요건(8) 우대요건(9) 경쟁력(10)
      const data = {
        name: values[0]?.trim(),
        rank: parseInt(values[1]) || 0,
        revenue: values[2]?.trim(), // 시공능력평가액을 매출액 컬럼에 저장
        employees: values[3]?.trim(),
        location: values[4]?.trim(),
        sector: values[5]?.trim() || '건설/건축', // 주요사업을 업종에 저장
        description: `[인재상] ${values[6] || ''}\n[모집직무] ${values[7] || ''}\n[필수요건] ${values[8] || ''}\n[우대요건] ${values[9] || ''}\n[경쟁력] ${values[10] || ''}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      try {
        await sql`
          INSERT INTO companies ${sql(data, 'name', 'rank', 'revenue', 'employees', 'location', 'sector', 'description', 'createdAt', 'updatedAt')}
          ON CONFLICT (name) DO UPDATE SET
            rank = EXCLUDED.rank,
            revenue = EXCLUDED.revenue,
            employees = EXCLUDED.employees,
            location = EXCLUDED.location,
            sector = EXCLUDED.sector,
            description = EXCLUDED.description,
            "updatedAt" = EXCLUDED."updatedAt"
        `;
        console.log(`[성공] ${data.name}`);
      } catch (err) {
        console.error(`[실패] ${data.name}:`, err.message);
      }
    }

    console.log('\n모든 데이터 입력이 완료되었습니다!');
  } catch (error) {
    console.error('오류 발생:', error.message);
  } finally {
    await sql.end();
  }
}

importData();
