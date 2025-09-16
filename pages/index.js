import Head from 'next/head';
import { useState, useMemo, useEffect } from 'react';

const STAGES = ['PRIMARY','MIDDLE','HIGH','UNIVERSITY'];
const CERT_SCHOOL = ['PRIMARY','MIDDLE','HIGH'];
const CERT_UNI = ['BACHELOR','MASTER','PHD'];

const stageLabel = { PRIMARY:'ابتدائي', MIDDLE:'متوسط', HIGH:'ثانوي', UNIVERSITY:'جامعة' };
const typeLabel  = { PRIMARY:'ابتدائي', MIDDLE:'متوسط', HIGH:'ثانوي', BACHELOR:'بكالوريوس', MASTER:'ماجستير', PHD:'دكتوراه' };
const stageLabelEn = { PRIMARY:'Primary', MIDDLE:'Middle', HIGH:'High', UNIVERSITY:'University' };
const typeLabelEn  = { PRIMARY:'Primary', MIDDLE:'Middle', HIGH:'High', BACHELOR:'Bachelor', MASTER:'Master', PHD:'PhD' };

export default function Home() {
  const [lang, setLang] = useState('ar');
  const [fullName, setFullName] = useState('');
  const [stage, setStage] = useState('');
  const [grade, setGrade] = useState('');
  const [ctype, setCtype] = useState('');
  const [year, setYear] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
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
  useEffect(() => { if (grade && !allowedGrades.includes(Number(grade))) setGrade(''); }, [allowedGrades, grade]);

  const isYearValid = useMemo(() => /^\d{4}$/.test(String(year)) && Number(year) >= 2021, [year]);

  function handleFileChange(e){
    const f = e.target.files?.[0] || null;
    setFileError('');
    if (!f) { setFile(null); return; }
    const ok = ['application/pdf','image/jpeg','image/png'];
    if (!ok.includes(f.type)) { setFile(null); setFileError('الملف يجب أن يكون PDF أو JPG أو PNG.'); return; }
    if (f.size > 10*1024*1024) { setFile(null); setFileError('حجم الملف يتجاوز 10MB.'); return; }
    setFile(f);
  }

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

  const isRTL = lang === 'ar';
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'} className="page">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="logoWrap">
        <img src="/IMG_7618.jpeg" alt="الشعار" className="logo" />
      </div>

      <button className="langToggle" type="button" onClick={()=>setLang(isRTL ? 'en' : 'ar')} aria-label={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}>
        {isRTL ? 'EN' : 'ع'}
      </button>

      <main className="card">
        <h1 className="title">{isRTL ? 'حياكم الله!' : 'Welcome!'}</h1>

        <form onSubmit={submitForm} className="form">
          <div className="field">
            <label className="label" htmlFor="full_name">{isRTL ? 'الاسم الثلاثي' : 'Full name'}</label>
            <input
              className="control"
              type="text"
              id="full_name"
              value={fullName}
              onChange={(e)=>setFullName(e.target.value)}
              placeholder={isRTL ? 'مثال: محمد أحمد العبدالله' : 'e.g., Mohammed Ahmed Al-Abdullah'}
              maxLength={60}
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="stage">{isRTL ? 'المرحلة العلمية' : 'Stage'}</label>
            <select id="stage" className="control" value={stage} onChange={(e)=>setStage(e.target.value)} required>
              <option value="">{isRTL ? 'اختر المرحلة' : 'Select stage'}</option>
              {STAGES.map(s => <option key={s} value={s}>{isRTL ? stageLabel[s] : stageLabelEn[s]}</option>)}
            </select>
          </div>

          {stage && stage !== 'UNIVERSITY' && (
            <div className="field">
              <label className="label" htmlFor="grade">{isRTL ? 'الصف' : 'Grade'}</label>
              <select id="grade" className="control" value={grade} onChange={(e)=>setGrade(e.target.value)} required>
                <option value="">{isRTL ? 'اختر الصف' : 'Select grade'}</option>
                {allowedGrades.map(g => (
                  <option key={g} value={g}>
                    {isRTL
                      ? (stage==='PRIMARY' ? ['أولى','ثاني','ثالث','رابع','خامس','سادس'][g-1] : ['أولى','ثاني','ثالث'][g-1])
                      : (stage==='PRIMARY' ? ['1st','2nd','3rd','4th','5th','6th'][g-1] : ['1st','2nd','3rd'][g-1])}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="ctype">{isRTL ? 'نوع الشهادة' : 'Certificate type'}</label>
            <select id="ctype" className="control" value={ctype} onChange={(e)=>setCtype(e.target.value)} required disabled={!stage}>
              <option value="">{stage ? (isRTL ? 'اختر نوع الشهادة' : 'Select certificate type') : (isRTL ? 'اختر المرحلة أولاً' : 'Select stage first')}</option>
              {(stage ? (stage==='UNIVERSITY'?CERT_UNI:CERT_SCHOOL) : []).map(t =>
                <option key={t} value={t}>{isRTL ? typeLabel[t] : typeLabelEn[t]}</option>
              )}
            </select>
          </div>

          <div className="row">
            <label className="label label-inline" htmlFor="year">{isRTL ? 'سنة التخرج' : 'Graduation year'}</label>
            <input
              className="control control-year"
              type="number"
              inputMode="numeric"
              min={2021}
              id="year"
              value={year}
              onChange={(e)=>setYear(e.target.value)}
              placeholder={isRTL ? '2023' : '2023'}
              pattern="\\d{4}"
              required
            />
            {!isYearValid && year && (
              <div className="hint error-small">{isRTL ? 'سنة التخرج يجب أن تكون 2021 أو أحدث.' : 'Year must be 2021 or newer.'}</div>
            )}
          </div>

          <div className="field">
            <label className="label" htmlFor="file_input">{isRTL ? 'رفع الملف' : 'Upload file'} <span className="muted">{isRTL ? '(حتى 10MB — PDF/JPG/PNG)' : '(up to 10MB — PDF/JPG/PNG)'}</span></label>
            <input id="file_input" className="file" type="file" accept=".pdf,.jpg,.jpeg,.png"
                   onChange={handleFileChange} required/>
            {file && <div className="muted filename">{file.name}</div>}
            {fileError && <div className="hint error-small">{fileError}</div>}
          </div>

          <button type="submit" disabled={loading} className="button">
            {loading ? (isRTL ? 'جارٍ الإرسال…' : 'Submitting…') : (isRTL ? 'إرسال' : 'Submit')}
          </button>

          {msg?.err && <div className="alert error">{msg.err}</div>}
          {msg?.ok &&  <div className="alert success">{msg.ok}</div>}
        </form>
      </main>

      {/* Global */}
      <style jsx global>{`
        :root{
          --brand:#0A7E3B; --brand-700:#0A6E34; --mint:#E8F3EC;
          --text:#0F172A; --muted:#6B7280; --ring:#34D399;
          --input-bg:#F5FAF7; --input-border:#DDE7E1; --input-shadow:rgba(10,126,59,.06);
        }
        body{ margin:0; font-family:'Tajawal', system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans Arabic", sans-serif; }
      `}</style>

      {/* Component */}
      <style jsx>{`
        .page{ min-height:100vh; background:var(--mint); display:flex; align-items:center; justify-content:center; padding:40px 12px; }
        .logoWrap{ position:fixed; top:12px; inset-inline-start:12px; z-index:10; padding:6px; background:#fff; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,.08); }
        .logo{ width:56px; height:56px; object-fit:contain; border-radius:8px; }
        .langToggle{ position:fixed; top:12px; inset-inline-end:12px; z-index:10; height:36px; min-width:36px; border:none; border-radius:10px; background:#fff; color:var(--text); font-weight:900; box-shadow:0 8px 20px rgba(0,0,0,.08); cursor:pointer; }
        .card{ width:100%; max-width:520px; background:#fff; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,.08); padding:22px; border:1px solid rgba(16,185,129,.10); }
        .title{ margin:6px 0 16px; text-align:center; font-size:30px; font-weight:900; color:var(--text); letter-spacing:.2px; }

        .form{ display:grid; gap:10px; }
        .field{ display:grid; gap:6px; }
        .label{ color:var(--text); font-weight:800; }
        .label-inline{ align-self:center; margin:0; }
        .muted{ color:var(--muted); font-weight:600; }
        .hint{ margin-top:6px; font-size:13px; }
        .error-small{ color:#B00020; }

        .control{
          width:100%; font-size:16px; height:46px;
          background:#fff;
          border:1px solid #E5E7EB;
          border-radius:12px;
          padding:10px 12px;
          box-shadow:inset 0 1px 0 #fff, 0 1px 2px var(--input-shadow);
          transition:border .15s, box-shadow .15s, background .15s;
        }
        select.control{ appearance:none; }
        .control:focus{
          outline:none; border-color:var(--brand);
          box-shadow:0 0 0 3px rgba(10,126,59,.15), inset 0 1px 0 #fff, 0 1px 2px var(--input-shadow);
          background:#fff;
        }

        .row{ display:grid; grid-template-columns: 1fr auto; gap:10px; align-items:center; }
        .control-year{ text-align:center; letter-spacing:.5px; width:140px; }

        .file{ width:100%; }

        .button{
          width:100%; height:48px; border:none; border-radius:12px; color:#fff;
          font-size:18px; font-weight:800; cursor:pointer;
          background:linear-gradient(180deg, #0A7E3B 0%, #0A6E34 100%);
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
          .logo{ width:56px; height:56px; }
          .control{ height:44px; border-radius:12px; }
          .control-year{ width:120px; }
        }
      `}</style>
    </div>
  );
}
