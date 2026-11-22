---
name: ألعاب الجلسة
description: واجهة داكنة هادئة بلون تمييز واحد ذهبي مطفي، وبطاقات رمادية مزرقة بحدود رفيعة.
colors:
  bg: "#0b0e14"
  panel: "#141a25"
  panel-raised: "#1a2131"
  panel-hover: "#212a3d"
  line: "#252d3f"
  line-strong: "#34405a"
  text: "#eef0f5"
  muted: "#a0aabd"
  dim: "#7a859b"
  gold: "#d6b36a"
  gold-bright: "#e8cc8f"
  on-gold: "#1b1507"
  blue: "#8fb4ff"
  ok: "#6fcf97"
  bad: "#ec8077"
typography:
  display:
    fontFamily: "Readex Pro, Tahoma, Arial, sans-serif"
    fontSize: "clamp(46px, 7.4vw, 88px)"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Readex Pro, Tahoma, Arial, sans-serif"
    fontSize: "clamp(34px, 4.4vw, 48px)"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Readex Pro, Tahoma, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Readex Pro, Tahoma, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Readex Pro, Tahoma, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
rounded:
  sm: "9px"
  md: "12px"
  lg: "18px"
  xl: "24px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.on-gold}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.gold-bright}"
  button-secondary:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "50px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "22px"
---

# Design System: ألعاب الجلسة

## Overview

**Creative North Star: "قاعة عرض هادئة بالليل"**

واجهة داكنة فخمة لسهرة عائلية على شاشة واحدة. كل شيء رمادي مزرق عميق، ولون واحد فقط يميّز: ذهبي مطفي للإجراء الأساسي والإجابة الصحيحة والمؤشرات. الحدود رفيعة (1px) والظلال خفيفة، والخط واحد (Readex Pro) بأوزان مختلفة.

**Key Characteristics:**
- لون تمييز واحد. الأزرق الفاتح يظهر فقط للفريق الثاني، والأخضر والأحمر للنجاح والخطأ.
- حدود رفيعة بدل الإطارات السميكة، وبطاقات متساوية الشكل.
- عناوين كبيرة بوزن 600 إلى 700 بدون زخرفة.

## Colors

### Primary
- **ذهبي مطفي** (#d6b36a): الأزرار الأساسية، الإجابة المكشوفة، الأيقونات، المؤشر الحالي. النص فوقه #1b1507.

### Secondary
- **أزرق فاتح** (#8fb4ff): الفريق الثاني فقط.

### Neutral
- **خلفية الصفحة** (#0b0e14)، **اللوحة** (#141a25)، **اللوحة المرفوعة** (#1a2131).
- **الخطوط** (#252d3f و#34405a)، **النص** (#eef0f5)، **الثانوي** (#a0aabd)، **الباهت** (#7a859b).
- **وظيفي:** أخضر (#6fcf97) للنجاح، أحمر هادئ (#ec8077) للخطأ، بخلفيات شفافة 12%.

### Named Rules
**قاعدة اللون الواحد.** لا يضاف لون تمييز ثاني. الألوان الوظيفية تظهر فقط في حالات النجاح والخطأ.

## Typography

**Font:** Readex Pro (محلي، أوزان 300 إلى 600 متغيرة).

### Hierarchy
- **Display** (700، حتى 88px): عنوان الصفحة الرئيسية.
- **Headline** (600، 34 إلى 48px): عناوين الأقسام والنوافذ.
- **Title** (600، 24px): عناوين البطاقات.
- **Body** (400، 16px، سطر 1.7): الفقرات. الأرقام جدولية.
- **Label** (400، 13px): الشارات والتسميات.

## Layout

عمود مركزي بعرض 1180px وهامش 24px. المحلات عمودان، الكاتاجوري ثلاثة ثم اثنان ثم واحد، ولوحة الإجابات عمودان (1 إلى 5 ثم 6 إلى 10). يتكدس كل شيء عند 760px، وزر التثبيت في خمن الموقع يلصق أسفل الشاشة.

## Elevation & Depth

عمق خفيف: خط علوي ساطع 4% وظل بعيد مموه. عند الوقوف ترتفع البطاقة 3 إلى 4px وتتحول حدودها للذهبي.

## Shapes

زوايا 12 إلى 24px، والشارات حبوب كاملة، وأزرار الأيقونات دوائر.

## Components

### Buttons
الأساسي ذهبي مسطح بنص داكن، يفتح قليلًا عند الوقوف. الثانوي بحد رفيع. حلقة التركيز ذهبية 2px.

### Cards / Containers
بطاقة الكاتاجوري والمحل: لوحة #141a25 بحد 1px، أيقونة القسم في مربع ذهبي شفاف، سهم دائري يمتلئ ذهبيًا عند الوقوف.

### Inputs / Fields
حقل داكن (#0f131b) بحد 1px، يتحول الحد للذهبي عند التركيز، ومؤشر الكتابة ذهبي.

## Do's and Don'ts

### Do:
- استخدم الذهبي للإجراء الأهم في كل شاشة فقط.
- حافظ على حدود 1px وزوايا كبيرة.

### Don't:
- لا تضف ألوانًا صارخة أو تدرجات أو هالات متوهجة.
- لا تستخدم خطوطًا زخرفية أو ثقيلة جدًا.
- لا تضع شارة صغيرة فوق العنوان.
