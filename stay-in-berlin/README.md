# RO by HAA&D – website setup

## 1. Fill in the placeholders
Search all files for `{{` and replace:
- `{{DOMAIN}}` – your domain without https, e.g. `stayinberlin-prenzlauerberg.de`
- Impressum / privacy: `{{FULL_NAME}}`, `{{STREET_AND_NUMBER}}`, `{{POSTCODE}}`, `{{EMAIL}}`, `{{PHONE}}`; remove `{{REVIEW_THIS_TEXT_BEFORE_PUBLISHING}}` after checking the text
Also check the promises in the copy: "reply within 24 hours", video-call viewing, deposit secures dates.

## 2. Photos
Already in /images (resized, metadata removed). To swap one, keep the same file name.

## 3. Deploy on Netlify
1. netlify.com → Add new site → Deploy manually → drag this folder (or connect a GitHub repo).
   The calendar needs the function, so use drag-and-drop of the whole folder or Git, not just the HTML.
2. Domain: Site configuration → Domain management → add your domain.

## 4. Availability (Google Calendar)
1. Create a separate calendar, e.g. "Apartment". Add one all-day event per booking or family stay
   (single events; recurring events are not read). Event titles stay private.
2. Calendar settings → Integrate calendar → copy "Secret address in iCal format".
3. Netlify → Site configuration → Environment variables → add `ICAL_URL` = that address. Redeploy.
4. Optional: HousingAnywhere/Wunderflats iCal export can be imported into the same Google calendar.

## 5. Booking emails
Netlify → Forms → enable form detection → redeploy → Forms → Form notifications → Email notification
→ your address, form "booking-request". Free plan: 100 submissions/month.

## 6. After launch
- Google Search Console: add the domain, submit /sitemap.xml.
- Link the site from the Instagram bio and LinkedIn; ask past tenants for a short written review to add.
