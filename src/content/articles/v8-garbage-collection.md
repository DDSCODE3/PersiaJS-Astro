---
title: "چگونه V8 حافظه را مدیریت می‌کند: آشنایی با Garbage Collection"
description: "نگاهی ساده به نسل‌های حافظه در V8، الگوریتم Scavenger و Mark-Sweep، و راه‌های جلوگیری از نشت حافظه در جاوااسکریپت."
pubDate: 2026-10-20
author: "PersiaJS Team"
authorLinkedIn: "https://www.linkedin.com/company/persiajs"
authorBio: "تیم PersiaJS جامعه‌ای از توسعه‌دهندگان فارسی‌زبان است که دانش جاوااسکریپت را به اشتراک می‌گذارند."
coverImage: "../../assets/covers/v8-gc.png"
tags: ["JavaScript", "V8", "Performance"]
lang: "fa"
telegramUrl: "https://t.me/joinchat/BcZHTxkf2MoIC1pHxJ_xSw"
---

این مقاله یک **نمونه آزمایشی** است. بعد از ساخت پنل مدیریت می‌توانید آن را حذف کنید و مقاله‌های واقعی را جایگزین کنید.

## چرا Garbage Collection مهم است؟

در جاوااسکریپت حافظه را دستی آزاد نمی‌کنیم. موتور V8 خودش اشیایی را که دیگر قابل دسترسی نیستند پیدا می‌کند و پاک می‌کند. اگر این فرایند را نشناسیم، ممکن است بدون اینکه بفهمیم دچار نشت حافظه (memory leak) شویم.

## نسل جوان و نسل پیر

V8 حافظه‌ی heap را به دو بخش اصلی تقسیم می‌کند، چون اکثر اشیا عمر کوتاهی دارند.

### نسل جوان (Young Generation)

اشیای تازه‌ساخته‌شده اینجا قرار می‌گیرند. این بخش کوچک است و با الگوریتم Scavenger پاکسازی می‌شود. اشیایی که چند بار از پاکسازی جان سالم به در ببرند، به نسل پیر منتقل می‌شوند.

### نسل پیر (Old Generation)

اشیای ماندگار اینجا هستند. پاکسازی این بخش گران‌تر است و با روش Mark-Sweep-Compact انجام می‌شود. V8 بخشی از کار را به‌صورت تدریجی و همزمان با اجرای برنامه انجام می‌دهد تا صفحه یخ نزند.

## یک نشت حافظه‌ی رایج

مثال زیر یک `cache` سراسری است که هیچ‌وقت خالی نمی‌شود:

```js
const cache = [];

function handleRequest(data) {
  cache.push(data); // این داده‌ها هرگز آزاد نمی‌شوند
  return data.length;
}
```

راه‌حل ساده، محدود کردن اندازه یا استفاده از `WeakMap` است، وقتی کلیدها شیء هستند:

```js
const cache = new WeakMap();

function getMeta(user) {
  if (!cache.has(user)) {
    cache.set(user, { loadedAt: Date.now() });
  }
  return cache.get(user);
}
```

نشت دیگر، event listener فراموش‌شده است. همیشه آن را پاک کنید:

```js
function mount() {
  const onResize = () => console.log(window.innerWidth);
  window.addEventListener("resize", onResize);

  return () => window.removeEventListener("resize", onResize);
}
```

## جمع‌بندی

- بیشتر اشیا زود می‌میرند، پس نسل جوان کوچک و سریع است.
- نشت حافظه یعنی چیزی هنوز به شیء اشاره می‌کند، پس GC نمی‌تواند آن را پاک کند.
- ابزار Memory در DevTools بهترین راه پیدا کردن نشت است.
