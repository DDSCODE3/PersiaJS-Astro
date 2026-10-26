---
title: "React Compiler و useEffectEvent: کمتر useMemo، کمتر باگ"
description: "React Compiler 1.0 حافظه‌سازی را خودکار می‌کند و React 19.2 ابزار useEffectEvent را آورد. ببینید چه چیزی عوض می‌شود و چه چیزی هنوز با شماست."
pubDate: 2026-10-26
author: "تیم PersiaJS"
authorLinkedIn: "https://www.linkedin.com/company/persiajs"
authorBio: "تیم PersiaJS جامعه‌ای از توسعه‌دهندگان فارسی‌زبان است که تجربه و دانش جاوااسکریپت را با هم به اشتراک می‌گذارند."
coverImage: "../../assets/covers/react-compiler.png"
tags: ["React", "Performance", "JavaScript"]
lang: "fa"
telegramUrl: "https://t.me/joinchat/BcZHTxkf2MoIC1pHxJ_xSw"
---

> اطلاعات این مقاله تا آبان ۱۴۰۵ بررسی شده است. API های React را همیشه با react.dev تطبیق دهید.

اگر React می‌نویسید، حتماً لحظه‌ای را تجربه کرده‌اید که نمی‌دانید `useCallback` را کجا بگذارید، یا یک `useEffect` به‌خاطر وابستگی اشتباه بی‌دلیل دوباره اجرا می‌شود. در یک سال اخیر دو چیز این وضعیت را عوض کرده است: **React Compiler 1.0** و **`useEffectEvent`** در React 19.2. این مقاله هر دو را توضیح می‌دهد و روشن می‌کند چه چیزی هنوز با خود شماست.

## React Compiler چیست؟

React Compiler ابزاری است که موقع build کد شما را تحلیل می‌کند و حافظه‌سازی (memoization) را خودکار اضافه می‌کند. یعنی همان کاری که الان با `useMemo`، `useCallback` و `React.memo` دستی انجام می‌دهید.

نسخه‌ی 1.0 آن در ۷ اکتبر ۲۰۲۵ به‌عنوان اولین نسخه‌ی پایدار منتشر شد. نکته‌های مهم درباره‌اش:

- **با React 19 بهتر کار می‌کند،** ولی برای نسخه‌های 17 و 18 هم با پکیج `react-compiler-runtime` قابل استفاده است.
- حافظه‌سازی خودکار گاهی از دستی دقیق‌تر است، چون می‌تواند جاهایی را هم پوشش بدهد که هوک‌ها نمی‌توانند، مثلاً بعد از یک `return` زودهنگام.
- تیم React می‌گوید `useMemo` و `useCallback` حذف نشده‌اند. آن‌ها را به‌عنوان «دریچه‌ی فرار» نگه دارید، هر جا کنترل دقیق لازم است، مثلاً وابستگی یک effect.
- برای کد جدید توصیه این است که ابتدا به کامپایلر تکیه کنید و فقط در صورت نیاز دستی حافظه‌سازی کنید.

## راه‌اندازی

در پروژه‌ی Vite، پلاگین Babel را به تنظیمات `@vitejs/plugin-react` اضافه می‌کنید:

```bash
npm install -D babel-plugin-react-compiler@latest
```

```js
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
});
```

برای Next.js، پشتیبانی کامپایلر در Next.js 16 پایدار اعلام شده است. در پروژه‌ی بزرگ بهتر است تدریجی جلو بروید: ابتدا چند کامپوننت را با کامپایلر امتحان کنید و اگر کامپوننتی مشکل داشت، با دایرکتیو `"use no memo"` موقتاً از کامپایلر کنارش بگذارید.

## قانون اصلی: Rules of React

کامپایلر فرض می‌کند کد شما از «قواعد React» پیروی می‌کند. مهم‌ترین‌ها:

- رندر باید خالص باشد. یعنی با ورودی یکسان، خروجی یکسان بدهد.
- props و state را مستقیم تغییر ندهید.
- هوک‌ها فقط در سطح بالای کامپوننت یا هوک دیگر صدا زده شوند.

```jsx
// اشتباه: تغییر مستقیم prop
function List({ items }) {
  items.sort(); // آرایه‌ی اصلی را تغییر می‌دهد
  return items.map((i) => <li key={i.id}>{i.name}</li>);
}

// درست: کپی بگیرید
function List({ items }) {
  const sorted = [...items].sort();
  return sorted.map((i) => <li key={i.id}>{i.name}</li>);
}
```

کامپایلر هنگام کار بررسی‌هایی هم انجام می‌دهد و کدی را که این قواعد را شکسته، بهینه نمی‌کند. افزونه‌ی ESLint رسمی React (`eslint-plugin-react-hooks`) هم می‌تواند در رعایت این قواعد کمکتان کند.

## مشکل قدیمی: effect که بی‌دلیل دوباره اجرا می‌شود

کامپایلر مشکل effect ها را حل نمی‌کند. فرض کنید یک اتصال به اتاق چت دارید و می‌خواهید هنگام اتصال، یک اعلان با رنگ تم فعلی نشان بدهید:

```jsx
function ChatRoom({ roomId, theme }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on("connected", () => {
      showNotification("Connected!", theme);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, theme]); // اگر theme عوض شود، اتصال قطع و دوباره برقرار می‌شود
}
```

اگر `theme` را از وابستگی‌ها بردارید، به مقدار قدیمی دسترسی دارید. این همان **stale closure** است که در مقاله‌ی [Closure در جاوااسکریپت](/fa/articles/javascript-closures-explained) دیدیم. هر دو راه بد است: یا اتصال بی‌دلیل قطع می‌شود یا مقدار کهنه می‌خواند.

## useEffectEvent: بخش «رویداد» را جدا کنید

`useEffectEvent` در React 19.2 (۱ اکتبر ۲۰۲۵) آمد. با آن منطقی را که باید «آخرین مقدار» را ببیند ولی نباید effect را دوباره اجرا کند، از effect جدا می‌کنید:

```jsx
import { useEffect, useEffectEvent } from "react";

function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected!", theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on("connected", () => onConnected());
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // فقط roomId
}
```

حالا با تغییر `theme` اتصال دست نمی‌خورد، ولی اعلان همیشه آخرین `theme` را می‌بیند. چند قاعده:

- `useEffectEvent` فقط برای صدا زدن **داخل effect** است. آن را به کامپوننت فرزند یا هوک دیگر پاس ندهید.
- آن را در آرایه‌ی وابستگی‌ها نگذارید.
- فقط برای منطقی استفاده کنید که واقعاً «رویداد» است. اگر یک مقدار واقعاً باید effect را دوباره اجرا کند، همان را در وابستگی‌ها نگه دارید.

## Activity: مخفی کردن بدون از دست دادن state

React 19.2 کامپوننت `<Activity>` را هم اضافه کرد. جایگزینی برای رندر شرطی است وقتی نمی‌خواهید state یک بخش وقتی از دید خارج می‌شود، از بین برود:

```jsx
import { Activity } from "react";

function Tabs({ tab }) {
  return (
    <>
      <Activity mode={tab === "profile" ? "visible" : "hidden"}>
        <ProfileForm />
      </Activity>
      <Activity mode={tab === "settings" ? "visible" : "hidden"}>
        <SettingsForm />
      </Activity>
    </>
  );
}
```

فرمی که نیمه‌پر شده، با رفتن به تب دیگر پاک نمی‌شود. فعلاً دو حالت `visible` و `hidden` دارد.

## چه چیزی هنوز با شماست؟

- کامپایلر **کد کند** را سریع نمی‌کند. الگوریتم بد و درخواست‌های اضافی همچنان مشکل شما هستند.
- کامپایلر برای کدی که قواعد را رعایت نمی‌کند، کاری نمی‌کند. اول کد را درست کنید.
- مدیریت وابستگی‌های effect، تصمیم‌های state و ساختار کامپوننت‌ها همچنان طراحی انسان می‌خواهد.
- پیش و پس از فعال کردن کامپایلر، با React DevTools Profiler اندازه بگیرید. به‌روزرسانی بی‌دلیل را باید ببینید، نه حدس بزنید.

## جمع‌بندی

- React Compiler 1.0 (اکتبر ۲۰۲۵) حافظه‌سازی را خودکار می‌کند. برای کد جدید `useMemo` و `useCallback` را فقط برای کنترل دقیق نگه دارید.
- کامپایلر به رعایت Rules of React وابسته است.
- `useEffectEvent` (React 19.2) مشکل وابستگی effect و stale closure را حل می‌کند، به شرط اینکه فقط برای منطق رویداد استفاده شود.
- `<Activity>` state را موقع مخفی شدن نگه می‌دارد.

## منابع

- [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [مستندات useEffectEvent](https://react.dev/reference/react/useEffectEvent)
- [مستندات React Compiler](https://react.dev/learn/react-compiler)
