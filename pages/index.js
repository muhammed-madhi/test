import { useState, useMemo } from 'react';

const STAGES = ['PRIMARY','MIDDLE','HIGH','UNIVERSITY'];
const CERT_SCHOOL = ['PRIMARY','MIDDLE','HIGH'];
const CERT_UNI = ['BACHELOR','MASTER','PHD'];

const stageLabel = { PRIMARY:'ابتدائي', MIDDLE:'متوسط', HIGH:'ثانوي', UNIVERSITY:'جامعة' };
const typeLabel  = { PRIMARY:'ابتدائي', MIDDLE:'متوسط', HIGH:'ثانوي', BACHELOR:'بكالوريوس', MASTER:'ماجستير', PHD:'دكتوراه' };

export default function Home() {
  const [fullName, setFullName] = useState('');
  const [stage, setStage] = useState('');
  const [grade, setGrade] = useState('');
  const [ctype, setCtype] = useState('');
  const [year, setYear] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const allowedTypes = useMemo(() => {
    if (!stage) return [];
    return stage === 'UNIVERSITY' ? CERT_UNI : CERT_SCHOOL;
  }, [stage]);

  const allowedGrades = useMemo(() => {
    if (stage === 'PRIMARY') return Array.from({length:6}, (_,i)=>i+1);
    if (stage === 'MIDDLE' || stage === 'HIGH') return [1,2,3];
    return [];
  }, [stage]);

  // إذا النوع الحالي صار غير صالح بعد تغيير المرحلة → صفّره
  if (ctype && !allowedTypes.includes(ctype)) {
    setCtype('');
  }
  // إذا المرحلة جامعة والدرجة موجودة → صفّره
  if (stage === 'UNIVERSITY' && grade) {
    setGrade('');
  }

  const submitForm = async (e) => {
    e.preventDefault();
    setMsg(null);

    // تحققات أساسية (مطابقة للمتطلبات)
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length < 3) return setMsg({err:'الاسم يجب أن يكون ثلاثيًا على الأقل.'});
    if (!stage) return setMsg({err:'اختر المرحلة.'});
    if (!ctype) return setMsg({err:'اختر نوع الشهادة.'});
    if (stage !== 'UNIVERSITY' && !grade) return setMsg({err:'اختر الصف.'});
    if (!/^\d{4}$/.test(year) || Number(year) < 2021) return setMsg({err:'سنة التخرج يجب أن تكون 2021 أو أحدث.'});
    if (!file) return setMsg({err:'الرجاء اختيار ملف الشهادة.'});
    const ok = ['application/pdf','image/jpeg','image/png'];
    if (!ok.includes(file.type)) return setMsg({err:'الملف يجب أن يكون PDF أو JPG أو PNG.'});
    if (file.size > 10*1024*1024) return setMsg({err:'حجم الملف يتجاوز 10MB.'});

    const form = new FormData();
    form.set('full_name', fullName.trim().replace(/\s+/g,' '));
    form.set('stage_track', stage);
    if (stage !== 'UNIVERSITY') form.set('stage_grade', String(grade));
    form.set('certificate_type', ctype);
    form.set('graduation_year', year);
    form.set('certificate_file', file);

    setLoading(true);
    try {
      const res = await fetch('/api/submit', { method:'POST', body:form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'تعذّر الإرسال');
      setMsg({ok:`تم الحفظ ✅ — المعرّف: ${data.id}`});
    } catch (err) {
      setMsg({err: err.message || 'خطأ غير متوقع'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" lang="ar" style={styles.page}>
      {/* الشعار (من public/logo.png) في زاوية البداية */}
      <img src="/logo.png" alt="الشعار" style={styles.logo} />

      {/* الحاوية بالنص */}
      <main style={styles.card}>
        <h1 style={styles.title}>حياكم الله!</h1>

        <form onSubmit={submitForm}>
          <label style={styles.label}>الاسم الثلاثي</label>
          <input style={styles.input} type="text" value={fullName}
                 onChange={(e)=>setFullName(e.target.value)} placeholder="مثال: محمد أحمد العبدالله" required/>

          <label style={styles.label}>المرحلة العلمية</label>
          <select style={styles.input} value={stage} onChange={(e)=>setStage(e.target.value)} required>
            <option value="">اختر المرحلة</option>
            {STAGES.map(s => <option key={s} value={s}>{stageLabel[s]}</option>)}
          </select>

          {(stage && stage !== 'UNIVERSITY') && (
            <>
              <label style={styles.label}>الصف</label>
              <select style={styles.input} value={grade} onChange={(e)=>setGrade(e.target.value)} required>
                <option value="">اختر الصف</option>
                {allowedGrades.map(g => (
                  <option key={g} value={g}>
                    {stage==='PRIMARY' ? ['أولى','ثاني','ثالث','رابع','خامس','سادس'][g-1] : ['أولى','ثاني','ثالث'][g-1]}
                  </option>
                ))}
              </select>
            </>
          )}

          <label style={styles.label}>نوع الشهادة</label>
          <select style={styles.input} value={ctype} onChange={(e)=>setCtype(e.target.value)} required disabled={!stage}>
            <option value="">{stage ? 'اختر نوع الشهادة' : 'اختر المرحلة أولاً'}</option>
            {allowedTypes.map(t => <option key={t} value={t}>{typeLabel[t]}</option>)}
          </select>

          <label style={styles.label}>سنة التخرج</label>
          <input style={styles.input} type="number" value={year}
                 onChange={(e)=>setYear(e.target.value)} placeholder="2023" required/>

          <label style={styles.label}>رفع الملف (حتى 10MB — PDF/JPG/PNG)</label>
          <input style={styles.file} type="file" accept=".pdf,.jpg,.jpeg,.png"
                 onChange={(e)=>setFile(e.target.files?.[0] || null)} required/>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'جارٍ الإرسال…' : 'إرسال'}
          </button>

          {msg?.err && <div style={styles.error}>{msg.err}</div>}
          {msg?.ok &&  <div style={styles.success}>{msg.ok}</div>}
        </form>
      </main>
    </div>
  );
}

const styles = {
  page:{
    minHeight:'100vh',
    background:'#E8F3EC', /* brand tint */
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'40px 12px', fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial'
  },
  logo:{ position:'fixed', top:16, insetInlineStart:16, height:48 },
  card:{
    width:'100%', maxWidth:540, background:'#fff', borderRadius:12,
    boxShadow:'0 6px 24px rgba(0,0,0,0.06)', padding:20
  },
  title:{ margin:'8px 0 20px', textAlign:'center', fontSize:28, fontWeight:800, color:'#0F172A' },
  label:{ display:'block', margin:'10px 0 6px', color:'#0F172A', fontWeight:600 },
  input:{
    width:'100%', padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:10, background:'#fff',
    marginBottom:10, fontSize:16
  },
  file:{ width:'100%', margin:'6px 0 14px' },
  button:{
    width:'100%', padding:'12px 16px', background:'#0A7E3B', color:'#fff',
    border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer'
  },
  error:{ marginTop:12, color:'#b00020', fontWeight:600 },
  success:{ marginTop:12, color:'#075F2C', fontWeight:700 }
};
