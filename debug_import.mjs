import fs from 'fs';
import postgres from 'postgres';
import iconv from 'iconv-lite';

const sql = postgres(process.env.DATABASE_URL);

async function checkAndImport() {
  const filePath = 'C:\\Users\\지준원\\Documents\\카카오톡 받은 파일\\건축_기업_정보_Top30.csv';
  
  try {
    console.log('--- 데이터 입력 시작 ---');
    console.log('파일 경로:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('파일이 존재하지 않습니다!');
      return;
    }

    const buffer = fs.readFileSync(filePath);
    let content = iconv.decode(buffer, 'cp949');
    
    // 첫 줄 확인
    const rows = content.split('\n').filter(r => r.trim());
    console.log('첫 줄(헤더):', rows[0]);
    console.log('총 발견된 데이터 줄 수:', rows.length - 1);

    if (rows.length <= 1) {
      console.error('데이터가 발견되지 않았습니다. 인코딩이나 줄바꿈을 확인하세요.');
      return;
    }

    for (let i = 1; i < rows.length; i++) {
      // 탭 또는 쉼표 구분자 자동 감지
      const delimiter = rows[i].includes('\t') ? '\t' : ',';
      const values = rows[i].split(delimiter).map(v => v.replace(/^"|"$/g, '').trim());

      if (values.length < 2 || !values[0]) continue;

      const data = {
        name: values[0],
        rank: parseInt(values[1]) || 0,
        revenue: values[2] || '',
        employees: values[3] || '',
        location: values[4] || '',
        sector: values[5] || '건축/건설',
        description: `인재상: ${values[6] || ''}\n모집직무: ${values[7] || ''}\n필수: ${values[8] || ''}\n우대: ${values[9] || ''}\n경쟁력: ${values[10] || ''}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

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
      console.log(`[입력됨] ${data.name}`);
    }

    const count = await sql`SELECT count(*) FROM companies`;
    console.log('--- 입력 완료 ---');
    console.log('DB에 저장된 최종 기업 수:', count[0].count);

  } catch (error) {
    console.error('오류 발생:', error.message);
  } finally {
    await sql.end();
  }
}

checkAndImport();
