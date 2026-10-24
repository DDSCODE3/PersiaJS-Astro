---
title: "Promise و async/await: مدیریت خطا بدون سردرگمی"
description: "چند الگوی ساده برای مدیریت خطا در کد ناهمگام جاوااسکریپت، از try/catch تا Promise.allSettled."
pubDate: 2026-10-22
author: "PersiaJS Team"
authorLinkedIn: "https://www.linkedin.com/company/persiajs"
tags: ["JavaScript", "Async"]
lang: "fa"
linkedinUrl: "https://www.linkedin.com/company/persiajs"
---

این هم یک **مقاله نمونه** برای تست صفحه‌ی مقالات و فیلتر تگ‌هاست.

## try/catch با async/await

داخل تابع `async` می‌توانید خطا را مثل کد همگام بگیرید:

```ts
async function loadUser(id: string) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("loadUser failed:", error);
    return null;
  }
}
```

نکته: `fetch` برای پاسخ‌های 404 یا 500 خطا پرتاب نمی‌کند. خودتان باید `res.ok` را بررسی کنید.

## چند کار موازی: Promise.allSettled

اگر می‌خواهید یک خطا بقیه‌ی نتیجه‌ها را خراب نکند، به‌جای `Promise.all` از `Promise.allSettled` استفاده کنید:

```js
const results = await Promise.allSettled([
  fetch("/api/a"),
  fetch("/api/b"),
]);

for (const r of results) {
  if (r.status === "fulfilled") console.log("ok", r.value.status);
  else console.log("failed", r.reason);
}
```

## جمع‌بندی

- همیشه `res.ok` را بعد از `fetch` بررسی کنید.
- برای کارهای مستقل، `Promise.allSettled` امن‌تر از `Promise.all` است.
