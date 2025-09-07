import Head from 'next/head';
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

  const allowedTypes = useMemo(() => !stage ? [] : (stage === 'UNIVERSITY' ? CERT_UNI : CERT_SCHOOL), [stage]);
  const allowedGrades = useMemo(() => {
    if (stage === 'PRIMARY') return [1,2,3,4,5,6];
    if (stage === 'MIDDLE' || stage === 'HIGH') return [1,2,3];
    return [];
  }, [stage]);

  useEffect(() => { if (ctype && !allowedTypes.includes(ctype)) setCtype(''); }, [ctype, allowedTypes]);
  useEffect(() => { if (stage === 'UNIVERSITY' && grade) setGrade(''); }, [stage, grade]);

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
      // reset
      setFullName(''); setStage(''); setGrade(''); setCtype(''); setYear(''); setFile(null);
    } catch (err) {
      setMsg({err: err.message || 'خطأ غير متوقع'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" lang="ar" className="page">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="logoWrap">
        <img src="/IMG_7618.jpeg" alt="الشعار" className="logo" />
      </div>

      <main className="card">
        <h1 className="title">حياكم الله!</h1>

        <form onSubmit={submitForm} className="form">
          <div className="field">
            <label className="label">الاسم الثلاثي</label>
            <input
              className="control"
              type="text"
              value={fullName}
              onChange={(e)=>setFullName(e.target.value)}
              placeholder="مثال: محمد أحمد العبدالله"
              maxLength={60}
              required
            />
          </div>

          <div className="field">
            <label className="label">المرحلة العلمية</label>
            <select className="control" value={stage} onChange={(e)=>setStage(e.target.value)} required>
              <option value="">اختر المرحلة</option>
              {STAGES.map(s => <option key={s} value={s}>{stageLabel[s]}</option>)}
            </select>
          </div>

          {stage && stage !== 'UNIVERSITY' && (
            <div className="field">
              <label className="label">الصف</label>
              <select className="control" value={grade} onChange={(e)=>setGrade(e.target.value)} required>
                <option value="">اختر الصف</option>
                {allowedGrades.map(g => (
                  <option key={g} value={g}>
                    {stage==='PRIMARY' ? ['أولى','ثاني','ثالث','رابع','خامس','سادس'][g-1] : ['أولى','ثاني','ثالث'][g-1]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label className="label">نوع الشهادة</label>
            <select className="control" value={ctype} onChange={(e)=>setCtype(e.target.value)} required disabled={!stage}>
              <option value="">{stage ? 'اختر نوع الشهادة' : 'اختر المرحلة أولاً'}</option>
              {(stage ? (stage==='UNIVERSITY'?CERT_UNI:CERT_SCHOOL) : []).map(t =>
                <option key={t} value={t}>{typeLabel[t]}</option>
              )}
            </select>
          </div>

          <div className="row">
            <label className="label label-inline">سنة التخرج</label>
            <input
              className="control control-year"
              type="number"
              inputMode="numeric"
              min={2021}
              value={year}
              onChange={(e)=>setYear(e.target.value)}
              placeholder="2023"
              required
            />
          </div>

          <div className="field">
            <label className="label">رفع الملف <span className="muted">(حتى 10MB — PDF/JPG/PNG)</span></label>
            <input className="file" type="file" accept=".pdf,.jpg,.jpeg,.png"
                   onChange={(e)=>setFile(e.target.files?.[0] || null)} required/>
          </div>

          <button type="submit" disabled={loading} className="button">
            {loading ? 'جارٍ الإرسال…' : 'إرسال'}
          </button>

          {msg?.err && <div className="alert error">{msg.err}</div>}
          {msg?.ok &&  <div className="alert success">{msg.ok}</div>}
        </form>
      </main>

      {/* Global */}
      <style jsx global>{`
        :root{
          --brand:#0A7E3B; --brand-700:#075F2C; --brand-50:#EAF6EF;
          --text:#0F172A; --muted:#6B7280; --ring:#34D399;
          --input-bg:#F5FAF7; --input-border:#DDE7E1; --input-shadow:rgba(10,126,59,.06);
        }
        body{ margin:0; font-family:'Tajawal', system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans Arabic", sans-serif; }
      `}</style>

      {/* Component */}
      <style jsx>{`
        .page{
          min-height:100vh;
          background: radial-gradient(1000px 600px at 0% 0%, rgba(10,126,59,.05), transparent 65%),
                      radial-gradient(1000px 600px at 100% 100%, rgba(10,126,59,.04), transparent 65%),
                      var(--brand-50);
          display:flex; align-items:center; justify-content:center; padding:40px 12px;
        }
        .logoWrap{ position:fixed; top:12px; inset-inline-start:12px; z-index:9; transform:translateZ(0); pointer-events:none; }
        .logo{ width:68px; height:68px; object-fit:contain; border-radius:16px; background:#fff; padding:6px;
               box-shadow:0 12px 28px rgba(0,0,0,.08); }
        .card{
          width:100%; max-width:560px; background:#fff; border-radius:20px;
          box-shadow:0 30px 70px rgba(0,0,0,.08);
          padding:26px 22px; border:1px solid rgba(16,185,129,.10);
        }
        .title{ margin:6px 0 18px; text-align:center; font-size:30px; font-weight:900; color:var(--text); letter-spacing:.2px; }

        .form{ display:grid; gap:12px; }
        .field{ display:grid; gap:6px; }
        .label{ color:var(--text); font-weight:800; }
        .label-inline{ align-self:center; margin:0; }
        .muted{ color:var(--muted); font-weight:600; }

        .control{
          width:100%; font-size:16px; height:44px; /* أنيق وواضح */
          background:var(--input-bg);
          border:1px solid var(--input-border);
          border-radius:16px;
          padding:10px 14px;
          box-shadow:inset 0 1px 0 #fff, 0 1px 2px var(--input-shadow);
          transition:border .15s, box-shadow .15s, background .15s;
        }
        select.control{ appearance:none; }
        .control:focus{
          outline:none; border-color:var(--ring);
          box-shadow:0 0 0 4px rgba(52,211,153,.22), inset 0 1px 0 #fff, 0 1px 2px var(--input-shadow);
          background:#fff;
        }

        .row{ display:grid; grid-template-columns: 1fr 120px; gap:10px; align-items:center; }
        .control-year{ text-align:center; letter-spacing:.5px; }

        .file{ width:100%; }

        .button{
          width:100%; height:48px; border:none; border-radius:14px; color:#fff;
          font-size:17px; font-weight:900; cursor:pointer;
          background:linear-gradient(180deg, var(--brand) 0%, var(--brand-700) 100%);
          box-shadow:0 12px 28px rgba(10,126,59,.22);
          transition:transform .08s ease, filter .12s ease;
        }
        .button:disabled{ opacity:.7; cursor:not-allowed; }
        .button:not(:disabled):active{ transform:translateY(1px); filter:saturate(1.08); }

        .alert{ margin-top:10px; padding:10px 12px; border-radius:12px; font-weight:800; }
        .error{ color:#B00020; background:#FDECEE; border:1px solid #F9C8CE; }
        .success{ color:var(--brand-700); background:#ECFDF5; border:1px solid #BBF7D0; }

        @media (max-width:360px){
          .row{ grid-template-columns: 1fr 108px; }
          .logo{ width:62px; height:62px; }
          .control{ height:42px; border-radius:14px; }
        }
      `}</style>
    </div>
  );
}
