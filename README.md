Structure

math-lms/
├── .env.local
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json
├── middleware.js
├── public/
│   ├── logo.svg
│   └── images/
├── lib/
│   ├── supabase.js
│   ├── supabase-admin.js
│   ├── email.js
│   ├── invoice.js
│   ├── stripe.js
│   └── payhere.js
├── components/
│   ├── layout/
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── Sidebar.js
│   │   └── MobileNav.js
│   ├── ui/
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Modal.js
│   │   ├── Badge.js
│   │   ├── Input.js
│   │   ├── Spinner.js
│   │   └── Toast.js
│   ├── course/
│   │   ├── CourseCard.js
│   │   ├── CoursePlayer.js
│   │   ├── LessonList.js
│   │   └── PurchaseModal.js
│   ├── admin/
│   │   ├── CourseForm.js
│   │   ├── LessonForm.js
│   │   ├── PaymentTable.js
│   │   └── UserTable.js
│   └── payment/
│       ├── PayHereButton.js
│       ├── StripeButton.js
│       └── BankTransferModal.js
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── index.js
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   ├── register.js
│   │   │   └── logout.js
│   │   ├── payments/
│   │   │   ├── payhere-callback.js
│   │   │   ├── stripe-webhook.js
│   │   │   ├── create-checkout.js
│   │   │   └── approve-bank.js
│   │   ├── courses/
│   │   │   ├── index.js
│   │   │   └── [id].js
│   │   ├── lessons/
│   │   │   └── [id].js
│   │   ├── invoice/
│   │   │   └── generate.js
│   │   └── email/
│   │       └── send.js
│   ├── auth/
│   │   ├── login.js
│   │   └── register.js
│   ├── courses/
│   │   ├── index.js
│   │   └── [id].js
│   ├── my-courses.js
│   ├── admin/
│   │   ├── index.js
│   │   ├── courses/
│   │   │   ├── index.js
│   │   │   ├── new.js
│   │   │   └── [id]/
│   │   │       └── edit.js
│   │   ├── payments.js
│   │   └── users.js
│   └── profile.js
├── styles/
│   └── globals.css
└── utils/
    ├── formatters.js
    ├── validators.js
    └── constants.js
```


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

