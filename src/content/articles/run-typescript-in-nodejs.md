---
title: "اجرای مستقیم TypeScript در Node.js بدون ts-node و tsx"
description: "Node.js حالا فایل .ts را بدون مرحله‌ی build اجرا می‌کند. ببینید type stripping چیست، چه سینتکسی پشتیبانی نمی‌شود و تنظیم درست tsconfig چیست."
pubDate: 2026-10-26
author: "تیم PersiaJS"
authorLinkedIn: "https://www.linkedin.com/company/persiajs"
authorBio: "تیم PersiaJS جامعه‌ای از توسعه‌دهندگان فارسی‌زبان است که تجربه و دانش جاوااسکریپت را با هم به اشتراک می‌گذارند."
coverImage: "../../assets/covers/node-typescript.png"
tags: ["Node.js", "TypeScript"]
lang: "fa"
telegramUrl: "https://t.me/joinchat/BcZHTxkf2MoIC1pHxJ_xSw"
---

> اطلاعات این مقاله تا آبان ۱۴۰۵ بررسی شده است. شماره‌ی نسخه‌ها را با مستندات رسمی Node.js تطبیق دهید.

سال‌ها برای اجرای یک فایل TypeScript در Node.js باید یکی از این ابزارها را نصب می‌کردید: `ts-node`، `tsx` یا یک مرحله‌ی build با `tsc`. حالا ساده‌ترین حالت این است:

```bash
node server.ts
```

بدون flag، بدون ابزار اضافه. این مقاله توضیح می‌دهد چطور کار می‌کند، چه چیزهایی را پشتیبانی نمی‌کند و چطور پروژه‌تان را برایش آماده کنید.

## از آزمایشی تا پایدار

مسیر این قابلیت در چند مرحله طی شد:

- **Node.js 22.6:** با flag به نام `--experimental-strip-types` معرفی شد.
- **Node.js 23.6 و 22.18:** به‌طور پیش‌فرض روشن شد. نسخه‌ی 22.18 از خط LTS است، پس در LTS هم بدون flag کار کرد.
- **Node.js 24.12 و 25.2:** دیگر آزمایشی نیست و هشدار آزمایشی هم نمی‌دهد. در مستندات رسمی هم در سطح پایدار (Stability 2) قرار دارد.

یعنی اگر از Node.js 24 استفاده می‌کنید، می‌توانید با خیال راحت به آن تکیه کنید.

## Type stripping چطور کار می‌کند؟

Node.js تایپ‌ها را **نمی‌فهمد و بررسی نمی‌کند**. فقط آن‌ها را حذف می‌کند و به‌جایشان فاصله‌ی خالی می‌گذارد. به همین دلیل شماره‌ی خط‌ها در خطاها درست می‌ماند و به source map نیاز نیست. این کار با موتوری به نام amaro انجام می‌شود.

نتیجه‌ی مهم این طراحی: **بررسی تایپ هنوز با `tsc` است.** Node.js اگر تایپ را اشتباه بنویسید، اعتراضی نمی‌کند. برنامه اجرا می‌شود و فقط وقتی مقدار واقعی با تایپ نخواند، موقع اجرا مشکل پیدا می‌کنید. پس در CI یا pre-commit این را بگذارید:

```bash
npx tsc --noEmit
```

## چه چیزهایی کار نمی‌کند؟

چون Node.js فقط حذف می‌کند و کد تازه‌ای تولید نمی‌کند، هر قابلیتی که TypeScript برایش کد جاوااسکریپت می‌سازد، پشتیبانی نمی‌شود:

- `enum`
- `namespace` که کد اجرایی دارد
- ویژگی‌های پارامتر در سازنده‌ی کلاس (مثل `constructor(private x: number)`)
- سینتکس `import foo = require(...)`

برای اینکه زودتر از اجرا مطلع شوید، از TypeScript 5.8 به بعد گزینه‌ی `erasableSyntaxOnly` را روشن کنید. با آن، `tsc` هر سینتکس غیرقابل‌حذف را همان لحظه خطا می‌دهد.

اگر لازم دارید `enum` را نگه دارید، دو راه هست: به‌جایش یک شیء `as const` بنویسید یا Node.js را با flag به نام `--experimental-transform-types` اجرا کنید. راه اول ساده‌تر و آینده‌نگرتر است:

```ts
export const Direction = {
  Up: "up",
  Down: "down",
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];
```

## تنظیم tsconfig.json

Node.js اصلاً `tsconfig.json` را نمی‌خواند. این فایل فقط برای `tsc` و ویرایشگر شماست، پس باید با رفتار Node.js هماهنگش کنید:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true
  }
}
```

دو نکته‌ی مهم:

1. **پسوند در import:** باید `.ts` را صریح بنویسید، چون Node.js مثل ESM معمولی حدس نمی‌زند.
2. **`import type`:** تایپ‌ها را با کلمه‌ی `type` وارد کنید. بدون آن، Node.js فکر می‌کند مقدار واقعی است و خطا می‌دهد. گزینه‌ی `verbatimModuleSyntax` شما را مجبور به رعایت این قاعده می‌کند.

## یک مثال کامل

```ts
// greet.ts
export function greet(path: string): string {
  return `Hello from ${path}`;
}
```

```ts
// server.ts
import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";
import { greet } from "./greet.ts";

const server = createServer((req: IncomingMessage, res) => {
  res.end(greet(req.url ?? "/"));
});

server.listen(3000);
```

اجرا با `node server.ts` و برای راه‌اندازی مجدد خودکار هنگام تغییر فایل، `node --watch server.ts`.

## محدودیت‌های دیگر

- **فایل‌های داخل `node_modules`:** Node.js فایل TypeScript را در آن پوشه اجرا نمی‌کند. پکیجی که منتشر می‌کنید باید جاوااسکریپت باشد.
- **قابلیت‌های وابسته به tsconfig:** مثل `paths` برای alias یا decorators تجربی، چون Node.js tsconfig را نمی‌خواند، کار نمی‌کنند.
- **پروژه‌های بزرگ با decorator:** مثل سرویس‌های NestJS همچنان به build نیاز دارند.

## کی از این روش استفاده کنیم؟

مناسب است برای اسکریپت‌ها، ابزارهای خط فرمان، فایل‌های تنظیمات، سرورهای کوچک و پروژه‌های جدید که از اول با `erasableSyntaxOnly` شروع می‌شوند. اگر پروژه‌ی قدیمی دارید که پر از `enum` و decorator است، فعلاً `tsx` یا build را نگه دارید و آهسته به سمت سینتکس قابل‌حذف بروید.

## جمع‌بندی

- از Node.js 22.18 و 24 به بعد، `node file.ts` بدون flag کار می‌کند.
- Node.js تایپ‌ها را حذف می‌کند، ولی بررسی نمی‌کند. `tsc --noEmit` را جدا اجرا کنید.
- `enum`، `namespace` اجرایی و ویژگی‌های پارامتر پشتیبانی نمی‌شوند. `erasableSyntaxOnly` را روشن کنید.
- پسوند `.ts` را در import بنویسید و تایپ‌ها را با `import type` وارد کنید.

## منابع

- [مستندات Node.js: TypeScript](https://nodejs.org/api/typescript.html)
- [مستندات TypeScript: erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)
