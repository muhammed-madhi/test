import { useState, useMemo, useEffect } from 'react';

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
    if (stage === 'PRIMARY') return [1,2,3,4,5,6];
    if (stage === 'MIDDLE' || stage === 'HIGH') return [1,2,3];
    return [];
  }, [stage]);

  useEffect(() => {
    if (ctype && !allowedTypes.includes(ctype)) setCtype('');
  }, [ctype, allowedTypes]);

  useEffect(() => {
    if (stage === 'UNIVERSITY' && grade) setGrade('');
  }, [stage, grade]);

  const submitForm = async (e) => {
    e.preventDefault();
    setMsg(null);

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
    <div dir="rtl" lang="ar" className="page">
      {/* الشعار من public/IMG_7618.jpeg */}
      <div className="logoWrap">
        <img src="/IMG_7618.jpeg" alt="الشعار" className="logo" />
      </div>

      <main className="card">
        <h1 className="title">حياكم الله!</h1>

        <form onSubmit={submitForm}>
          <label className="label">الاسم الثلاثي</label>
          <input
            className="input input-sm"
            type="text"
            value={fullName}
            onChange={(e)=>setFullName(e.target.value)}
            placeholder="مثال: محمد أحمد العبدالله"
            maxLength={60}
            required
          />

          <label className="label">المرحلة العلمية</label>
          <select className="input input-sm" value={stage} onChange={(e)=>setStage(e.target.value)} required>
            <option value="">اختر المرحلة</option>
            {STAGES.map(s => <option key={s} value={s}>{stageLabel[s]}</option>)}
          </select>

          {(stage && stage !== 'UNIVERSITY') && (
            <>
              <label className="label">الصف</label>
              <select className="input input-sm" value={grade} onChange={(e)=>setGrade(e.target.value)} required>
                <option value="">اختر الصف</option>
                {allowedGrades.map(g => (
                  <option key={g} value={g}>
                    {stage==='PRIMARY' ? ['أولى','ثاني','ثالث','رابع','خامس','سادس'][g-1] : ['أولى','ثاني','ثالث'][g-1]}
                  </option>
                ))}
              </select>
            </>
          )}

          <label className="label">نوع الشهادة</label>
          <select className="input input-sm" value={ctype} onChange={(e)=>setCtype(e.target.value)} required disabled={!stage}>
            <option value="">{stage ? 'اختر نوع الشهادة' : 'اختر المرحلة أولاً'}</option>
            {(stage ? (stage==='UNIVERSITY'?CERT_UNI:CERT_SCHOOL) : []).map(t =>
              <option key={t} value={t}>{typeLabel[t]}</option>
            )}
          </select>

          <div className="row">
            <label className="label label-inline">سنة التخرج</label>
            <input
              className="input input-sm input-year"
              type="number"
              inputMode="numeric"
              min={2021}
              value={year}
              onChange={(e)=>setYear(e.target.value)}
              placeholder="2023"
              required
            />
          </div>

          <label className="label">رفع الملف <span className="muted">(حتى 10MB — PDF/JPG/PNG)</span></label>
          <input className="file" type="file" accept=".pdf,.jpg,.jpeg,.png"
                 onChange={(e)=>setFile(e.target.files?.[0] || null)} required/>

          <button type="submit" disabled={loading} className="button">
            {loading ? 'جارٍ الإرسال…' : 'إرسال'}
          </button>

          {msg?.err && <div className="error">{msg.err}</div>}
          {msg?.ok &&  <div className="success">{msg.ok}</div>}
        </form>
      </main>

      <style jsx global>{`
        :root{
          --brand:#0A7E3B;
          --brand-700:#075F2C;
          --brand-50:#E8F3EC;
          --text:#0F172A;
          --muted:#6B7280;
          --ring:#34D399;
        }
        body{ margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; }
      `}</style>

      <style jsx>{`
        .page{
          min-height:100vh;
          background:
            radial-gradient(1200px 600px at 0% 0%, rgba(10,126,59,0.06), transparent 60%),
            radial-gradient(1200px 600px at 100% 100%, rgba(10,126,59,0.05), transparent 60%),
            var(--brand-50);
          display:flex; align-items:center; justify-content:center;
          padding:40px 12px;
        }
        .logoWrap{ position:fixed; top:16px; inset-inline-start:16px; }
        .logo{
          width:80px; height:80px; object-fit:contain;
          border-radius:10px; background:#fff; padding:6px;
          box-shadow:0 6px 24px rgba(0,0,0,0.08);
        }
        .card{
          width:100%; max-width:560px; background:#fff; border-radius:16px;
          box-shadow:0 20px 60px rgba(0,0,0,0.08);
          padding:24px 20px; border:1px solid rgba(16,185,129,0.10);
        }
        .title{ margin:8px 0 22px; text-align:center; font-size:30px; font-weight:900; color:var(--text); }
        .label{ display:block; margin:10px 0 6px; color:var(--text); font-weight:800; }
        .label-inline{ margin:0; align-self:center; }
        .muted{ color:var(--muted); font-weight:600; }

        .input{
          width:100%; padding:12px 14px; background:#fff;
          border:1px solid #E5E7EB; border-radius:12px; font-size:16px;
          transition:border .15s, box-shadow .15s;
        }
        .input-sm{ padding:9px 12px; font-size:15px; border-radius:10px; }
        .input:focus{
          outline:none; border-color:var(--ring);
          box-shadow:0 0 0 3px rgba(52,211,153,0.25);
        }
        .file{ width:100%; margin:8px 0 16px; }

        .row{
          display:grid;
          grid-template-columns: 1fr 130px;
          gap:12px; align-items:center; margin:12px 0 8px;
        }
        .input-year{ text-align:center; }
        .input-year::-webkit-outer-spin-button,
        .input-year::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
        .input-year{ -moz-appearance:textfield; }

        .button{
          width:100%; padding:13px 16px; border:none; border-radius:12px;
          color:#fff; font-size:17px; font-weight:900; cursor:pointer;
          background:linear-gradient(180deg, var(--brand) 0%, var(--brand-700) 100%);
          box-shadow:0 10px 24px rgba(10,126,59,0.22);
          transition:transform .08s ease, filter .12s ease;
        }
        .button:disabled{ opacity:.7; cursor:not-allowed; }
        .button:not(:disabled):active{ transform:translateY(1px); filter:saturate(1.1); }

        .error{ margin-top:12px; color:#b00020; font-weight:800; }
        .success{ margin-top:12px; color:var(--brand-700); font-weight:900; }

        @media (max-width: 360px){
          .row{ grid-template-columns: 1fr 110px; }
        }
      `}</style>
    </div>
  );
}
