# Task: Redesign All Student Portal Pages

## Summary
Redesigned all 8 student portal pages for the EduShelf Library Management System following the updated design system from design.md.

## Design System Applied
- **Primary**: #7C9AA5, Primary dark: #5D7480
- **Text Primary**: #1F2937, Text Secondary**: #6B7280
- **Border**: #E5E7EB, Muted bg**: #F9FAFB
- **Success**: #7CCB7A, Warning**: #F3C47A, Error**: #F28B82, Info**: #84C7E8
- **Glass cards**: `rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]`
- **Primary button**: `bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-2xl`
- **Badge colors**: success=bg-[#E8F0EC] text-[#6B8F83], warning=bg-[#FEF3E2] text-[#C4952A], error=bg-[#FDE8E6] text-[#C25B4F], info=bg-[#E3F2FA] text-[#4A8DB7]
- **Page heading**: `text-[42px] font-bold`
- **Hover lift**: `transition-all duration-200 hover:-translate-y-0.5`
- **Focus ring**: `focus-visible:ring-2 focus-visible:ring-[#5D7480]`
- **Input radius**: `rounded-xl`, Button/Card radius: `rounded-2xl`, Major sections: `rounded-3xl`

## Files Modified
1. `/home/z/my-project/src/app/(student)/student/dashboard/page.jsx` - Dashboard with StatsCard, borrowed books, recent activity, recommendations
2. `/home/z/my-project/src/app/(student)/student/books/page.jsx` - Book browsing with search, filters, grid, pagination
3. `/home/z/my-project/src/app/(student)/student/books/[id]/page.jsx` - Book detail with metadata, borrow/reserve/wishlist, reviews
4. `/home/z/my-project/src/app/(student)/student/my-books/page.jsx` - Active/History tabs with return button
5. `/home/z/my-project/src/app/(student)/student/reservations/page.jsx` - Active/Past tabs with cancel and queue position
6. `/home/z/my-project/src/app/(student)/student/wishlist/page.jsx` - Grid with availability badges and actions
7. `/home/z/my-project/src/app/(student)/student/notifications/page.jsx` - Grouped by date with type icons and mark as read
8. `/home/z/my-project/src/app/(student)/student/profile/page.jsx` - Profile card, edit form, change password

## Key Changes from Previous Design
- Replaced all emerald/teal color references with design.md colors (#7C9AA5, #5D7480, etc.)
- Replaced all Card components from shadcn/ui with glass-card style divs
- Changed page headings from text-2xl to text-[42px] font-bold
- Applied glass-card style (bg-white/90 backdrop-blur) to all content cards on gradient bg
- Applied badge color system from design.md
- Added hover lift effects (hover:-translate-y-0.5) on interactive cards
- Applied proper border radius hierarchy (rounded-xl for inputs, rounded-2xl for buttons, rounded-3xl for sections)
- Applied focus-visible:ring-2 focus-visible:ring-[#5D7480] on form inputs
- Replaced destructive variant buttons with explicit bg-[#F28B82] style
- Used proper gradient covers matching design system colors

## Verification
- All 8 pages return HTTP 200
- ESLint passes with no errors
- All pages compile successfully in dev server
