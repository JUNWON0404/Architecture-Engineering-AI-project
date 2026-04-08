import fs from 'fs';
import postgres from 'postgres';
import iconv from 'iconv-lite';

// Supabase 연결 (환경 변수 사용)
const sql = postgres('postgresql://postgres:FtgqdeAhnLWRGME8@db.glouiysqkbjuaylpggba.supabase.co:5432/postgres', {
  prepare: false, // Supabase와 같은 연결 풀러(PGBouncer) 사용 시 필수
});

async function run() {
  const filePath = 'C:\\Users\\지준원\\Documents\\카카오톡 받은 파일\\건축_기업_정보_Top30.csv';
  
  try {
    console.log('1. 파일 읽기 시작...');
    const buffer = fs.readFileSync(filePath);
    const content = iconv.decode(buffer, 'cp949');
    const rows = content.split('\n').filter(r => r.trim());
    
    console.log(`2. 총 ${rows.length - 1}개의 데이터를 발견했습니다.`);

    for (let i = 1; i < rows.length; i++) {
      const delimiter = rows[i].includes('\t') ? '\t' : ',';
      const v = rows[i].split(delimiter).map(s => s.replace(/^"|"$/g, '').trim());

      if (v.length < 2) continue;

      const companyData = {
        name: v[0],
        rank: parseInt(v[1]) || 0,
        revenue: v[2] || '',
        employees: v[3] || '',
        location: v[4] || '',
        sector: v[5] || '건축/건설',
        description: `인재상: ${v[6] || ''}\n모집직무: ${v[7] || ''}\n자격요건: ${v[8] || ''}\n우대사항: ${v[9] || ''}\n경쟁력: ${v[10] || ''}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // DB에 직접 입력 (중복 시 업데이트)
      await sql`
        INSERT INTO companies (name, rank, revenue, employees, location, sector, description, "createdAt", "updatedAt")
        VALUES (
          ${companyData.name}, ${companyData.rank}, ${companyData.revenue}, 
          ${companyData.employees}, ${companyData.location}, ${companyData.sector}, 
          ${companyData.description}, ${companyData.createdAt}, ${companyData.updatedAt}
        )
        ON CONFLICT (name) DO UPDATE SET
          rank = EXCLUDED.rank,
          revenue = EXCLUDED.revenue,
          employees = EXCLUDED.employees,
          location = EXCLUDED.location,
          sector = EXCLUDED.sector,
          description = EXCLUDED.description,
          "updatedAt" = EXCLUDED."updatedAt"
      `;
      console.log(`[${i}/${rows.length-1}] 완료: ${companyData.name}`);
    }

    console.log('3. 모든 데이터 입력 성공!');
    const finalCount = await sql`SELECT count(*) FROM companies`;
    console.log('현재 DB 총 기업 수:', finalCount[0].count);

  } catch (err) {
    console.error('오류 발생:', err.message);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

run();
